
"use client";

import { useState, useEffect } from "react";
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
import { Hash, Check, Pencil, CheckCircle, XCircle } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useOrderFlow } from "@/hooks/use-order-flow";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface OrderDetailsSheetProps {
  table: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusMap: Record<string, { ar: string, en: string, className: string }> = {
    new_order: { ar: "طلب جديد", en: "New Order", className: "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30" },
    pending_cashier_approval: { ar: "بانتظار موافقة المحاسب", en: "Pending Cashier", className: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30" },
    awaiting_final_confirmation: { ar: "بانتظار تأكيد الزبون", en: "Awaiting Customer", className: "bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30" },
    confirmed: { ar: "مؤكد", en: "Confirmed", className: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" },
    ready: { ar: "جاهز للتسليم", en: "Ready", className: "bg-teal-500/20 text-teal-700 dark:text-teal-400 border-teal-500/30" },
    paying: { ar: "في مرحلة الدفع", en: "Paying", className: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30" },
    occupied: { ar: "محجوزة", en: "Occupied", className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
    needs_attention: { ar: "تحتاج مساعدة", en: "Needs Attention", className: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30" },
    available: { ar: "متاحة", en: "Available", className: "bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30" },
};

export function OrderDetailsSheet({ table, open, onOpenChange }: OrderDetailsSheetProps) {
  const { language } = useLanguage();
  const { approveOrderByCashier, completeOrder, cancelOrder } = useOrderFlow();
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const [serviceCharge, setServiceCharge] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    if (table?.order) {
        setServiceCharge(table.order.service_charge || 0);
        setTax(table.order.tax || 0);
    }
  }, [table?.order])

  if (!table) {
    return null;
  }

  const statusInfo = statusMap[table.status] || statusMap.available;
  const order = table.order;

  const isCashierApprovalStep = table.status === 'pending_cashier_approval';
  const isCompletableStep = table.status === 'ready';

  const subtotal = order?.subtotal || 0;
  const finalTotal = subtotal + serviceCharge + tax;

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SY')} ${t('ل.س', 'SYP')}`;
  }

  const handleCashierApproval = () => {
    if (order?.id) {
        approveOrderByCashier(order.id, serviceCharge, tax);
        onOpenChange(false);
    }
  }

  const handleCompleteOrder = () => {
      if (order?.id) {
          completeOrder(order.id);
          onOpenChange(false);
      }
  }
  
  const handleCancelOrder = () => {
    if (order?.id) {
        cancelOrder(order.id);
        onOpenChange(false);
    }
  }


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full flex flex-col font-body bg-card">
        <div id={`invoice-table-${table.id}`} className="print:bg-white print:text-black">
          <SheetHeader className="text-start">
            <SheetTitle className="font-headline text-2xl">{t('تفاصيل الطاولة', 'Table Details')} {table.id}</SheetTitle>
            <SheetDescription>
              <Badge variant="outline" className={`text-sm ${statusInfo.className}`}>{t(statusInfo.ar, statusInfo.en)}</Badge>
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
            
            <div className="space-y-2">
              <h3 className="font-headline text-lg text-foreground no-print">{t('ملخص الجلسة', 'Session Summary')}</h3>
              <div className="text-sm text-muted-foreground print:text-gray-600 space-y-2">
                {order?.id && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span>{t('رقم الطلب', 'Order No.')}: {order.id.substring(0, 8)}...</span>
                  </div>
                )}
                <p>{t('التاريخ', 'Date')}: {new Date().toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}</p>
              </div>
            </div>
            
            <Separator />
            
            {order && order.items.length > 0 ? (
              <div className="space-y-4">
                <h3 className="font-headline text-lg text-foreground print:text-black">{t('تفاصيل الفاتورة', 'Invoice Details')}</h3>
                
                {/* Items List */}
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{language === 'ar' ? item.name : (item.name_en || item.name)}</p>
                        <p className="text-xs text-muted-foreground print:text-gray-600">
                          {item.quantity} x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.quantity * item.price)}</p>
                    </div>
                  ))}
                </div>
                
                <Separator />

                {/* Totals Section */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span>{t('المجموع الفرعي', 'Subtotal')}</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    
                    {isCashierApprovalStep ? (
                        <>
                         <div className="flex justify-between items-center">
                            <Label htmlFor="service-charge" className="flex-1">{t('رسوم الخدمة', 'Service Charge')}</Label>
                            <Input 
                                id="service-charge" 
                                type="number" 
                                className="w-28 h-8" 
                                value={serviceCharge} 
                                onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)} 
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="tax" className="flex-1">{t('ضريبة', 'Tax')}</Label>
                            <Input 
                                id="tax" 
                                type="number" 
                                className="w-28 h-8" 
                                value={tax}
                                onChange={(e) => setTax(parseFloat(e.target.value) || 0)} 
                            />
                        </div>
                        </>
                    ) : (
                         <>
                         <div className="flex justify-between items-center">
                            <span>{t('رسوم الخدمة', 'Service Charge')}</span>
                            <span className="font-medium">{formatCurrency(order.service_charge)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>{t('ضريبة', 'Tax')}</span>
                            <span className="font-medium">{formatCurrency(order.tax)}</span>
                        </div>
                         </>
                    )}


                    <Separator className="!my-4" />
                    <div className="flex justify-between items-center font-bold text-xl">
                        <span>{t('الإجمالي النهائي', 'Final Total')}</span>
                        <span>{formatCurrency(isCashierApprovalStep ? finalTotal : order.final_total)}</span>
                    </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('لا يوجد طلب لهذه الطاولة بعد.', 'No order for this table yet.')}</p>
              </div>
            )}
          </div>
        </div>
        <SheetFooter className="mt-auto no-print">
            {isCashierApprovalStep ? (
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button onClick={handleCashierApproval} size="lg" className="w-full flex-grow">
                        <Check className="w-5 h-5 ltr:mr-2 rtl:ml-2"/>
                        {t('إرسال الفاتورة النهائية للزبون', 'Send Final Invoice')}
                    </Button>
                     <Button onClick={handleCancelOrder} size="lg" variant="destructive" className="w-full sm:w-auto">
                        <XCircle className="w-5 h-5 ltr:mr-2 rtl:ml-2"/>
                    </Button>
                </div>
            ) : isCompletableStep ? (
                 <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button onClick={handleCompleteOrder} size="lg" className="w-full flex-grow" variant="default">
                        <CheckCircle className="w-5 h-5 ltr:mr-2 rtl:ml-2"/>
                        {t('إتمام وتسجيل الدفع', 'Complete & Pay')}
                    </Button>
                     <Button onClick={handleCancelOrder} size="lg" variant="destructive" className="w-full sm:w-auto">
                        <XCircle className="w-5 h-5 ltr:mr-2 rtl:ml-2"/>
                    </Button>
                </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button variant="secondary" className="flex-1" disabled>
                  <Pencil className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
                  <span>{t('لا يمكن تعديل الفاتورة الآن', 'Invoice Locked')}</span>
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)}>{t('إغلاق', 'Close')}</Button>
              </div>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
