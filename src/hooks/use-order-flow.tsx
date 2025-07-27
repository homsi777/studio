

"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Order, Table, TableStatus, MenuItem, PendingSyncOperation, OrderStatus, Expense, UserProfile } from '@/types';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';
import { db, getFromCache, saveToCache, addToSyncQueue, getSyncQueue, clearSyncQueueItem, initializeDb } from '@/lib/indexeddb';
import { v4 as uuidv4 } from 'uuid';

const SYNC_INTERVAL = 10000; // Try to sync every 10 seconds

// --- CONTEXT TYPE ---
interface OrderFlowContextType {
    orders: Order[];
    tables: Table[];
    menuItems: MenuItem[];
    loading: boolean;
    isOnline: boolean;
    isSyncing: boolean;
    fetchAllData: (forceOnline?: boolean) => Promise<void>;
    // Order operations
    submitOrder: (order: Omit<Order, 'id' | 'status' | 'created_at' | 'service_charge' | 'tax' | 'final_total' | 'chef_approved_at' | 'cashier_approved_at' | 'customer_confirmed_at' | 'completed_at'>) => Promise<void>;
    approveOrderByChef: (orderId: string) => Promise<void>;
    approveOrderByCashier: (orderId: string, serviceCharge: number, tax: number) => Promise<void>;
    confirmFinalOrder: (orderId: string) => Promise<void>;
    confirmOrderReady: (orderId:string) => Promise<void>;
    completeOrder: (orderId: string) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
    requestBill: (orderId: string) => Promise<void>;
    requestAttention: (orderId: string) => Promise<void>;
    // Menu operations
    addMenuItem: (itemData: Omit<MenuItem, 'id' | 'quantity' | 'created_at' | 'updated_at'>) => Promise<void>;
    updateMenuItem: (itemId: string, itemData: Partial<Omit<MenuItem, 'id' | 'quantity' | 'created_at' | 'updated_at'>>) => Promise<void>;
    deleteMenuItem: (itemId: string) => Promise<void>;
    // Table operations
    addTable: () => Promise<void>;
    deleteTableByUuid: (uuid: string) => Promise<void>;
}

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(undefined);

// --- HELPER FUNCTION ---
export const formatOrderFromDb = (dbOrder: any): Order => ({
    id: dbOrder.id,
    created_at: dbOrder.created_at,
    session_id: dbOrder.session_id,
    table_uuid: dbOrder.table_uuid,
    table_id: dbOrder.table_id,
    items: dbOrder.items || [],
    status: dbOrder.status,
    subtotal: dbOrder.subtotal || 0,
    service_charge: dbOrder.service_charge || 0,
    tax: dbOrder.tax || 0,
    final_total: dbOrder.final_total || 0,
    chef_approved_at: dbOrder.chef_approved_at,
    cashier_approved_at: dbOrder.cashier_approved_at,
    customer_confirmed_at: dbOrder.customer_confirmed_at,
    completed_at: dbOrder.completed_at,
});


