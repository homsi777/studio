
"use client";

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type Order, type OrderStatus } from '@/types';
import { ChefOrderCard } from '@/components/chef/chef-order-card';
import { ChefOrderColumn } from '@/components/chef/chef-order-column';
import { AuthGuard } from '@/components/auth-guard';
import { useOrderFlow } from '@/hooks/use-order-flow';
import { useLanguage } from '@/hooks/use-language';


function ChefPage() {
  const { orders, approveOrderByChef, confirmOrderReady } = useOrderFlow();
  const { language } = useLanguage();
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const newOrders = useMemo(() => orders.filter(o => o.status === 'pending_chef_approval').sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [orders]);
  const inProgressOrders = useMemo(() => orders.filter(o => o.status === 'confirmed').sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [orders]);

  const columns: { id: OrderStatus; title: string; en_title: string; orders: Order[] }[] = [
    { id: 'pending_chef_approval', title: 'طلبات بانتظار موافقتك', en_title: "Pending Approval", orders: newOrders },
    { id: 'confirmed', title: 'طلبات قيد التحضير', en_title: "In Progress", orders: inProgressOrders },
  ];

  return (
    <main className="flex-1 flex flex-col p-4 sm:p-6 bg-background/30">
        <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t('واجهة الشيف', 'Chef Interface')}</h1>
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {columns.map(column => (
                <ChefOrderColumn key={column.id} id={column.id} title={t(column.title, column.en_title)} count={column.orders.length}>
                    <AnimatePresence>
                        {column.orders.length > 0 ? (
                            column.orders.map(order => (
                                <motion.div key={order.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                                    <ChefOrderCard 
                                      order={order} 
                                      onApprove={approveOrderByChef}
                                      onReady={confirmOrderReady}
                                    />
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-10">
                                <p>{t('لا توجد طلبات في هذا القسم.', 'No orders in this section.')}</p>
                            </div>
                        )}
                    </AnimatePresence>
                </ChefOrderColumn>
            ))}
        </div>
    </main>
  );
}

export default function GuardedChefPage() {
    return (
        <AuthGuard>
            <ChefPage />
        </AuthGuard>
    )
}
