
"use client";

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type Table, type TableStatus, type Order as OrderType } from '@/types';
import { TableCard } from '@/components/dashboard/table-card';
import { OrderDetailsSheet } from '@/components/dashboard/order-details-sheet';
import { useOrderFlow, formatOrderFromDb } from '@/hooks/use-order-flow';

const statusPriority: Record<TableStatus, number> = {
    needs_attention: 1,
    new_order: 2,
    pending_cashier_approval: 3,
    awaiting_final_confirmation: 4,
    ready: 5,
    paying: 6,
    confirmed: 7,
    occupied: 8,
    available: 9,
};

interface DashboardClientProps {
    initialDbTables: { id: number; uuid: string }[];
    initialOrders: any[];
}

export function DashboardClient({ initialDbTables, initialOrders: rawInitialOrders }: DashboardClientProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const { orders: realTimeOrders } = useOrderFlow();
  
  const initialLiveOrders = useMemo(() => rawInitialOrders.map(formatOrderFromDb), [rawInitialOrders]);
  
  const orders = useMemo(() => {
    const allOrders = [...realTimeOrders, ...initialLiveOrders];
    const uniqueOrders = Array.from(new Map(allOrders.map(o => [o.id, o])).values());
    return uniqueOrders;
  }, [realTimeOrders, initialLiveOrders]);


  const handleSelectTable = (table: Table) => {
    if(table.status !== 'available') {
      setSelectedTable(table);
    }
  };
  
  const handleCloseSheet = () => {
    setSelectedTable(null);
  };

  const tablesData = useMemo(() => {
    const tableMap = new Map<number, Table>();
    
    // Initialize all tables from the database as available
    for (const dbTable of initialDbTables) {
        tableMap.set(dbTable.id, { id: dbTable.id, uuid: dbTable.uuid, status: 'available', order: null });
    }

    // Populate with active orders
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

    for (const order of activeOrders) {
      if (tableMap.has(order.tableId)) {
        let status: Table['status'] = 'occupied';
        if (order.status === 'pending_chef_approval') status = 'new_order';
        if (order.status === 'pending_cashier_approval') status = 'pending_cashier_approval';
        if (order.status === 'pending_final_confirmation') status = 'awaiting_final_confirmation';
        if (order.status === 'confirmed') status = 'confirmed';
        if (order.status === 'ready') status = 'ready';
        if (order.status === 'paying') status = 'paying';
        if (order.status === 'needs_attention') status = 'needs_attention';
        
        const existingTable = tableMap.get(order.tableId)!;
        const tableData: Table = {
          ...existingTable,
          status: status,
          order: order,
          // Mock data, consider calculating this based on order start time
          seatingDuration: '10 min', 
          chefConfirmationTimestamp: order.confirmationTimestamp
        };
        tableMap.set(order.tableId, tableData);
      }
    }

    return Array.from(tableMap.values()).sort((a,b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        // If priorities are the same, sort by table ID
        return a.id - b.id;
    });

  }, [initialDbTables, orders]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        <AnimatePresence>
          {tablesData.map((table, i) => (
            <motion.div
              key={table.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <TableCard
                table={table}
                onSelect={() => handleSelectTable(table)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <OrderDetailsSheet
        table={selectedTable}
        open={!!selectedTable}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            handleCloseSheet();
          }
        }}
      />
    </>
  );
}
