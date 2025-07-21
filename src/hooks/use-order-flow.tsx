
"use client"

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { Order, Table, MenuItem } from '@/types';
import { useToast } from './use-toast';
import { BellRing } from 'lucide-react';
import { uuidToTableMap } from '@/lib/utils';

// --- MOCK DATA ---
const initialOrders: Order[] = [];
const initialTables: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  status: 'available',
  order: null,
}));

// --- CONTEXT TYPE ---
interface OrderFlowContextType {
    orders: Order[];
    tables: Table[];
    submitOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => void;
    approveOrderByChef: (orderId: string) => void;
    approveOrderByCashier: (orderId: string) => void;
    confirmFinalOrder: (orderId: string) => void;
    confirmOrderReady: (orderId: string) => void;
    addDummyOrder: (tableUuid: string) => void;
}

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const OrderFlowProvider = ({ children }: { children: ReactNode }) => {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [tables, setTables] = useState<Table[]>(initialTables);
    const { toast } = useToast();

    const updateOrderStatus = (orderId: string, newStatus: Order['status'], updates: Partial<Order> = {}) => {
        setOrders(prevOrders =>
            prevOrders.map(o =>
                o.id === orderId ? { ...o, status: newStatus, ...updates } : o
            )
        );
    };

    const submitOrder = useCallback((orderData: Omit<Order, 'id' | 'status' | 'timestamp'>) => {
        const newOrder: Order = {
            id: `ORD-${Date.now().toString().slice(-5)}`,
            ...orderData,
            status: 'pending_chef_approval',
            timestamp: Date.now(),
        };
        setOrders(prev => [...prev, newOrder]);
        toast({
            title: (
                <div className="flex items-center gap-3">
                    <BellRing className="text-primary" />
                    <span className="font-headline">طلب جديد بانتظار الشيف!</span>
                </div>
            ),
            description: `تم استلام طلب جديد من الطاولة ${newOrder.tableId}.`,
        });
    }, [toast]);
    
    const addDummyOrder = useCallback((tableUuid: string) => {
        const tableId = parseInt(uuidToTableMap[tableUuid] || '0', 10);
        if (!tableId) {
            console.error("Invalid table UUID for dummy order");
            return;
        }
        
        // A dummy session ID for the simulated order
        const dummySessionId = `dummy-sid-${Date.now()}`;
        const dummyOrder: Omit<Order, 'id' | 'status' | 'timestamp'> = {
            tableId: tableId,
            tableUuid: tableUuid,
            sessionId: dummySessionId,
            items: [{ id: 'item-5', name: 'فتوش', quantity: 1, price: 20000, category: 'appetizer' }],
            total: 20000,
        };
        submitOrder(dummyOrder);
    }, [submitOrder]);

    const approveOrderByChef = (orderId: string) => {
        updateOrderStatus(orderId, 'pending_cashier_approval');
        toast({ title: 'بانتظار موافقة المحاسب', description: `تم تأكيد الطلب ${orderId} من الشيف.` });
    };

    const approveOrderByCashier = (orderId: string) => {
        updateOrderStatus(orderId, 'pending_final_confirmation');
        toast({ title: 'بانتظار التأكيد النهائي من الزبون', description: `تم تأكيد الطلب ${orderId} من المحاسب.` });
    };

    const confirmFinalOrder = (orderId: string) => {
        updateOrderStatus(orderId, 'confirmed', { confirmationTimestamp: Date.now() });
        toast({ title: 'تم تأكيد الطلب نهائياً', description: `الطلب ${orderId} قيد التحضير الآن.` });
    };

    const confirmOrderReady = (orderId: string) => {
        updateOrderStatus(orderId, 'ready');
        toast({ title: 'الطلب جاهز', description: `الطلب ${orderId} جاهز للتسليم.` });
    };

    return (
        <OrderFlowContext.Provider value={{
            orders,
            tables,
            submitOrder,
            approveOrderByChef,
            approveOrderByCashier,
            confirmFinalOrder,
            confirmOrderReady,
            addDummyOrder,
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
