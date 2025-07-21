"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type Table } from '@/types';
import { TableCard } from '@/components/dashboard/table-card';
import { OrderDetailsSheet } from '@/components/dashboard/order-details-sheet';

const mockTables: Table[] = [
  { id: 1, status: 'new_order', order: { id: 'ORD-001', items: [{ id: 'item-1', name: 'مشويات مشكلة', price: 85000, quantity: 1, category: 'main' }, { id: 'item-2', name: 'حمص', price: 15000, quantity: 2, category: 'appetizer' }, { id: 'item-3', name: 'مياه معدنية', price: 5000, quantity: 4, category: 'drink' }], total: 135000 }, seatingDuration: '25 دقيقة' },
  { id: 2, status: 'confirmed', order: { id: 'ORD-002', items: [{ id: 'item-4', name: 'كبة مقلية', price: 25000, quantity: 1, category: 'appetizer' }, { id: 'item-5', name: 'فتوش', price: 20000, quantity: 1, category: 'appetizer' }], total: 45000 }, seatingDuration: '15 دقيقة', chefConfirmationTimestamp: Date.now() - (1000 * 60 * 3) },
  { id: 3, status: 'available', order: null },
  { id: 4, status: 'occupied', order: null, seatingDuration: '5 دقائق' },
  { id: 5, status: 'available', order: null },
  { id: 6, status: 'paying', order: { id: 'ORD-003', items: [{ id: 'item-6', name: 'شيش طاووق', price: 60000, quantity: 2, category: 'main' }], total: 120000 }, seatingDuration: 'ساعة و 10 دقائق' },
  { id: 7, status: 'confirmed', order: { id: 'ORD-004', items: [{ id: 'item-1', name: 'مشويات مشكلة', price: 85000, quantity: 2, category: 'main' }, { id: 'item-7', name: 'بيبسي', price: 8000, quantity: 4, category: 'drink' }], total: 202000 }, seatingDuration: '35 دقيقة', chefConfirmationTimestamp: Date.now() - (1000 * 60 * 12) },
  { id: 8, status: 'available', order: null },
  { id: 9, status: 'needs_attention', order: { id: 'ORD-005', items: [], total: 0 }, seatingDuration: '40 دقيقة' },
  { id: 10, status: 'available', order: null },
  { id: 11, status: 'new_order', order: { id: 'ORD-006', items: [{ id: 'item-8', name: 'عصير برتقال طازج', price: 18000, quantity: 3, category: 'drink' }], total: 54000 }, seatingDuration: '7 دقائق' },
  { id: 12, status: 'available', order: null },
];

export default function DashboardPage() {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  const handleSelectTable = (table: Table) => {
    if(table.status !== 'available') {
      setSelectedTable(table);
    }
  };
  
  const handleCloseSheet = () => {
    setSelectedTable(null);
  };

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        <AnimatePresence>
          {mockTables.map((table, i) => (
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
