
"use client";

import { useState, useMemo, useEffect } from "react";
import { type Table } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Clock, Hash, UtensilsCrossed, Printer, Coins, ChefHat } from "lucide-react";

interface OrderDetailsSheetProps {
  table: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusMap: Record<string, { text: string; className: string }> = {
    new_order: { text: "طلب جديد", className: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30" },
    confirmed: { text: "تم التأكيد", className: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" },
    paying: { text: "في مرحلة الدفع", className: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30" },
    occupied: { text: "محجوزة", className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
    needs_attention: { text: "تحتاج مساعدة", className: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30" },
    available: { text: "متاحة", className: "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30" },
};

const USD_TO_SYP_RATE = 15000;

const formatTimeAgo = (timestamp?: number): string => {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `قبل ${Math.floor(interval)} سنة`;
    interval = seconds / 2592000;
    if (interval > 1) return `قبل ${Math.floor(interval)} شهر`;
    interval = seconds / 86400;
    if (interval > 1) return `قبل ${Math.floor(interval)} يوم`;
    interval = seconds / 3600;
    if (interval > 1) return `قبل ${Math.floor(interval)} ساعة`;
    interval = seconds / 60;
    if (interval > 1) return `قبل ${Math.floor(interval)} دقيقة`;
    return `قبل ${Math.floor(seconds)} ثانية`;
};

export function OrderDetailsSheet({ table, open, onOpenChange }: OrderDetailsSheetProps) {
  const [currency, setCurrency] = useState<'SYP' | 'USD'>('SYP');
  const [chefConfirmationTimeAgo, setChefConfirmationTimeAgo] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      if (open && table?.chefConfirmationTimestamp) {
        setChefConfirmationTimeAgo(formatTimeAgo(table.chefConfirmationTimestamp));
      }
    };
    
    updateTimer();
    const intervalId = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [table, open]);

  const convertedOrder = useMemo(() => {
    if (!table?.order) return null;
    if (currency === 'SYP') return table.order;

    return {
      ...table.order,
      items: table.order.items.map(item => ({
        ...item,
        price: item.price / USD_TO_SYP_RATE,
      })),
      total: table.order.total / USD_TO_SYP_RATE,
    };
  }, [table?.order, currency]);


  if (!table) {
    return null;
  }

  const statusInfo = statusMap[table.status] || statusMap.available;
  
  const handlePrint = () => {
    window.print();
  };

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'SYP' ? 'USD' : 'SYP');
  }

  const formatCurrency = (amount: number) => {
    const symbol = currency === 'SYP' ? 'ل.س' : '$';
    const formattedAmount = currency === 'SYP' ? amount.toLocaleString('ar-SY') : amount.toFixed(2);
    return `${formattedAmount} ${symbol}`;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col font-body bg-card print:bg-white print:text-black">
        <SheetHeader className="text-right print:hidden">
          <SheetTitle className="font-headline text-2xl">تفاصيل الطاولة {table.id}</SheetTitle>
          <SheetDescription>
            <Badge variant="outline" className={`text-sm ${statusInfo.className}`}>{statusInfo.text}</Badge>
          </SheetDescription>
        </SheetHeader>
        
        {/* Printable Invoice section */}
        <div id={`invoice-table-${table.id}`} className="flex-1 overflow-y-auto py-4 px-1 space-y-6">
          <div className="print:text-center print:pt-8">
            <h2 className="font-headline text-3xl hidden print:block mb-2 font-bold">مطعم العالمية</h2>
            <p className="text-lg print:text-black font-semibold hidden print:block">فاتورة الطاولة {table.id}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-headline text-lg text-foreground print:hidden">ملخص الجلسة</h3>
            <div className="text-sm text-muted-foreground print:text-gray-600 space-y-2">
              {table.seatingDuration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>مدة الجلوس: {table.seatingDuration}</span>
                </div>
              )}
              {table.chefConfirmationTimestamp && (
                <div className="flex items-center gap-2">
                  <ChefHat className="h-4 w-4" />
                  <span>تأكيد الشيف: {chefConfirmationTimeAgo}</span>
                </div>
              )}
               {table.order?.id && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <span>رقم الطلب: {table.order.id}</span>
                </div>
              )}
               <p className="print:text-black">تاريخ: {new Date().toLocaleString('ar-SY')}</p>
            </div>
          </div>
          
          <Separator />
          
          {convertedOrder && convertedOrder.items.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-headline text-lg text-foreground print:text-black">الطلب</h3>
              <div className="space-y-3">
                {convertedOrder.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground print:text-gray-600">
                        {item.quantity} x {formatCurrency(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.quantity * item.price)}</p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>الإجمالي</span>
                <span>{formatCurrency(convertedOrder.total)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
                <p className="text-muted-foreground">لا يوجد طلب لهذه الطاولة بعد.</p>
            </div>
          )}

           <div className="print:text-center hidden print:block pt-4 space-y-1 text-xs">
              <p>شكراً لزيارتكم!</p>
              <p>Thank you for visiting!</p>
            </div>
        </div>
        <SheetFooter className="mt-auto print:hidden">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button variant="secondary" onClick={toggleCurrency} className="flex-1">
              <Coins className="w-4 h-4 mr-2" />
              <span>{currency === 'SYP' ? 'عرض بالدولار' : 'عرض بالليرة'}</span>
            </Button>
            <Button variant="accent" className="flex-1" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              <span>طباعة الفاتورة</span>
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
