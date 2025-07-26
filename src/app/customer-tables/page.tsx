
"use client";

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type Table, type Order as OrderType } from '@/types';
import { TableCard } from '@/components/dashboard/table-card';
import { AuthGuard } from '@/components/auth-guard';
import { useOrderFlow } from '@/hooks/use-order-flow';
import { useLanguage } from '@/hooks/use-language';
import { supabase } from '@/lib/supabase';

function CustomerTablesPage() {
  const { orders } = useOrderFlow();
  const { language } = useLanguage();
  const [dbTables, setDbTables] = useState<Table[]>([]);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    const fetchTables = async () => {
      const { data, error } = await supabase.from('tables').select('*').order('id');
      if (error) {
        console.error('Error fetching tables:', error);
      } else {
        setDbTables(data);
      }
    };
    fetchTables();
  }, []);

  const handleSelectTable = (table: Table) => {
      window.open(`/menu/${table.uuid}`, '_blank');
  };

  const tablesData = useMemo(() => {
    const tableMap = new Map<number, Table>();
    
    // Initialize all tables from the database as available
    for (const dbTable of dbTables) {
        tableMap.set(dbTable.id, { ...dbTable, status: 'available', order: null });
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
        if (order.status === 'paying') status = 'paying';
        if (order.status === 'needs_attention') status = 'needs_attention';

        const existingTable = tableMap.get(order.tableId)!;
        const tableData: Table = {
          ...existingTable,
          status: status,
          order: order,
          seatingDuration: '10 min', // Mock data
          chefConfirmationTimestamp: order.confirmationTimestamp
        };
        tableMap.set(order.tableId, tableData);
      }
    }

    return Array.from(tableMap.values()).sort((a,b) => a.id - b.id);

  }, [dbTables, orders]);

  return (
    <main className="flex-1 p-4 sm:p-6">
       <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-3xl font-bold text-foreground">{t('طاولات الزبائن', 'Customer Tables')}</h1>
        <p className="text-muted-foreground">{t('اضغط على أي طاولة لفتح قائمة الزبون الخاصة بها', 'Click on a table to open its customer menu')}</p>
      </div>
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
