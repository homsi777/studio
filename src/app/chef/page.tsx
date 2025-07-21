"use client";

import { useState, useEffect, useMemo } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { type Order, type OrderStatus } from '@/types';
import { ChefOrderCard } from '@/components/chef/chef-order-card';
import { ChefOrderColumn } from '@/components/chef/chef-order-column';
import { Button } from '@/components/ui/button';
import { BellRing, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const initialOrders: Order[] = [
  { id: 'ORD-001', tableId: 1, items: [{ id: 'item-1', name: 'مشويات مشكلة', quantity: 1, price: 0, category: 'main', image: '' }, { id: 'item-2', name: 'حمص', quantity: 2, price: 0, category: 'appetizer', image: '' }], total: 0, status: 'new', timestamp: Date.now() - 60000 * 2 },
  { id: 'ORD-002', tableId: 7, items: [{ id: 'item-6', name: 'شيش طاووق', quantity: 2, price: 0, category: 'main', image: '' }], total: 0, status: 'new', timestamp: Date.now() - 60000 * 5 },
  { id: 'ORD-003', tableId: 2, items: [{ id: 'item-4', name: 'كبة مقلية', quantity: 1, price: 0, category: 'appetizer', image: '' }], total: 0, status: 'in_progress', timestamp: Date.now() - 60000 * 8 },
  { id: 'ORD-004', tableId: 6, items: [{ id: 'item-1', name: 'مشويات مشكلة', quantity: 2, price: 0, category: 'main', image: '' }, { id: 'item-7', name: 'بيبسي', quantity: 4, price: 0, category: 'drink', image: '' }], total: 0, status: 'in_progress', timestamp: Date.now() - 60000 * 12 },
  { id: 'ORD-005', tableId: 11, items: [{ id: 'item-8', name: 'عصير برتقال طازج', quantity: 3, price: 0, category: 'drink', image: '' }], total: 0, status: 'ready', timestamp: Date.now() - 60000 * 15 },
];


export default function ChefPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const { toast } = useToast();
  const sensors = useSensors(useSensor(PointerSensor));

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders(prevOrders => prevOrders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        const activeOrder = orders.find(o => o.id === active.id);
        const overColumnId = over.id as OrderStatus;
        if (activeOrder && activeOrder.status !== overColumnId) {
             updateOrderStatus(active.id as string, overColumnId);
        }
    }
  };

  const simulateNewOrder = () => {
    const newOrderId = `ORD-${String(Date.now()).slice(-4)}`;
    const newOrder: Order = {
      id: newOrderId,
      tableId: Math.floor(Math.random() * 20) + 1,
      items: [{ id: 'item-5', name: 'فتوش', quantity: 1, price: 0, category: 'appetizer', image: '' }, { id: 'item-7', name: 'بيبسي', quantity: 1, price: 0, category: 'drink', image: '' }],
      total: 0,
      status: 'new',
      timestamp: Date.now(),
    };
    setOrders(prev => [newOrder, ...prev]);
    toast({
      title: (
        <div className="flex items-center gap-3">
          <BellRing className="text-primary" />
          <span className="font-headline">طلب جديد!</span>
        </div>
      ),
      description: `تم استلام طلب جديد من الطاولة رقم ${newOrder.tableId}.`,
    })
  };

  const columns: { id: OrderStatus; title: string; }[] = [
    { id: 'new', title: 'الطلبات الجديدة' },
    { id: 'in_progress', title: 'قيد التحضير' },
    { id: 'ready', title: 'جاهز للتسليم' },
  ];
  
  const orderIds = useMemo(() => orders.map(o => o.id), [orders]);

  return (
    <main className="flex-1 flex flex-col p-4 sm:p-6 bg-background/30" dir="rtl">
        <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl font-bold text-foreground">واجهة الشيف</h1>
            <Button onClick={simulateNewOrder}>
                <PlusCircle className="ml-2 h-4 w-4" />
                محاكاة طلب جديد
            </Button>
        </div>
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <SortableContext items={orderIds} strategy={verticalListSortingStrategy}>
                  {columns.map(column => (
                      <ChefOrderColumn key={column.id} id={column.id} title={column.title} count={orders.filter(o => o.status === column.id).length}>
                          <AnimatePresence>
                              {orders.filter(order => order.status === column.id)
                                  .sort((a,b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
                                  .map(order => (
                                      <motion.div key={order.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                                          <ChefOrderCard order={order} onStatusChange={updateOrderStatus} />
                                      </motion.div>
                                  ))}
                          </AnimatePresence>
                      </ChefOrderColumn>
                  ))}
              </SortableContext>
            </div>
        </DndContext>
    </main>
  );
}
