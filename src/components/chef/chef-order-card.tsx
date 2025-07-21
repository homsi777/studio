
"use client";
import { useState, useEffect } from 'react';
import { type Order, type OrderStatus } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Hash, Check, ArrowLeft, GripVertical, ChefHat } from 'lucide-react';

const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.floor(seconds)} ثا`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes} د ${remainingSeconds} ثا`;
};

interface ChefOrderCardProps {
  order: Order;
  onApprove: (orderId: string) => void;
  onReady: (orderId: string) => void;
}

export function ChefOrderCard({ order, onApprove, onReady }: ChefOrderCardProps) {
  const [timeAgo, setTimeAgo] = useState('');
  const [confirmationTimer, setConfirmationTimer] = useState('');

  useEffect(() => {
    const updateTimestamps = () => {
        if (order.timestamp) {
            const seconds = Math.floor((Date.now() - order.timestamp) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) { setTimeAgo(`قبل ${Math.floor(interval)} سنة`); return; }
            interval = seconds / 2592000;
            if (interval > 1) { setTimeAgo(`قبل ${Math.floor(interval)} شهر`); return; }
            interval = seconds / 86400;
            if (interval > 1) { setTimeAgo(`قبل ${Math.floor(interval)} يوم`); return; }
            interval = seconds / 3600;
            if (interval > 1) { setTimeAgo(`قبل ${Math.floor(interval)} ساعة`); return; }
            interval = seconds / 60;
            if (interval > 1) { setTimeAgo(`قبل ${Math.floor(interval)} دقيقة`); return; }
            setTimeAgo(`قبل ${Math.floor(seconds)} ثانية`);
        } else {
            setTimeAgo('');
        }

        if (order.status === 'confirmed' && order.confirmationTimestamp) {
            const secondsSinceConfirmation = Math.floor((Date.now() - order.confirmationTimestamp) / 1000);
            setConfirmationTimer(formatDuration(secondsSinceConfirmation));
        } else {
            setConfirmationTimer('');
        }
    };

    updateTimestamps();
    const timer = setInterval(updateTimestamps, 1000);
    return () => clearInterval(timer);
}, [order.timestamp, order.confirmationTimestamp, order.status]);


  const nextAction = {
    pending_chef_approval: { text: 'موافقة على الطلب', handler: () => onApprove(order.id), icon: <Check/>, variant: 'default' },
    confirmed: { text: 'الطلب جاهز للتسليم', handler: () => onReady(order.id), icon: <ArrowLeft/>, variant: 'secondary' },
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
            <CardTitle className="font-headline text-xl">الطاولة {order.tableId}</CardTitle>
            <div className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
                <Hash className="h-3 w-3" />
                <span>{order.id}</span>
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
                        <p>{item.name}</p>
                        <Badge variant="outline" className="font-mono">x{item.quantity}</Badge>
                    </div>
                ))}
            </div>
            {order.status === 'confirmed' && confirmationTimer && (
                <>
                <Separator className="my-3"/>
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-yellow-600 animate-pulse">
                    <ChefHat className="h-4 w-4" />
                    <span>وقت التحضير: {confirmationTimer}</span>
                </div>
                </>
            )}
        </CardContent>
        {action && (
             <CardFooter className="p-2 bg-muted/40">
                <Button onClick={action.handler} variant={action.variant as any} size="sm" className="w-full">
                    {action.icon}
                    {action.text}
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
