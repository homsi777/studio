"use client";

import { type Table } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, CheckCircle, Utensils, CreditCard, CircleHelp } from 'lucide-react';
import { Badge } from '../ui/badge';

interface TableCardProps {
  table: Table;
  onSelect: (table: Table) => void;
}

const statusStyles: Record<string, { bg: string, border: string, icon: React.ReactNode, text: string, badge: string }> = {
  new_order: {
    bg: 'bg-red-500/10 dark:bg-red-900/20',
    border: 'border-red-500/50',
    icon: <AlertCircle className="h-6 w-6 text-red-500" />,
    text: 'طلب جديد',
    badge: 'bg-red-500 text-white'
  },
  confirmed: {
    bg: 'bg-green-500/10 dark:bg-green-900/20',
    border: 'border-green-500/50',
    icon: <CheckCircle className="h-6 w-6 text-green-500" />,
    text: 'تم التأكيد',
    badge: 'bg-green-500 text-white'
  },
  paying: {
    bg: 'bg-blue-500/10 dark:bg-blue-900/20',
    border: 'border-blue-500/50',
    icon: <CreditCard className="h-6 w-6 text-blue-500" />,
    text: 'دفع',
    badge: 'bg-blue-500 text-white'
  },
  occupied: {
    bg: 'bg-yellow-500/10 dark:bg-yellow-900/20',
    border: 'border-yellow-500/50',
    icon: <Utensils className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />,
    text: 'مشغولة',
    badge: 'bg-yellow-500/80 text-black'
  },
  needs_attention: {
    bg: 'bg-orange-500/10 dark:bg-orange-900/20',
    border: 'border-orange-500/50',
    icon: <CircleHelp className="h-6 w-6 text-orange-500" />,
    text: 'تحتاج مساعدة',
    badge: 'bg-orange-500 text-white'
  },
  available: {
    bg: 'bg-muted/50 dark:bg-muted/20',
    border: 'border-dashed',
    icon: null,
    text: 'متاحة',
    badge: 'bg-gray-400 dark:bg-gray-600 text-white'
  },
};

export function TableCard({ table, onSelect }: TableCardProps) {
  const styles = statusStyles[table.status] || statusStyles.available;
  const isClickable = table.status !== 'available';

  return (
    <Card
      onClick={() => onSelect(table)}
      className={cn(
        'flex flex-col justify-between h-40 transition-all duration-200 ease-in-out transform hover:-translate-y-1 hover:shadow-lg',
        styles.bg,
        styles.border,
        isClickable ? 'cursor-pointer' : 'cursor-default opacity-70'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <CardTitle className="text-2xl font-headline font-bold">
          طاولة {table.id}
        </CardTitle>
        {styles.icon}
      </CardHeader>
      <CardContent className="p-4 pt-0 text-center flex-1 flex flex-col justify-center items-center">
         <Badge className={cn('text-sm font-semibold', styles.badge)}>{styles.text}</Badge>
      </CardContent>
      {table.seatingDuration && (
        <CardFooter className="p-2 text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{table.seatingDuration}</span>
        </CardFooter>
      )}
    </Card>
  );
}
