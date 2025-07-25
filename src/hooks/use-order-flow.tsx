
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
    submitOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp' | 'serviceCharge' | 'tax' | 'finalTotal'>) => Promise<void>;
    approveOrderByChef: (orderId: string) => Promise<void>;
    approveOrderByCashier: (orderId: string, serviceCharge: number, tax: number) => Promise<void>;
    confirmFinalOrder: (orderId: string) => Promise<void>;
    confirmOrderReady: (orderId: string) => Promise<void>;
    completeOrder: (orderId: string) => Promise<void>;
    requestBill: (orderId: string) => Promise<void>;
    requestAttention: (orderId: string) => Promise<void>;
    fetchOrders: () => Promise<void>;
}

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(undefined);

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

            const formattedOrders = data.map((o: any) => ({
                id: o.id,
                items: o.items,
                subtotal: o.subtotal,
                serviceCharge: o.service_charge,
                tax: o.tax,
                finalTotal: o.final_total,
                tableId: o.table_id,
                tableUuid: o.table_uuid,
                sessionId: o.session_id,
                status: o.status,
                timestamp: new Date(o.created_at).getTime(),
                confirmationTimestamp: o.customer_confirmed_at ? new Date(o.customer_confirmed_at).getTime() : undefined,
            }));

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

        fetchOrders(); // Initial fetch

        const channel = supabase.channel('realtime-orders')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            console.log('Change received!', payload);
            fetchOrders(); // Refetch all orders on any change
          })
          .subscribe();

        // Cleanup subscription on unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, fetchOrders]);


    const submitOrder = useCallback(async (orderData: Omit<Order, 'id' | 'status' | 'timestamp' | 'serviceCharge' | 'tax' | 'finalTotal'>) => {
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
    
    const updateOrderStatus = async (orderId: string, updates: object) => {
        try {
            const { error } = await supabase
                .from('orders')
                .update(updates)
                .eq('id', orderId);
            
            if (error) throw error;
            return true;
        } catch (error) {
             console.error(`Error updating order ${orderId}:`, error);
             toast({
                variant: "destructive",
                title: "خطأ في التحديث",
                description: "لم نتمكن من تحديث حالة الطلب.",
             })
             return false;
        }
    };


    const approveOrderByChef = async (orderId: string) => {
       const success = await updateOrderStatus(orderId, { status: 'pending_cashier_approval', chef_approved_at: new Date().toISOString() });
       if(success) toast({ title: 'بانتظار موافقة المحاسب', description: `تم تأكيد الطلب ${orderId.substring(0,5)}... من الشيف.` });
    };

    const approveOrderByCashier = async (orderId: string, serviceCharge: number, tax: number) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        const finalTotal = order.subtotal + serviceCharge + tax;

       const success = await updateOrderStatus(orderId, { 
           status: 'pending_final_confirmation', 
           cashier_approved_at: new Date().toISOString(),
           service_charge: serviceCharge,
           tax,
           final_total: finalTotal,
       });
       if(success) toast({ title: 'بانتظار التأكيد النهائي من الزبون', description: `تم إرسال الفاتورة النهائية للطلب ${orderId.substring(0,5)}...` });
    };

    const confirmFinalOrder = async (orderId: string) => {
       const success = await updateOrderStatus(orderId, { status: 'confirmed', customer_confirmed_at: new Date().toISOString() });
       if(success) toast({ title: 'تم تأكيد الطلب نهائياً', description: `الطلب ${orderId.substring(0,5)}... قيد التحضير الآن.` });
    };

    const confirmOrderReady = async (orderId: string) => {
        const success = await updateOrderStatus(orderId, { status: 'ready', completed_at: new Date().toISOString() });
        if(success) toast({ title: 'الطلب جاهز', description: `الطلب ${orderId.substring(0,5)}... جاهز للتسليم.` });
    };

    const completeOrder = async (orderId: string) => {
        const success = await updateOrderStatus(orderId, { status: 'completed', completed_at: new Date().toISOString() });
        if(success) toast({ title: 'تم إتمام الطلب', description: `تم إغلاق الطلب ${orderId.substring(0,5)}... بنجاح.` });
    }

    const requestBill = async (orderId: string) => {
        await updateOrderStatus(orderId, { status: 'paying' });
    }
    
    const requestAttention = async (orderId: string) => {
        await updateOrderStatus(orderId, { status: 'needs_attention' });
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
