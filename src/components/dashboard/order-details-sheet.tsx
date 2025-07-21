"use client";

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
import { Clock, Hash, UtensilsCrossed } from "lucide-react";

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

export function OrderDetailsSheet({ table, open, onOpenChange }: OrderDetailsSheetProps) {
  if (!table) return null;

  const statusInfo = statusMap[table.status] || statusMap.available;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col font-body bg-card">
        <SheetHeader className="text-right">
          <SheetTitle className="font-headline text-2xl">تفاصيل الطاولة {table.id}</SheetTitle>
          <SheetDescription>
            <Badge variant="outline" className={`text-sm ${statusInfo.className}`}>{statusInfo.text}</Badge>
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 px-1 space-y-6">
          <div className="space-y-2">
            <h3 className="font-headline text-lg text-foreground">ملخص الجلسة</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              {table.seatingDuration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>مدة الجلوس: {table.seatingDuration}</span>
                </div>
              )}
              {table.chefConfirmationTime && (
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>تأكيد الشيف: {table.chefConfirmationTime}</span>
                </div>
              )}
               {table.order?.id && (
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  <span>رقم الطلب: {table.order.id}</span>
                </div>
              )}
            </div>
          </div>
          
          <Separator />
          
          {table.order && table.order.items.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-headline text-lg text-foreground">الطلب</h3>
              <div className="space-y-3">
                {table.order.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {item.price.toFixed(2)} ر.س
                      </p>
                    </div>
                    <p className="font-semibold">{(item.quantity * item.price).toFixed(2)} ر.س</p>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex justify-between items-center font-bold text-lg">
                <span>الإجمالي</span>
                <span>{table.order.total.toFixed(2)} ر.س</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
                <p className="text-muted-foreground">لا يوجد طلب لهذه الطاولة بعد.</p>
            </div>
          )}
        </div>
        <SheetFooter className="mt-auto">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button variant="accent" className="flex-1">طباعة الفاتورة</Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
