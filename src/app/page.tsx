
"use client";

import { useState } from 'react';
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
  const { tables, orders } = useOrderFlow();

  const handleSelectTable = (table: Table) => {
    if(table.status !== 'available') {
      setSelectedTable(table);
    }
  };
  
  const handleCloseSheet = () => {
    setSelectedTable(null);
  };

  const getTableData = (tableId: number): Table => {
    const activeOrder = orders.find(o => o.tableId === tableId && o.status !== 'completed' && o.status !== 'cancelled');
    if (activeOrder) {
      let status: Table['status'] = 'occupied';
      if (activeOrder.status === 'pending_chef_approval') status = 'new_order';
      if (activeOrder.status === 'pending_cashier_approval') status = 'pending_cashier_approval';
      if (activeOrder.status === 'pending_final_confirmation') status = 'awaiting_final_confirmation';
      if (activeOrder.status === 'confirmed') status = 'confirmed';
      if (activeOrder.status === 'paying') status = 'paying';
      if (activeOrder.status === 'needs_attention') status = 'needs_attention';

      return {
        id: tableId,
        status: status,
        order: activeOrder,
        seatingDuration: '10 min', // Mock data
        chefConfirmationTimestamp: activeOrder.confirmationTimestamp
      };
    }
    return { id: tableId, status: 'available', order: null };
  };

  const displayTables = Array.from({ length: settings.numberOfTables }, (_, i) => getTableData(i + 1));

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        <AnimatePresence>
          {displayTables.map((table, i) => (
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
