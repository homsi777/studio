
"use client"

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { Order, Table, MenuItem } from '@/types';
import { useToast } from './use-toast';
import { BellRing } from 'lucide-react';
import { uuidToTableMap } from '@/lib/utils';
import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';


// --- MOCK DATA ---
const initialTables: Table[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  status: 'available',
  order: null,
}));

// --- CONTEXT TYPE ---
interface OrderFlowContextType {
    orders: Order[];
    tables: Table[];
    submitOrder: (order: Omit<Order, 'id' | 'status' | 'timestamp'>) => Promise<void>;
    approveOrderByChef: (orderId: string) => Promise<void>;
    approveOrderByCashier: (orderId: string) => Promise<void>;
    confirmFinalOrder: (orderId: string) => Promise<void>;
    confirmOrderReady: (orderId: string) => Promise<void>;
    addDummyOrder: (tableUuid: string) => void;
}

const OrderFlowContext = createContext<OrderFlowContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const OrderFlowProvider = ({ children }: { children: ReactNode }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [tables, setTables] = useState<Table[]>(initialTables);
    const { toast } = useToast();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
      if (!isAuthenticated) {
        setOrders([]);
        return;
      };

      const q = query(collection(db, "orders"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData: Order[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            ordersData.push({ 
              id: doc.id, 
              ...data,
              // Convert Firestore timestamp to JS Date number
              timestamp: data.created_at?.toDate().getTime() || Date.now(),
              confirmationTimestamp: data.chef_approved_at?.toDate().getTime(),
            } as Order);
        });
        setOrders(ordersData);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    }, [isAuthenticated]);


    const submitOrder = useCallback(async (orderData: Omit<Order, 'id' | 'status' | 'timestamp'>) => {
        try {
            await addDoc(collection(db, "orders"), {
                ...orderData,
                status: 'pending_chef_approval',
                created_at: serverTimestamp(),
            });

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
    
    const addDummyOrder = useCallback((tableUuid: string) => {
        const tableId = parseInt(uuidToTableMap[tableUuid] || '0', 10);
        if (!tableId) {
            console.error("Invalid table UUID for dummy order");
            return;
        }
        
        const dummySessionId = `dummy-sid-${Date.now()}`;
        const dummyOrder: Omit<Order, 'id' | 'status' | 'timestamp'> = {
            tableId: tableId,
            tableUuid: tableUuid,
            sessionId: dummySessionId,
            items: [{ id: 'item-5', name: 'فتوش', quantity: 1, price: 20000, category: 'appetizer', name_en: 'Fattoush', description: '', quantity:1 }],
            total: 20000,
        };
        submitOrder(dummyOrder);
    }, [submitOrder]);

    const updateOrderStatus = async (orderId: string, newStatus: Order['status'], updates: object) => {
        const orderRef = doc(db, 'orders', orderId);
        try {
            await updateDoc(orderRef, {
                status: newStatus,
                ...updates,
            });
        } catch (error) {
             console.error(`Error updating order ${orderId} to ${newStatus}:`, error);
             toast({
                variant: "destructive",
                title: "خطأ في التحديث",
                description: "لم نتمكن من تحديث حالة الطلب.",
             })
        }
    };


    const approveOrderByChef = async (orderId: string) => {
        await updateOrderStatus(orderId, 'pending_cashier_approval', { chef_approved_at: serverTimestamp() });
        toast({ title: 'بانتظار موافقة المحاسب', description: `تم تأكيد الطلب ${orderId} من الشيف.` });
    };

    const approveOrderByCashier = async (orderId: string) => {
        await updateOrderStatus(orderId, 'pending_final_confirmation', { cashier_approved_at: serverTimestamp() });
        toast({ title: 'بانتظار التأكيد النهائي من الزبون', description: `تم تأكيد الطلب ${orderId} من المحاسب.` });
    };

    const confirmFinalOrder = async (orderId: string) => {
        await updateOrderStatus(orderId, 'confirmed', { customer_confirmed_at: serverTimestamp() });
        toast({ title: 'تم تأكيد الطلب نهائياً', description: `الطلب ${orderId} قيد التحضير الآن.` });
    };

    const confirmOrderReady = async (orderId: string) => {
        await updateOrderStatus(orderId, 'ready', { completed_at: serverTimestamp() });
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
