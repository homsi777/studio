"use client"

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import type { Order, Table, TableStatus, MenuItem, PendingSyncOperation, OrderStatus } from '@/types';
import { useToast } from './use-toast';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';
import { db, getCachedData, saveToCache, addToSyncQueue, getSyncQueue, clearSyncQueueItem } from '@/lib/indexeddb';

const SYNC_INTERVAL = 10000; // Try to sync every 10 seconds

// --- CONTEXT TYPE ---
interface OrderFlowContextType {
    orders: Order[];
    tables: Table[];
    menuItems: MenuItem[];
    loading: boolean;
    isOnline: boolean;
    isSyncing: boolean;
    submitOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => Promise<void>;
    approveOrderByChef: (orderId: string) => Promise<void>;
    approveOrderByCashier: (orderId: string, serviceCharge: number, tax: number) => Promise<void>;
    confirmFinalOrder: (orderId: string) => Promise<void>;
    confirmOrderReady: (orderId:string) => Promise<void>;
    completeOrder: (orderId: string) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
    requestBill: (orderId: string) => Promise<void>;
    requestAttention: (orderId: string) => Promise<void>;
    fetchAllData: (forceOnline?: boolean) => Promise<void>;
}

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(undefined);

// --- HELPER FUNCTION ---
export const formatOrderFromDb = (dbOrder: any): Order => ({
    id: dbOrder.id,
    items: dbOrder.items || [],
    subtotal: dbOrder.subtotal || 0,
    service_charge: dbOrder.service_charge || 0,
    tax: dbOrder.tax || 0,
    final_total: dbOrder.final_total || 0,
    table_id: dbOrder.table_id,
    table_uuid: dbOrder.table_uuid,
    session_id: dbOrder.session_id,
    status: dbOrder.status,
    timestamp: new Date(dbOrder.created_at).getTime(),
    confirmationTimestamp: dbOrder.customer_confirmed_at ? new Date(dbOrder.customer_confirmed_at).getTime() : undefined,
    created_at: dbOrder.created_at,
    updated_at: dbOrder.updated_at,
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
    
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
        }
    }, []);

    const fetchAllData = useCallback(async (forceOnline = false) => {
        const online = forceOnline || (typeof window !== 'undefined' && navigator.onLine);
        setIsOnline(online);
        setLoading(true);

        if (online) {
            console.log('Online: Fetching from Supabase...');
            try {
                const [tablesRes, ordersRes, menuItemsRes] = await Promise.all([
                    supabase.from('tables').select('*'),
                    supabase.from('orders').select('*'),
                    supabase.from('menu_items').select('*'),
                ]);

                if (tablesRes.error) throw tablesRes.error;
                if (ordersRes.error) throw ordersRes.error;
                if (menuItemsRes.error) throw menuItemsRes.error;

                const formattedOrders = ordersRes.data.map(formatOrderFromDb);
                
                setTables(tablesRes.data as Table[]);
                setOrders(formattedOrders);
                setMenuItems(menuItemsRes.data as MenuItem[]);

                await saveToCache('tables', tablesRes.data);
                await saveToCache('orders', formattedOrders);
                await saveToCache('menuItems', menuItemsRes.data);
                
                console.log('Data fetched from Supabase and cached.');
                await syncPendingOperations();

            } catch (error: any) {
                console.error('Error fetching data from Supabase:', error.message);
                toast({ title: 'خطأ', description: `فشل جلب البيانات: ${error.message}`, variant: 'destructive' });
                const [cachedTables, cachedOrders, cachedMenuItems] = await Promise.all([
                    getCachedData<Table>('tables'),
                    getCachedData<Order>('orders'),
                    getCachedData<MenuItem>('menuItems'),
                ]);
                setTables(cachedTables);
                setOrders(cachedOrders);
                setMenuItems(cachedMenuItems);
            }
        } else {
            console.log('Offline: Fetching from IndexedDB cache...');
            const [cachedTables, cachedOrders, cachedMenuItems] = await Promise.all([
                getCachedData<Table>('tables'),
                getCachedData<Order>('orders'),
                getCachedData<MenuItem>('menuItems'),
            ]);
            setTables(cachedTables);
            setOrders(cachedOrders);
            setMenuItems(cachedMenuItems);
            toast({ title: 'تنبيه', description: 'أنت غير متصل بالإنترنت. البيانات المعروضة قد تكون غير محدثة.', variant: "default" });
        }
        setLoading(false);
    }, [toast]);
    
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
                // Use uuid for tables, and id for other entities
                const identifier = op.tableName === 'tables' ? op.payload.uuid : op.payload.id;
                const url = `/api/v1/${op.tableName}${op.type === 'insert' ? '' : `/${identifier}`}`;
                const method = op.type === 'insert' ? 'POST' : op.type === 'update' ? 'PUT' : 'DELETE';

                if (!op.id) {
                    console.warn(`Skipping invalid operation.`, op);
                    continue;
                }
                
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: (method === 'POST' || method === 'PUT') ? JSON.stringify(op.payload) : undefined,
                });

                if (!response.ok) {
                    const result = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }

                await clearSyncQueueItem(op.id);
                operationsSyncedCount++;
                console.log(`Operation synced successfully: ${op.type} on ${op.tableName}`);

            } catch (error: any) {
                console.error(`Failed to sync operation ${op.id} (${op.type} on ${op.tableName}):`, error.message);
                toast({ title: 'خطأ في المزامنة', description: `فشل مزامنة عملية. سيتم المحاولة لاحقاً.`, variant: 'destructive'});
                break; 
            }
        }

        setIsSyncing(false);

        if (operationsSyncedCount > 0) {
            toast({ title: 'نجاح المزامنة', description: `تم مزامنة ${operationsSyncedCount} تغيير بنجاح!` });
            await fetchAllData(true);
        }
    }, [isSyncing, toast, fetchAllData]);

    const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
        if (event.data && event.data.type === 'SYNC_REQUEST') {
          console.log('[App] Received SYNC_REQUEST from Service Worker. Initiating sync.');
          syncPendingOperations();
        }
    }, [syncPendingOperations]);

    // Derived state for tables with their current orders/status
    const tablesWithStatus = useMemo(() => {
        const tableMap = new Map<string, Table>();

        for (const dbTable of tables) {
            tableMap.set(dbTable.uuid, { ...dbTable, status: 'available', order: null });
        }

        const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

        for (const order of activeOrders) {
            if (tableMap.has(order.table_uuid)) {
                let status: TableStatus = 'occupied';
                if (order.status === 'pending_chef_approval') status = 'new_order';
                if (order.status === 'pending_cashier_approval') status = 'pending_cashier_approval';
                if (order.status === 'pending_final_confirmation') status = 'awaiting_final_confirmation';
                if (order.status === 'confirmed') status = 'confirmed';
                if (order.status === 'ready') status = 'ready';
                if (order.status === 'paying') status = 'paying';
                if (order.status === 'needs_attention') status = 'needs_attention';
                
                const existingTable = tableMap.get(order.table_uuid)!;
                const tableData: Table = {
                  ...existingTable,
                  status: status,
                  order: order,
                  seatingDuration: '10 min', 
                  chefConfirmationTimestamp: order.confirmationTimestamp
                };
                tableMap.set(order.table_uuid, tableData);
            }
        }
        return Array.from(tableMap.values()).sort((a,b) => a.id - b.id);

    }, [tables, orders]);

    // Effect to fetch initial data and subscribe to changes
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        fetchAllData();

        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('[App] Service Worker registered:', registration);
                    })
                    .catch(error => {
                        console.error('[App] Service Worker registration failed:', error);
                    });
            });
             navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
        } else {
             console.warn('[App] Service Worker not supported by this browser.');
        }

        const handleOnline = () => {
            setIsOnline(true);
            toast({ title: "متصل بالإنترنت", description: "تمت استعادة الاتصال. جاري المزامنة..." });
            fetchAllData(true);
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.sync.register('sync-pending-operations')
                        .then(() => console.log('Background sync registered on network reconnect.'))
                        .catch(err => console.error('Background sync registration failed:', err));
                });
            }
        };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const tablesChannel = supabase
            .channel('public:tables')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, (payload) => {
                console.log('Realtime change in tables:', payload);
                if (payload.eventType === 'UPDATE' && payload.old.status !== payload.new.status) {
                    toast({
                        title: 'تحديث حالة الطاولة',
                        description: `الطاولة رقم ${payload.new.id} أصبحت: ${payload.new.status}`,
                    });
                }
                fetchAllData(true);
            })
            .subscribe();

        const ordersChannel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Realtime change in orders:', payload);
                 if (payload.eventType === 'INSERT') {
                    toast({
                        title: 'طلب جديد وصل!',
                        description: `طلب جديد للطاولة رقم ${payload.new.table_id}.`,
                        variant: 'default',
                    });
                }
                if (payload.eventType === 'UPDATE' && payload.old.status !== payload.new.status) {
                    const newStatus = payload.new.status as OrderStatus;
                    let description = `حالة الطلب للطاولة رقم ${payload.new.table_id} تغيرت إلى: `;
                    switch (newStatus) {
                        case 'confirmed': description += 'قيد التحضير.'; break;
                        case 'ready': description += 'جاهز للتسليم!'; break;
                        case 'completed': description += 'مكتمل.'; break;
                        case 'cancelled': description += 'ملغى.'; break;
                        default: description += newStatus;
                    }
                    toast({ title: 'تحديث حالة الطلب', description });
                }
                fetchAllData(true);
            })
            .subscribe();
        
        if (syncTimeoutRef.current) clearInterval(syncTimeoutRef.current);
        syncTimeoutRef.current = setInterval(syncPendingOperations, SYNC_INTERVAL);

        return () => {
            supabase.removeChannel(tablesChannel);
            supabase.removeChannel(ordersChannel);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
            if (syncTimeoutRef.current) clearInterval(syncTimeoutRef.current);
        };
    }, [isAuthenticated, fetchAllData, syncPendingOperations, handleServiceWorkerMessage, toast]);
    
    // --- WRITE OPERATIONS ---

    const requestBackgroundSync = () => {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.sync.register('sync-pending-operations')
                    .then(() => console.log('Background sync registered.'))
                    .catch(err => console.error('Background sync registration failed:', err));
            });
        } else {
            if(navigator.onLine) syncPendingOperations();
        }
    }
    
    const submitOrder = useCallback(async (orderData: Omit<Order, 'id' | 'status' | 'timestamp'>) => {
        const tempId = `temp-order-${Date.now()}`;
        const newOrder: Order = {
            id: tempId,
            status: 'pending_chef_approval',
            timestamp: Date.now(),
            ...orderData,
            service_charge: 0, tax: 0, final_total: orderData.subtotal,
            created_at: new Date().toISOString(),
        };

        setOrders(prev => [...prev, newOrder]);
        await db.orders.put(newOrder);

        await addToSyncQueue('insert', 'orders', { ...orderData, status: 'pending_chef_approval' }, new Date().toISOString());
        
        toast({ title: "تم إرسال الطلب", description: "سيتم مزامنة الطلب مع الخادم." });
        requestBackgroundSync();
    }, [toast, syncPendingOperations]);

    const updateOrderStatus = async (orderId: string, updates: Partial<Order>) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return false;

        const updatedOrder = { ...order, ...updates, updated_at: new Date().toISOString() };
        setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        await db.orders.put(updatedOrder);

        await addToSyncQueue('update', 'orders', { id: orderId, ...updates }, new Date().toISOString());
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
            status: 'pending_final_confirmation', 
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
