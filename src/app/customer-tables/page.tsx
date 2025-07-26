
"use client";

import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type Table } from '@/types';
import { TableCard } from '@/components/dashboard/table-card';
import { AuthGuard } from '@/components/auth-guard';
import { useOrderFlow } from '@/hooks/use-order-flow';
import { useLanguage } from '@/hooks/use-language';
import { Loader2 } from 'lucide-react';


function CustomerTablesPage() {
  const { tables, loading } = useOrderFlow();
  const { language } = useLanguage();

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSelectTable = (table: Table) => {
      window.open(`/menu/${table.uuid}`, '_blank');
  };

  if (loading) {
    return (
        <div className="flex flex-col justify-center items-center h-full min-h-[calc(100vh-200px)]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">{t('جاري تحميل بيانات الطاولات...', 'Loading table data...')}</p>
        </div>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6">
       <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-3xl font-bold text-foreground">{t('طاولات الزبائن', 'Customer Tables')}</h1>
        <p className="text-muted-foreground">{t('اضغط على أي طاولة لفتح قائمة الزبون الخاصة بها', 'Click on a table to open its customer menu')}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        <AnimatePresence>
          {tables.map((table, i) => (
            <motion.div
              key={table.uuid}
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
