
"use client";

import React from 'react';
import type { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ChefOrderColumnProps {
  id: OrderStatus;
  title: string;
  count: number;
  children: React.ReactNode;
}

export function ChefOrderColumn({ id, title, count, children }: ChefOrderColumnProps) {

  const columnStyles: Partial<Record<OrderStatus, string>> = {
    pending_chef_approval: 'border-red-500/50',
    confirmed: 'border-yellow-500/50',
    ready: 'border-green-500/50',
  };

  const titleStyles: Partial<Record<OrderStatus, string>> = {
    pending_chef_approval: 'text-red-600 dark:text-red-400',
    confirmed: 'text-yellow-600 dark:text-yellow-400',
    ready: 'text-green-600 dark:text-green-400',
  }

  return (
    <div
      className={cn(
        "bg-card p-4 rounded-lg border-2 border-dashed flex flex-col h-[calc(100vh-12rem)]",
        columnStyles[id]
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className={cn("font-headline text-2xl font-bold", titleStyles[id])}>{title}</h2>
        <Badge variant="secondary" className="text-base font-mono">{count}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-1">
          {children}
      </div>
    </div>
  );
}
