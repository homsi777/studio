"use client";
import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type Order, type OrderStatus } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, Hash, Check, ArrowLeft, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChefOrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: OrderStatus) => void;
}

export function ChefOrderCard({ order, onStatusChange }: ChefOrderCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: order.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimestamp = () => {
        if (!order.timestamp) {
            setTimeAgo('');
            return;
        };
        const seconds = Math.floor((Date.now() - order.timestamp) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) {
            setTimeAgo(`قبل ${Math.floor(interval)} سنة`);
            return;
        }
        interval = seconds / 2592000;
        if (interval > 1) {
            setTimeAgo(`قبل ${Math.floor(interval)} شهر`);
            return;
        }
        interval = seconds / 86400;
        if (interval > 1) {
            setTimeAgo(`قبل ${Math.floor(interval)} يوم`);
            return;
        }
        interval = seconds / 3600;
        if (interval > 1) {
            setTimeAgo(`قبل ${Math.floor(interval)} ساعة`);
            return;
        }
        interval = seconds / 60;
        if (interval > 1) {
            setTimeAgo(`قبل ${Math.floor(interval)} دقيقة`);
            return;
        }
        setTimeAgo(`قبل ${Math.floor(seconds)} ثانية`);
    };

    updateTimestamp();
    const timer = setInterval(updateTimestamp, 60000); // Update every minute
    return () => clearInterval(timer);
}, [order.timestamp]);


  const nextAction = {
    new: { text: 'تأكيد وبدء التحضير', status: 'in_progress', icon: <Check/>, variant: 'default' },
    in_progress: { text: 'الطلب جاهز للتسليم', status: 'ready', icon: <ArrowLeft/>, variant: 'secondary' },
    ready: null,
  };

  const handleNextAction = () => {
    const action = nextAction[order.status!];
    if (action) {
      onStatusChange(order.id, action.status as OrderStatus);
    }
  }


  return (
    <div ref={setNodeRef} style={style} {...attributes} className="touch-none">
      <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <div {...listeners} className="cursor-grab p-2 -ml-2 text-muted-foreground hover:text-foreground">
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
        </CardContent>
        {nextAction[order.status!] && (
             <CardFooter className="p-2 bg-muted/40">
                <Button onClick={handleNextAction} variant={nextAction[order.status!]?.variant as any} size="sm" className="w-full">
                    {nextAction[order.status!]?.icon}
                    {nextAction[order.status!]?.text}
                </Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
