"use client";

import * as React from 'react';
import { type Table } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, CheckCircle, Utensils, CreditCard, CircleHelp } from 'lucide-react';
import { Badge } from '../ui/badge';

interface TableCardProps {
  table: Table;
  onSelect: (table: Table) => void;
}

const statusStyles: Record<string, { bg: string, border: string, iconColor: string, icon: React.ReactNode, text: string, badge: string, shadow: string }> = {
  new_order: {
    bg: 'bg-card',
    border: 'border-red-500/50',
    iconColor: 'text-red-500',
    icon: <AlertCircle className="h-5 w-5" />,
    text: 'طلب جديد',
    badge: 'border-transparent bg-red-500/20 text-red-500',
    shadow: 'shadow-md shadow-red-900/10'
  },
  confirmed: {
    bg: 'bg-card',
    border: 'border-green-500/50',
    iconColor: 'text-green-500',
    icon: <CheckCircle className="h-5 w-5" />,
    text: 'تم التأكيد',
    badge: 'border-transparent bg-green-500/20 text-green-500',
    shadow: 'shadow-md shadow-green-900/10'
  },
  paying: {
    bg: 'bg-card',
    border: 'border-blue-500/50',
    iconColor: 'text-blue-500',
    icon: <CreditCard className="h-5 w-5" />,
    text: 'دفع',
    badge: 'border-transparent bg-blue-500/20 text-blue-500',
    shadow: 'shadow-md shadow-blue-900/10'
  },
  occupied: {
    bg: 'bg-card',
    border: 'border-yellow-500/50',
    iconColor: 'text-yellow-500',
    icon: <Utensils className="h-5 w-5" />,
    text: 'مشغولة',
    badge: 'border-transparent bg-yellow-500/20 text-yellow-500',
    shadow: 'shadow-md shadow-yellow-900/10'
  },
  needs_attention: {
    bg: 'bg-card',
    border: 'border-orange-500/50',
    iconColor: 'text-orange-500',
    icon: <CircleHelp className="h-5 w-5" />,
    text: 'تحتاج مساعدة',
    badge: 'border-transparent bg-orange-500/20 text-orange-500',
    shadow: 'shadow-md shadow-orange-900/10'
  },
  available: {
    bg: 'bg-card/40 dark:bg-muted/10',
    border: 'border-dashed border-muted-foreground/20',
    iconColor: '',
    icon: null,
    text: 'متاحة',
    badge: 'border-transparent bg-muted/40 text-muted-foreground',
    shadow: 'shadow-inner'
  },
};

export function TableCard({ table, onSelect }: TableCardProps) {
  const styles = statusStyles[table.status] || statusStyles.available;
  const isClickable = table.status !== 'available';

  return (
    <Card
      onClick={() => onSelect(table)}
      className={cn(
        'flex flex-col justify-between h-40 transition-all duration-300 ease-in-out transform hover:-translate-y-1',
        styles.bg,
        styles.border,
        styles.shadow,
        isClickable ? 'cursor-pointer hover:shadow-lg hover:border-primary/80' : 'cursor-default'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <CardTitle className="text-2xl font-headline font-bold">
          طاولة {table.id}
        </CardTitle>
        {styles.icon && React.cloneElement(styles.icon as React.ReactElement, { className: cn((styles.icon as React.ReactElement).props.className, styles.iconColor) })}
      </CardHeader>
      <CardContent className="p-4 pt-0 text-center flex-1 flex flex-col justify-center items-center">
         <Badge variant="outline" className={cn('text-sm font-semibold', styles.badge)}>{styles.text}</Badge>
      </CardContent>
      {table.seatingDuration && (
        <CardFooter className="p-2 text-xs text-muted-foreground flex items-center justify-center gap-1 bg-black/10 dark:bg-black/20">
          <Clock className="h-3 w-3" />
          <span>{table.seatingDuration}</span>
        </CardFooter>
      )}
    </Card>
  );
}
