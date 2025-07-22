
"use client";

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type Table } from '@/types';
import { TableCard } from '@/components/dashboard/table-card';
import { OrderDetailsSheet } from '@/components/dashboard/order-details-sheet';
import { AuthGuard } from '@/components/auth-guard';
import { useRestaurantSettings } from '@/hooks/use-restaurant-settings';
import { useOrderFlow } from '@/hooks/use-order-flow';

function DashboardPage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const { settings } = useRestaurantSettings();
  const { orders } = useOrderFlow();

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
    
    // Initialize all tables as available
    for (let i = 1; i <= settings.numberOfTables; i++) {
        tableMap.set(i, { id: i, status: 'available', order: null });
    }

    // Populate with active orders
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');

    for (const order of activeOrders) {
      let status: Table['status'] = 'occupied';
      if (order.status === 'pending_chef_approval') status = 'new_order';
      if (order.status === 'pending_cashier_approval') status = 'pending_cashier_approval';
      if (order.status === 'pending_final_confirmation') status = 'awaiting_final_confirmation';
      if (order.status === 'confirmed') status = 'confirmed';
      if (order.status === 'ready') status = 'ready';
      if (order.status === 'paying') status = 'paying';
      if (order.status === 'needs_attention') status = 'needs_attention';

      const tableData: Table = {
        id: order.tableId,
        status: status,
        order: order,
        // Mock data, consider calculating this based on order start time
        seatingDuration: '10 min', 
        chefConfirmationTimestamp: order.confirmationTimestamp
      };
      tableMap.set(order.tableId, tableData);
    }

    return Array.from(tableMap.values()).sort((a,b) => a.id - b.id);

  }, [settings.numberOfTables, orders]);

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        <AnimatePresence>
          {tablesData.map((table, i) => (
            <motion.div
              key={table.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
    </main>
  );
}

export default function GuardedDashboardPage() {
    return (
        <AuthGuard>
            <DashboardPage />
        </AuthGuard>
    )
}
