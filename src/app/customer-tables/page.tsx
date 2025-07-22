
"use client";

import { AnimatePresence, motion } from 'framer-motion';
import { type Table } from '@/types';
import { TableCard } from '@/components/dashboard/table-card';
import { AuthGuard } from '@/components/auth-guard';
import { useRestaurantSettings } from '@/hooks/use-restaurant-settings';
import { useOrderFlow } from '@/hooks/use-order-flow';
import { tableIdToUuidMap } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

function CustomerTablesPage() {
  const { settings } = useRestaurantSettings();
  const { orders } = useOrderFlow();
  const { language } = useLanguage();

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSelectTable = (tableId: number) => {
    const uuid = tableIdToUuidMap[tableId.toString()];
    if (uuid) {
      window.open(`/menu/${uuid}`, '_blank');
    } else {
      console.error(`No UUID found for table ${tableId}`);
    }
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
       <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-3xl font-bold text-foreground">{t('طاولات الزبائن', 'Customer Tables')}</h1>
        <p className="text-muted-foreground">{t('اضغط على أي طاولة لفتح قائمة الزبون الخاصة بها', 'Click on a table to open its customer menu')}</p>
      </div>
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
                onSelect={() => handleSelectTable(table.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function GuardedCustomerTablesPage() {
    return (
        <AuthGuard>
            <CustomerTablesPage />
        </AuthGuard>
    )
}