// --- PROVIDER COMPONENT ---
export const OrderFlowProvider = ({ children }: { children: ReactNode }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialFetchCalled = useRef(false);
    
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
        }
    }, []);

    const syncPendingOperations = useCallback(async () => {
        if (!navigator.onLine || isSyncing) {
            console.log('Not syncing: Offline or already syncing.');
            return;
        }
    
        setIsSyncing(true);
        const pendingOperations = await getSyncQueue();
    
        if (pendingOperations.length === 0) {
            setIsSyncing(false);
            return;
        }
    
        console.log(`Attempting to sync ${pendingOperations.length} pending operations.`);
    
        let operationsSyncedCount = 0;
        for (const op of pendingOperations) {
            try {
                if (!op.id) {
                    console.warn("Skipping operation without an ID:", op);
                    continue;
                }
    
                let response;
                // A more generic approach could be used here if operations map directly to API endpoints
                const { operation, data } = op;
                let endpoint = '';
                let method = 'POST'; // Default method
                let body = data;

                switch(operation) {
                    case 'addExpense':
                        endpoint = '/api/v1/expenses';
                        method = 'POST';
                        break;
                    case 'insert_order':
                        endpoint = '/api/v1/orders';
                        method = 'POST';
                        break;
                    case 'update_order':
                        endpoint = `/api/v1/orders/${data.id}`;
                        method = 'PUT';
                        body = data.updates; // Assuming data contains { id, updates }
                        break;
                    // Other cases for different operations...
                    default:
                        console.warn(`Unknown sync operation type: ${operation}`);
                        continue;
                }
                
                response = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });
    
                if (!response.ok) {
                    const errorText = await response.text();
                    // Handle duplicate key error specifically for addExpense
                    if ((operation === 'addExpense' || operation === 'insert_order') && response.status === 500 && errorText.includes('23505')) {
                        console.warn(`Operation ${op.id} (${operation}) failed due to duplicate key. Assuming it was already synced. Clearing from queue.`);
                        await clearSyncQueueItem(op.id);
                        operationsSyncedCount++; // Count it as "synced" since the data is on the server
                        continue; // Move to the next operation
                    }
                    throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to sync'}`);
                }
    
                await clearSyncQueueItem(op.id);
                operationsSyncedCount++;
                console.log(`Operation synced successfully: ${op.operation}`);
    
            } catch (error: any) {
                console.error(`Failed to sync operation ${op.id} (${op.operation}):`, error.message);
                toast({ title: 'خطأ في المزامنة', description: `فشل مزامنة عملية. سيتم المحاولة لاحقاً.`, variant: 'destructive'});
                break; // Stop syncing on first error to maintain order
            }
        }
    
        setIsSyncing(false);
    
        if (operationsSyncedCount > 0) {
            toast({ title: 'نجاح المزامنة', description: `تم مزامنة ${operationsSyncedCount} تغيير بنجاح!` });
            await fetchAllData(true); // Refetch all data after a successful sync
        }
    }, [isSyncing, toast]);


    const fetchAllData = useCallback(async (forceOnline = false) => {
        await initializeDb();
        const online = forceOnline || (typeof window !== 'undefined' && navigator.onLine);
        setIsOnline(online);
        setLoading(true);

        if (online) {
            console.log('Online: Fetching from Supabase...');
            try {
                const [tablesRes, ordersRes, menuItemsRes, expensesRes] = await Promise.all([
                    supabase.from('tables').select('*'),
                    supabase.from('orders').select('*'),
                    supabase.from('menu_items').select('*'),
                    supabase.from('expenses').select('*')
                ]);

                if (tablesRes.error) throw tablesRes.error;
                if (ordersRes.error) throw ordersRes.error;
                if (menuItemsRes.error) throw menuItemsRes.error;
                if (expensesRes.error) throw expensesRes.error;

                const formattedOrders = ordersRes.data.map(formatOrderFromDb);
                
                setTables(tablesRes.data as unknown as Table[]);
                setOrders(formattedOrders);
                setMenuItems(menuItemsRes.data as MenuItem[]);

                await saveToCache('tables', tablesRes.data as unknown as UserProfile[]);
                await saveToCache('orders', formattedOrders);
                await saveToCache('menuItems', menuItemsRes.data);
                await saveToCache('expenses', expensesRes.data as Expense[]);
                
                console.log('Data fetched from Supabase and cached.');
                await syncPendingOperations();

            } catch (error: any) {
                console.error('Error fetching data from Supabase:', error.message);
                toast({ title: 'خطأ', description: `فشل جلب البيانات: ${error.message}`, variant: 'destructive' });
                const [cachedTables, cachedOrders, cachedMenuItems, cachedExpenses] = await Promise.all([
                    getFromCache<Table>('tables'),
                    getFromCache<Order>('orders'),
                    getFromCache<MenuItem>('menuItems'),
                    getFromCache<Expense>('expenses')
                ]);
                setTables(cachedTables);
                setOrders(cachedOrders);
                setMenuItems(cachedMenuItems);
            }
        } else {
            console.log('Offline: Fetching from IndexedDB cache...');
            const [cachedTables, cachedOrders, cachedMenuItems, cachedExpenses] = await Promise.all([
                getFromCache<Table>('tables'),
                getFromCache<Order>('orders'),
                getFromCache<MenuItem>('menuItems'),
                 getFromCache<Expense>('expenses')
            ]);
            setTables(cachedTables);
            setOrders(cachedOrders);
            setMenuItems(cachedMenuItems);
            toast({ title: 'تنبيه', description: 'أنت غير متصل بالإنترنت. البيانات المعروضة قد تكون غير محدثة.', variant: "default" });
        }
        setLoading(false);
    }, [toast, syncPendingOperations]);
    
    const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_REQUEST') {
          console.log('[App] Received SYNC_REQUEST from Service Worker. Initiating sync.');
          syncPendingOperations();
        }
    }, [syncPendingOperations]);

    // Derived state for tables with their current orders/status
    const tablesWithStatus = useMemo(() => {
        const tableMap = new Map<string, Table>();
        
        // Initialize map with all tables
        for (const dbTable of tables) {
            tableMap.set(dbTable.uuid, { 
                ...dbTable, 
                status: 'available', 
                order: null 
            });
        }
    
        const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    
        for (const order of activeOrders) {
            if (tableMap.has(order.table_uuid)) {
                let status: TableStatus = 'occupied';
                if (order.status === 'pending_chef_approval') status = 'new_order';
                if (order.status === 'pending_cashier_approval') status = 'pending_cashier_approval';
                if (order.status === 'awaiting_final_confirmation') status = 'awaiting_final_confirmation';
                if (order.status === 'confirmed') status = 'confirmed';
                if (order.status === 'ready') status = 'ready';
                if (order.status === 'paying') status = 'paying';
                if (order.status === 'needs_attention') status = 'needs_attention';
                
                const existingTable = tableMap.get(order.table_uuid)!;
                const tableData: Table = {
                  ...existingTable,
                  status: status,
                  order: order,
                  // These are just illustrative; real logic might be more complex
                  seatingDuration: '10 min', 
                  chefConfirmationTimestamp: order.customer_confirmed_at ? new Date(order.customer_confirmed_at).getTime() : undefined,
                };
                tableMap.set(order.table_uuid, tableData);
            }
        }
        return Array.from(tableMap.values()).sort((a,b) => (parseInt(a.display_number || '999')) - (parseInt(b.display_number || '999')));

    }, [tables, orders]);

    // Effect to fetch initial data and subscribe to changes
    useEffect(() => {
        if (!isAuthenticated || initialFetchCalled.current) {
            if(!isAuthenticated) setLoading(false);
            return;
        }
        
        // This flag ensures the effect runs only once after authentication
        initialFetchCalled.current = true;
        
        fetchAllData();

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => console.log('[App] Service Worker registered:', registration))
                    .catch(error => console.error('[App] Service Worker registration failed:', error));
            });
             navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        }

        const handleOnline = () => {
            setIsOnline(true);
            toast({ title: "متصل بالإنترنت", description: "تمت استعادة الاتصال. جاري المزامنة..." });
            fetchAllData(true);
        };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const tablesChannel = supabase.channel('realtime-tables').on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => fetchAllData(true)).subscribe();
        const ordersChannel = supabase.channel('realtime-orders').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAllData(true)).subscribe();
        const menuItemsChannel = supabase.channel('realtime-menu-items').on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => fetchAllData(true)).subscribe();
        
        if (syncTimeoutRef.current) clearInterval(syncTimeoutRef.current);
        syncTimeoutRef.current = setInterval(syncPendingOperations, SYNC_INTERVAL);

        return () => {
            supabase.removeChannel(tablesChannel);
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(menuItemsChannel);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
            if (syncTimeoutRef.current) clearInterval(syncTimeoutRef.current);
        };
    }, [isAuthenticated, fetchAllData, syncPendingOperations, handleServiceWorkerMessage, toast]);
    
    // --- WRITE OPERATIONS ---

    const requestBackgroundSync = () => {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(reg => {
              if(reg.sync) {
                reg.sync.register('sync-pending-operations');
              } else {
                 syncPendingOperations();
              }
            }).catch(() => syncPendingOperations());
        } else if (navigator.onLine) {
            syncPendingOperations();
        }
    }
    
    // --- Order Operations ---
    const submitOrder = useCallback(async (orderData: Omit<Order, 'id' | 'status' | 'created_at' | 'service_charge' | 'tax' | 'final_total' | 'chef_approved_at' | 'cashier_approved_at' | 'customer_confirmed_at' | 'completed_at'>) => {
        const tempId = uuidv4();
        const newOrder: Order = {
            id: tempId,
            created_at: new Date().toISOString(),
            status: 'pending_chef_approval',
            service_charge: 0, 
            tax: 0, 
            final_total: orderData.subtotal,
            chef_approved_at: null,
            cashier_approved_at: null,
            customer_confirmed_at: null,
            completed_at: null,
            ...orderData,
            table_id: parseInt(orderData.table_id!.toString(), 10), // Ensure it is a number
        };

        setOrders(prev => [...prev, newOrder]);
        await db.orders.put(newOrder);
        await addToSyncQueue('insert_order', { ...newOrder, id:tempId });
        toast({ title: "تم إرسال الطلب", description: "سيتم مزامنة الطلب مع الخادم." });
        requestBackgroundSync();
    }, [toast]);

    const updateOrderStatus = async (orderId: string, updates: Partial<Order>) => {
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return false;

        const updatedOrder = { ...orders[orderIndex], ...updates };
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        await db.orders.put(updatedOrder);
        await addToSyncQueue('update_order', { id: orderId, updates });
        requestBackgroundSync();
        return true;
    }

    const approveOrderByChef = async (orderId: string) => {
       const success = await updateOrderStatus(orderId, { status: 'pending_cashier_approval', chef_approved_at: new Date().toISOString() });
       if(success) toast({ title: 'بانتظار موافقة المحاسب', description: `تم تأكيد الطلب ${orderId.substring(0,5)}... محلياً.` });
    };

    const approveOrderByCashier = async (orderId: string, serviceCharge: number, tax: number) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const finalTotal = order.subtotal + serviceCharge + tax;
        
        const updates = { 
            status: 'awaiting_final_confirmation', 
            service_charge: serviceCharge, 
            tax: tax, 
            final_total: finalTotal,
            cashier_approved_at: new Date().toISOString() 
        };
        const success = await updateOrderStatus(orderId, updates);
        if(success) toast({ title: 'بانتظار التأكيد النهائي من الزبون', description: `تم إرسال الفاتورة النهائية للطلب ${orderId.substring(0,5)}...` });
    };

    const confirmFinalOrder = async (orderId: string) => {
       const success = await updateOrderStatus(orderId, { status: 'confirmed', customer_confirmed_at: new Date().toISOString() });
       if(success) toast({ title: 'تم تأكيد الطلب نهائياً', description: `الطلب ${orderId.substring(0,5)}... قيد التحضير الآن.` });
    };

    const confirmOrderReady = async (orderId: string) => {
        const success = await updateOrderStatus(orderId, { status: 'ready' });
        if(success) toast({ title: 'الطلب جاهز', description: `الطلب ${orderId.substring(0,5)}... جاهز للتسليم.` });
    };

    const completeOrder = async (orderId: string) => {
        const success = await updateOrderStatus(orderId, { status: 'completed', completed_at: new Date().toISOString() });
        if(success) toast({ title: 'تم إتمام الطلب', description: `تم إغلاق الطلب ${orderId.substring(0,5)}... بنجاح.` });
    }
    
    const cancelOrder = async (orderId: string) => {
        const success = await updateOrderStatus(orderId, { status: 'cancelled' });
        if(success) toast({ title: 'تم إلغاء الطلب', description: `تم إلغاء الطلب ${orderId.substring(0,5)}... بنجاح.`, variant: 'destructive' });
    }

    const requestBill = async (orderId: string) => {
       const success = await updateOrderStatus(orderId, { status: 'paying' });
       if(success) toast({ title: 'تم طلب الفاتورة', description: `تم تغيير حالة الطلب ${orderId.substring(0,5)}... إلى الدفع.` });
    }
    
    const requestAttention = async (orderId: string) => {
       const success = await updateOrderStatus(orderId, { status: 'needs_attention' });
       if(success) toast({ title: 'تم طلب المساعدة', description: `الطلب ${orderId.substring(0,5)}... يحتاج مساعدة.` });
    }
    
    // --- Menu Item Operations ---
    const addMenuItem = async (itemData: Omit<MenuItem, 'id' | 'quantity' | 'created_at' | 'updated_at'>) => {
        const tempId = uuidv4();
        const newItem: MenuItem = { 
            id: tempId, 
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...itemData 
        };
        
        setMenuItems(prev => [...prev, newItem].sort((a,b) => a.name.localeCompare(b.name)));
        await db.menuItems.put(newItem);
        await addToSyncQueue('menu_items', { ...newItem });
        
        toast({ title: "تمت الإضافة محلياً", description: `تمت إضافة ${itemData.name}، وسيتم مزامنته قريباً.` });
        requestBackgroundSync();
    };

    const updateMenuItem = async (itemId: string, itemData: Partial<Omit<MenuItem, 'id' | 'quantity' | 'created_at' | 'updated_at'>>) => {
        const itemIndex = menuItems.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;

        const updatedItem = { ...menuItems[itemIndex], ...itemData, updated_at: new Date().toISOString() };
        setMenuItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
        await db.menuItems.put(updatedItem);
        await addToSyncQueue('menu_items', { id: itemId, ...itemData });
        
        toast({ title: "تم التحديث محلياً", description: `تم تحديث ${itemData.name || 'الصنف'}، وسيتم مزامنته قريباً.` });
        requestBackgroundSync();
    };

    const deleteMenuItem = async (itemId: string) => {
        setMenuItems(prev => prev.filter(i => i.id !== itemId));
        await db.menuItems.delete(itemId);
        await addToSyncQueue('menu_items', { id: itemId });
        
        toast({ title: "تم الحذف محلياً", description: `تم حذف الصنف، وسيتم مزامنته قريباً.`, variant: "destructive" });
        requestBackgroundSync();
    };

    // --- Table Operations ---
    const addTable = async () => {
        const tempUuid = uuidv4();
        const maxDisplayNumber = tables.reduce((max, t) => Math.max(parseInt(t.display_number || '0')), 0);
        
        const newTableData = {
          uuid: tempUuid,
          display_number: (maxDisplayNumber + 1).toString(),
          capacity: 4, // Default capacity
          is_active: true,
          status: 'available',
        };
        
        const newTableForLocal: Table = {
          ...newTableData,
          current_order_id: null,
          assigned_user_id: null
        };

        setTables(prev => [...prev, newTableForLocal]);
        await db.tables.put(newTableForLocal);
        
        await addToSyncQueue('tables', newTableData);
        requestBackgroundSync();
    };

    const deleteTableByUuid = async (uuid: string) => {
        const tableToDelete = tables.find(t => t.uuid === uuid);
        if(!tableToDelete) return;
        
        setTables(prev => prev.filter(t => t.uuid !== uuid));
        await db.tables.delete(uuid); // Dexie delete uses primary key
        await addToSyncQueue('tables', { uuid: uuid });
        requestBackgroundSync();
    };


    return (
        <OrderFlowContext.Provider value={{
            orders,
            tables: tablesWithStatus,
            menuItems,
            loading,
            isOnline,
            isSyncing,
            fetchAllData,
            submitOrder,
            approveOrderByChef,
            approveOrderByCashier,
            confirmFinalOrder,
            confirmOrderReady,
            completeOrder,
            cancelOrder,
            requestBill,
            requestAttention,
            addMenuItem,
            updateMenuItem,
            deleteMenuItem,
            addTable,
            deleteTableByUuid,
        }}>
            {children}
        </OrderFlowContext.Provider>
    );
};

// --- HOOK ---
export const useOrderFlow = () => {
    const context = useContext(OrderFlowContext);
    if (context === undefined) {
        throw new Error('useOrderFlow must be used within an OrderFlowProvider');
    }
    return context;
};
