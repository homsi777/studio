"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ChefOrderColumnProps {
  id: OrderStatus;
  title: string;
  count: number;
  children: React.ReactNode;
}

export function ChefOrderColumn({ id, title, count, children }: ChefOrderColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const columnStyles: Record<OrderStatus, string> = {
    new: 'border-red-500/50',
    in_progress: 'border-yellow-500/50',
    ready: 'border-green-500/50',
  };

  const titleStyles: Record<OrderStatus, string> = {
    new: 'text-red-600 dark:text-red-400',
    in_progress: 'text-yellow-600 dark:text-yellow-400',
    ready: 'text-green-600 dark:text-green-400',
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-card p-4 rounded-lg border-2 border-dashed flex flex-col h-full",
        columnStyles[id],
        isOver ? 'bg-primary/5' : 'bg-card'
      )}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className={cn("font-headline text-2xl font-bold", titleStyles[id])}>{title}</h2>
        <Badge variant="secondary" className="text-base">{count}</Badge>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-1">
          {children}
      </div>
    </div>
  );
}
