
"use client";

import { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type Table, type TableStatus, type Order as OrderType } from '@/types';
import { TableCard } from '@/components/dashboard/table-card';
import { OrderDetailsSheet } from '@/components/dashboard/order-details-sheet';
import { useOrderFlow } from '@/hooks/use-order-flow';
import { useLanguage } from '@/hooks/use-language';
import { Loader2 } from 'lucide-react';


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

export function DashboardClient() {
  const { language } = useLanguage();
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const { tables, loading, isOnline } = useOrderFlow();


  const handleSelectTable = (table: Table) => {
    if(table.status !== 'available') {
      setSelectedTable(table);
    }
  };
  
  const handleCloseSheet = () => {
    setSelectedTable(null);
  };
  
  const sortedTables = useMemo(() => {
    return [...tables].sort((a, b) => {
        return (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99) || a.id - b.id;
    });
  }, [tables]);

  if (loading) {
    return (
        <div className="flex flex-col justify-center items-center h-full min-h-[calc(100vh-200px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">{t('جاري تحميل بيانات الطاولات...', 'Loading table data...')}</p>
        </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className={`text-sm font-semibold flex items-center gap-2 px-3 py-1 rounded-full ${isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {isOnline ? t('متصل بالإنترنت', 'Online') : t('غير متصل', 'Offline')}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        <AnimatePresence>
          {sortedTables.map((table, i) => (
            <motion.div
              key={table.uuid}
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
