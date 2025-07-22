
"use client";
import { useState, useEffect } from 'react';
import { type Order, type OrderStatus } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Hash, Check, GripVertical, ChefHat, Bell } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

const formatDuration = (seconds: number, lang: 'ar' | 'en'): string => {
    const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    if (seconds < 60) return `${Math.floor(seconds)} ${t('ثا', 's')}`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes} ${t('د', 'm')} ${remainingSeconds} ${t('ثا', 's')}`;
};

interface ChefOrderCardProps {
  order: Order;
  onApprove: (orderId: string) => void;
  onReady: (orderId: string) => void;
}

export function ChefOrderCard({ order, onApprove, onReady }: ChefOrderCardProps) {
  const [timeAgo, setTimeAgo] = useState('');
  const [confirmationTimer, setConfirmationTimer] = useState('');
  const { language } = useLanguage();
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    const updateTimestamps = () => {
        if (order.timestamp) {
            const seconds = Math.floor((Date.now() - order.timestamp) / 1000);
            if (seconds < 5) { setTimeAgo(t('الآن', 'Just now')); return; }
            let interval = seconds / 31536000;
            if (interval > 1) { setTimeAgo(t(`قبل ${Math.floor(interval)} سنة`, `~${Math.floor(interval)}y ago`)); return; }
            interval = seconds / 2592000;
            if (interval > 1) { setTimeAgo(t(`قبل ${Math.floor(interval)} شهر`, `~${Math.floor(interval)}mo ago`)); return; }
            interval = seconds / 86400;
            if (interval > 1) { setTimeAgo(t(`قبل ${Math.floor(interval)} يوم`, `~${Math.floor(interval)}d ago`)); return; }
            interval = seconds / 3600;
            if (interval > 1) { setTimeAgo(t(`قبل ${Math.floor(interval)} ساعة`, `~${Math.floor(interval)}h ago`)); return; }
            interval = seconds / 60;
            if (interval > 1) { setTimeAgo(t(`قبل ${Math.floor(interval)} دقيقة`, `~${Math.floor(interval)}m ago`)); return; }
            setTimeAgo(t(`قبل ${Math.floor(seconds)} ثانية`, `~${Math.floor(seconds)}s ago`));
        } else {
            setTimeAgo('');
        }

        if (order.status === 'confirmed' && order.confirmationTimestamp) {
            const secondsSinceConfirmation = Math.floor((Date.now() - order.confirmationTimestamp) / 1000);
            setConfirmationTimer(formatDuration(secondsSinceConfirmation, language));
        } else {
            setConfirmationTimer('');
        }
    };

    updateTimestamps();
    const timer = setInterval(updateTimestamps, 5000); // update every 5 seconds
    return () => clearInterval(timer);
}, [order.timestamp, order.confirmationTimestamp, order.status, language, t]);


  const nextAction = {
    pending_chef_approval: { text: t('موافقة على الطلب', 'Approve Order'), handler: () => onApprove(order.id), icon: <Check/>, variant: 'default' },
    confirmed: { text: t('الطلب جاهز للتسليم', 'Order Ready'), handler: () => onReady(order.id), icon: <Bell/>, variant: 'secondary' },
  };
  
  const action = order.status ? nextAction[order.status as keyof typeof nextAction] : null;


  return (
    <div className="touch-none select-none">
      <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div className="cursor-grab p-2 -ml-2 text-muted-foreground hover:text-foreground">
             <GripVertical className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="font-headline text-xl">{t('الطاولة', 'Table')} {order.tableId}</CardTitle>
            <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1 font-mono">
                <Hash className="h-3 w-3" />
                <span>{order.id.substring(0, 8)}...</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{timeAgo}</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <Separator className="mb-3"/>
            <div className="space-y-2">
                {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                        <p>{t(item.name, item.name_en || item.name)}</p>
                        <Badge variant="outline" className="font-mono">x{item.quantity}</Badge>
                    </div>
                ))}
            </div>
            {order.status === 'confirmed' && confirmationTimer && (
                <>
                <Separator className="my-3"/>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary animate-pulse">
                    <ChefHat className="h-4 w-4" />
                    <span>{t('وقت التحضير:', 'Prep time:')} {confirmationTimer}</span>
                </div>
                </>
            )}
        </CardContent>
        {action && (
             <CardFooter className="p-2 bg-muted/40">
                <Button onClick={action.handler} variant={action.variant as any} size="sm" className="w-full">
                    {action.icon}
                    <span className="ltr:ml-2 rtl:mr-2">{action.text}</span>
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
