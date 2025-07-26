
"use client"

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import type { Order } from '@/types';
import { useToast } from './use-toast';
import { BellRing } from 'lucide-react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';


// --- CONTEXT TYPE ---
interface OrderFlowContextType {
    orders: Order[];
    submitOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => Promise<void>;
    approveOrderByChef: (orderId: string) => Promise<void>;
    approveOrderByCashier: (orderId: string, serviceCharge: number, tax: number) => Promise<void>;
    confirmFinalOrder: (orderId: string) => Promise<void>;
    confirmOrderReady: (orderId: string) => Promise<void>;
    completeOrder: (orderId: string) => Promise<void>;
    cancelOrder: (orderId: string) => Promise<void>;
    requestBill: (orderId: string) => Promise<void>;
    requestAttention: (orderId: string) => Promise<void>;
    fetchOrders: () => Promise<void>;
}

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(undefined);

// --- HELPER FUNCTION ---
export const formatOrderFromDb = (dbOrder: any): Order => ({
    id: dbOrder.id,
    items: dbOrder.items || [],
    subtotal: dbOrder.subtotal || 0,
    serviceCharge: dbOrder.service_charge || 0,
    tax: dbOrder.tax || 0,
    finalTotal: dbOrder.final_total || 0,
    tableId: dbOrder.table_id,
    tableUuid: dbOrder.table_uuid,
    sessionId: dbOrder.session_id,
    status: dbOrder.status,
    timestamp: new Date(dbOrder.created_at).getTime(),
    confirmationTimestamp: dbOrder.customer_confirmed_at ? new Date(dbOrder.customer_confirmed_at).getTime() : undefined,
    created_at: dbOrder.created_at,
    chef_approved_at: dbOrder.chef_approved_at,
    cashier_approved_at: dbOrder.cashier_approved_at,
    customer_confirmed_at: dbOrder.customer_confirmed_at,
    completed_at: dbOrder.completed_at,
});


// --- PROVIDER COMPONENT ---
export const OrderFlowProvider = ({ children }: { children: ReactNode }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();

    const fetchOrders = useCallback(async () => {
        if (!isAuthenticated) {
            setOrders([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedOrders = data.map(formatOrderFromDb);
            setOrders(formattedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "لم نتمكن من جلب الطلبات.",
            });
        }
    }, [isAuthenticated, toast]);


    useEffect(() => {
        if (!isAuthenticated) return;

        // Don't fetch here, let the initial server load handle it
        // fetchOrders(); 

        const channel = supabase.channel('realtime-orders')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                console.log('New order received:', payload.new);
                const newOrder = formatOrderFromDb(payload.new);
                setOrders(currentOrders => [newOrder, ...currentOrders.filter(o => o.id !== newOrder.id)]);
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
              console.log('Order update received:', payload.new);
              const updatedOrder = formatOrderFromDb(payload.new);
              setOrders(currentOrders => currentOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders' }, (payload) => {
               console.log('Order delete received:', payload.old);
               setOrders(currentOrders => currentOrders.filter(o => o.id !== payload.old.id));
          })
          .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated]);


    const submitOrder = useCallback(async (orderData: Omit<Order, 'id' | 'status' | 'timestamp'>) => {
        try {
            const response = await fetch('/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) throw new Error('Failed to submit order');

            toast({
                title: (
                    <div className="flex items-center gap-3">
                        <BellRing className="text-primary" />
                        <span className="font-headline">طلب جديد بانتظار الشيف!</span>
                    </div>
                ),
                description: `تم استلام طلب جديد من الطاولة ${orderData.tableId}.`,
            });
        } catch (error) {
            console.error("Error submitting order: ", error);
            toast({
                variant: "destructive",
                title: "خطأ",
                description: "لم نتمكن من إرسال طلبك. يرجى المحاولة مرة أخرى.",
            });
        }
    }, [toast]);
    
    const updateOrderStatusViaApi = async (orderId: string, action: string, body?: object) => {
        try {
            const response = await fetch(`/api/v1/orders/${orderId}/${action}`, {
                method: 'PUT',
                headers: body ? { 'Content-Type': 'application/json' } : {},
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${action}`);
            }
            return true;
        } catch (error: any) {
            console.error(`Error in ${action} for order ${orderId}:`, error);
            toast({
                variant: "destructive",
                title: "خطأ في التحديث",
                description: error.message || "لم نتمكن من تحديث حالة الطلب.",
            });
            return false;
        }
    }


    const approveOrderByChef = async (orderId: string) => {
       const success = await updateOrderStatusViaApi(orderId, 'approve-chef');
       if(success) toast({ title: 'بانتظار موافقة المحاسب', description: `تم تأكيد الطلب ${orderId.substring(0,5)}... من الشيف.` });
    };

    const approveOrderByCashier = async (orderId: string, serviceCharge: number, tax: number) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const finalTotal = order.subtotal + serviceCharge + tax;

       const success = await updateOrderStatusViaApi(orderId, 'approve-cashier', {
           serviceCharge,
           tax,
           finalTotal,
       });
       if(success) toast({ title: 'بانتظار التأكيد النهائي من الزبون', description: `تم إرسال الفاتورة النهائية للطلب ${orderId.substring(0,5)}...` });
    };

    const confirmFinalOrder = async (orderId: string) => {
       const success = await updateOrderStatusViaApi(orderId, 'confirm-customer');
       if(success) toast({ title: 'تم تأكيد الطلب نهائياً', description: `الطلب ${orderId.substring(0,5)}... قيد التحضير الآن.` });
    };

    const confirmOrderReady = async (orderId: string) => {
        const success = await updateOrderStatusViaApi(orderId, 'ready');
        if(success) toast({ title: 'الطلب جاهز', description: `الطلب ${orderId.substring(0,5)}... جاهز للتسليم.` });
    };

    const completeOrder = async (orderId: string) => {
        const success = await updateOrderStatusViaApi(orderId, 'complete');
        if(success) toast({ title: 'تم إتمام الطلب', description: `تم إغلاق الطلب ${orderId.substring(0,5)}... بنجاح.` });
    }
    
    const cancelOrder = async (orderId: string) => {
        const success = await updateOrderStatusViaApi(orderId, 'cancel');
        if(success) toast({ title: 'تم إلغاء الطلب', description: `تم إلغاء الطلب ${orderId.substring(0,5)}... بنجاح.`, variant: 'destructive' });
    }

    const requestBill = async (orderId: string) => {
        await updateOrderStatusViaApi(orderId, 'set-status', { status: 'paying' });
    }
    
    const requestAttention = async (orderId: string) => {
        await updateOrderStatusViaApi(orderId, 'set-status', { status: 'needs_attention' });
    }

    return (
        <OrderFlowContext.Provider value={{
            orders,
            fetchOrders,
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
