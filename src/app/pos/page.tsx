"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { type MenuItem } from '@/types';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, Search, Printer, CreditCard, Coins } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const menuItems: MenuItem[] = [
    { id: 'item-1', name: 'مشويات مشكلة', name_en: 'Mixed Grill', price: 85000, category: 'main', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "syrian food" },
    { id: 'item-4', name: 'كبة مقلية', name_en: 'Fried Kibbeh', price: 25000, category: 'appetizer', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "kibbeh food" },
    { id: 'item-5', name: 'فتوش', name_en: 'Fattoush', price: 20000, category: 'appetizer', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "fattoush salad" },
    { id: 'item-6', name: 'شيش طاووق', name_en: 'Shish Tawook', price: 60000, category: 'main', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "shish taouk" },
    { id: 'item-7', name: 'بيبسي', name_en: 'Pepsi', price: 8000, category: 'drink', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "pepsi can" },
    { id: 'item-8', name: 'عصير برتقال طازج', name_en: 'Fresh Orange Juice', price: 18000, category: 'drink', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "orange juice" },
    { id: 'item-9', name: 'كنافة بالجبن', name_en: 'Cheese Kunafa', price: 35000, category: 'dessert', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "kunafa cheese" },
];


export default function QuickPOSPage() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [cart, setCart] = useState<MenuItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, change: number) => {
        setCart(prev => {
            const updatedCart = prev.map(item =>
                item.id === itemId ? { ...item, quantity: item.quantity + change } : item
            );
            return updatedCart.filter(item => item.quantity > 0);
        });
    };

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

    const filteredItems = useMemo(() =>
        menuItems.filter(item =>
            (item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.name_en && item.name_en.toLowerCase().includes(searchTerm.toLowerCase()))
        ), [searchTerm]);

    const completeOrder = () => {
        console.log("Order completed:", cart);
        // Here you would typically send the order to the backend
        setCart([]); // Clear cart after completion
        setIsConfirming(false);
    }

    return (
        <main className="flex h-[calc(100vh-theme(spacing.14))] bg-muted/20">
            <div className="flex-1 p-4 flex flex-col">
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder={t("ابحث عن صنف...", "Search for an item...")} 
                            className="w-full text-lg p-6 ltr:pl-12 rtl:pr-12" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <ScrollArea className="flex-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredItems.map(item => (
                            <Card key={item.id} className="cursor-pointer hover:border-primary transition-colors group" onClick={() => addToCart(item)}>
                                <div className="relative h-24">
                                     <Image src={item.image || 'https://placehold.co/600x400'} alt={item.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint={item['data-ai-hint']} />
                                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                </div>
                                <CardContent className="p-2 text-center">
                                    <p className="font-bold text-sm truncate">{language === 'ar' ? item.name : item.name_en}</p>
                                    <p className="text-xs text-muted-foreground">{item.price.toLocaleString()} {t('ل.س', 'SYP')}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <aside className="w-[380px] bg-card ltr:border-l rtl:border-r flex flex-col shadow-lg">
                 <CardHeader>
                    <CardTitle className="font-headline text-2xl">{t("السلة الحالية", "Current Cart")}</CardTitle>
                </CardHeader>
                 <ScrollArea className="flex-1">
                    <CardContent className="space-y-3">
                        {cart.length === 0 ? (
                             <div className="text-center text-muted-foreground py-16">
                                <p>{t("السلة فارغة", "Cart is empty")}</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <p className="font-semibold">{language === 'ar' ? item.name : item.name_en}</p>
                                        <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} {t('ل.س', 'SYP')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-4 w-4" /></Button>
                                        <span className="font-bold w-5 text-center">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-4 w-4" /></Button>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => updateQuantity(item.id, -item.quantity)}><Trash2 className="h-4 w-4"/></Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </ScrollArea>
                {cart.length > 0 && (
                    <div className="p-4 border-t mt-auto space-y-4">
                        <Separator />
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span>{t("الإجمالي", "Total")}</span>
                            <span>{total.toLocaleString()} {t('ل.س', 'SYP')}</span>
                        </div>
                         <Button size="lg" className="w-full font-bold text-lg" onClick={() => setIsConfirming(true)}>
                            {t("إتمام الدفع", "Complete Payment")}
                         </Button>
                         <Button variant="outline" size="lg" className="w-full">
                            <Printer className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                            {t("طباعة فاتورة", "Print Invoice")}
                        </Button>
                    </div>
                )}
            </aside>
            <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t("تأكيد الدفع", "Confirm Payment")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t("المبلغ الإجمالي هو", "The total amount is")} {total.toLocaleString()} {t('ل.س', 'SYP')}. {t("الرجاء اختيار طريقة الدفع.", "Please choose a payment method.")}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={completeOrder} className="bg-green-600 hover:bg-green-700">
                            <Coins className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                            {t("دفع نقدي", "Cash Payment")}
                        </AlertDialogAction>
                         <AlertDialogAction onClick={completeOrder}>
                            <CreditCard className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                            {t("دفع بالبطاقة", "Card Payment")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
