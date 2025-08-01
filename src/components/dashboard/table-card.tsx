
"use client";

import React from 'react';
import { type Table, TableStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Clock, AlertCircle, CheckCircle, Utensils, CreditCard, HelpCircle, Hourglass, Bell } from 'lucide-react';
import { Badge } from '../ui/badge';
import { useLanguage } from '@/hooks/use-language';

interface TableCardProps {
  table: Table;
  onSelect: (table: Table) => void;
}

const statusStyles: Record<string, { bg: string, border: string, iconColor: string, icon: React.ReactNode, text_ar: string, text_en: string, badge: string, shadow: string }> = {
  new_order: {
    bg: 'bg-card',
    border: 'border-red-500/50',
    iconColor: 'text-red-500',
    icon: <AlertCircle className="h-5 w-5 animate-pulse" />,
    text_ar: 'طلب جديد',
    text_en: 'New Order',
    badge: 'border-transparent bg-red-500/20 text-red-500',
    shadow: 'shadow-red-900/10'
  },
   pending_cashier_approval: {
    bg: 'bg-card animate-pulse',
    border: 'border-cyan-500/50',
    iconColor: 'text-cyan-500',
    icon: <Hourglass className="h-5 w-5" />,
    text_ar: 'بانتظار المحاسب',
    text_en: 'Pending Cashier',
    badge: 'border-transparent bg-cyan-500/20 text-cyan-500',
    shadow: 'shadow-cyan-900/10'
  },
  awaiting_final_confirmation: {
    bg: 'bg-card',
    border: 'border-purple-500/50',
    iconColor: 'text-purple-500',
    icon: <HelpCircle className="h-5 w-5" />,
    text_ar: 'بانتظار الزبون',
    text_en: 'Awaiting Customer',
    badge: 'border-transparent bg-purple-500/20 text-purple-500',
    shadow: 'shadow-purple-900/10'
  },
  confirmed: {
    bg: 'bg-card',
    border: 'border-green-500/50',
    iconColor: 'text-green-500',
    icon: <CheckCircle className="h-5 w-5" />,
    text_ar: 'مؤكد',
    text_en: 'Confirmed',
    badge: 'border-transparent bg-green-500/20 text-green-500',
    shadow: 'shadow-green-900/10'
  },
  ready: {
    bg: 'bg-card',
    border: 'border-teal-500/50',
    iconColor: 'text-teal-500',
    icon: <Bell className="h-5 w-5 animate-bounce" />,
    text_ar: 'جاهز للتسليم',
    text_en: 'Ready for Pickup',
    badge: 'border-transparent bg-teal-500/20 text-teal-500',
    shadow: 'shadow-teal-900/10'
  },
  paying: {
    bg: 'bg-card',
    border: 'border-blue-500/50',
    iconColor: 'text-blue-500',
    icon: <CreditCard className="h-5 w-5 animate-pulse" />,
    text_ar: 'يطلب الفاتورة',
    text_en: 'Requesting Bill',
    badge: 'border-transparent bg-blue-500/20 text-blue-500',
    shadow: 'shadow-blue-900/10'
  },
  [TableStatus.OCCUPIED]: {
    bg: 'bg-card',
    border: 'border-yellow-500/50',
    iconColor: 'text-yellow-500',
    icon: <Utensils className="h-5 w-5" />,
    text_ar: 'مشغولة',
    text_en: 'Occupied',
    badge: 'border-transparent bg-yellow-500/20 text-yellow-500',
    shadow: 'shadow-yellow-900/10'
  },
  needs_attention: {
    bg: 'bg-card',
    border: 'border-orange-500/50',
    iconColor: 'text-orange-500',
    icon: <HelpCircle className="h-5 w-5 animate-ping" />,
    text_ar: 'تحتاج مساعدة',
    text_en: 'Needs Attention',
    badge: 'border-transparent bg-orange-500/20 text-orange-500',
    shadow: 'shadow-orange-900/10'
  },
  [TableStatus.AVAILABLE]: {
    bg: 'bg-card/60 dark:bg-muted/10',
    border: 'border-dashed border-muted-foreground/20',
    iconColor: '',
    icon: null,
    text_ar: 'متاحة',
    text_en: 'Available',
    badge: 'border-transparent bg-muted/40 text-muted-foreground',
    shadow: 'shadow-inner'
  },
};

export function TableCard({ table, onSelect }: TableCardProps) {
  const { language } = useLanguage();
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const styles = statusStyles[table.status as string] || statusStyles.available;
  const isClickable = table.status !== TableStatus.AVAILABLE;

  return (
    <Card
      onClick={() => onSelect(table)}
      className={cn(
        'flex flex-col justify-between min-h-[160px] transform hover:-translate-y-1 select-none shadow-md transition-all duration-300',
        styles.bg,
        styles.border,
        styles.shadow,
        isClickable ? 'cursor-pointer hover:shadow-xl hover:border-primary/80' : 'cursor-default'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <CardTitle className="text-2xl font-headline font-bold">
          {t('طاولة', 'Table')} {table.display_number}
        </CardTitle>
        {styles.icon && React.cloneElement(styles.icon as React.ReactElement, { className: cn((styles.icon as React.ReactElement).props.className, styles.iconColor) })}
      </CardHeader>
      <CardContent className="p-4 pt-0 text-center flex-1 flex flex-col justify-center items-center">
         <Badge variant="outline" className={cn('text-sm font-semibold', styles.badge)}>{t(styles.text_ar, styles.text_en)}</Badge>
      </CardContent>
      {table.order?.created_at && (
        <CardFooter className="p-2 text-xs text-muted-foreground flex items-center justify-center gap-1 bg-black/10 dark:bg-black/20 rounded-b-xl">
          <Clock className="h-3 w-3" />
          <span>{new Date(table.order.created_at).toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit'})}</span>
        </CardFooter>
      )}
    </Card>
  );
}
