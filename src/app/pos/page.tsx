
"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { type MenuItem, type MenuItemCategory } from '@/types';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, Search, Printer, CreditCard, Coins, FilePenLine } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    { id: 'item-1', name: 'مشويات مشكلة', name_en: 'Mixed Grill', price: 85000, category: 'main', quantity: 0 },
    { id: 'item-4', name: 'كبة مقلية', name_en: 'Fried Kibbeh', price: 25000, category: 'appetizer', quantity: 0 },
    { id: 'item-5', name: 'فتوش', name_en: 'Fattoush', price: 20000, category: 'appetizer', quantity: 0 },
    { id: 'item-6', name: 'شيش طاووق', name_en: 'Shish Tawook', price: 60000, category: 'main', quantity: 0 },
    { id: 'item-7', name: 'بيبسي', name_en: 'Pepsi', price: 8000, category: 'drink', quantity: 0 },
    { id: 'item-8', name: 'عصير برتقال طازج', name_en: 'Fresh Orange Juice', price: 18000, category: 'drink', quantity: 0 },
    { id: 'item-9', name: 'كنافة بالجبن', name_en: 'Cheese Kunafa', price: 35000, category: 'dessert', quantity: 0 },
];

const categories: { value: MenuItemCategory | 'all', ar: string, en: string }[] = [
    { value: 'all', ar: 'الكل', en: 'All' },
    { value: 'appetizer', ar: 'مقبلات', en: 'Appetizers' },
    { value: 'main', ar: 'رئيسية', en: 'Main' },
    { value: 'drink', ar: 'مشروبات', en: 'Drinks' },
    { value: 'dessert', ar: 'حلويات', en: 'Desserts' },
];

export default function QuickPOSPage() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [cart, setCart] = useState<MenuItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<MenuItemCategory | 'all'>('all');
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
            (activeCategory === 'all' || item.category === activeCategory) &&
            ((t(item.name, item.name_en || item.name).toLowerCase().includes(searchTerm.toLowerCase())))
        ), [searchTerm, activeCategory, language, t]);

    const completeOrder = () => {
        console.log("Order completed:", cart);
        // Here you would typically send the order to the backend
        setCart([]); // Clear cart after completion
        setIsConfirming(false);
    }
    
    const clearCart = () => {
        setCart([]);
    }

    return (
        <main className="flex h-[calc(100vh-theme(spacing.14))] bg-muted/20 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Items Grid */}
            <div className="flex-1 p-4 flex flex-col">
                <div className="flex gap-4 mb-4">
                     <div className="relative flex-1">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder={t("ابحث عن صنف...", "Search for an item...")} 
                            className="w-full text-base py-6 ltr:pl-12 rtl:pr-12" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button asChild variant="outline" size="lg">
                        <Link href="/menu-management">
                             <FilePenLine className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
                            {t("إدارة القائمة", "Manage Menu")}
                        </Link>
                    </Button>
                </div>
                <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as MenuItemCategory | 'all')} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-4 h-12">
                        {categories.map(cat => (
                            <TabsTrigger key={cat.value} value={cat.value} className="text-base">{t(cat.ar, cat.en)}</TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
                <ScrollArea className="flex-1 -m-2 p-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {filteredItems.map(item => (
                            <Card key={item.id} className="cursor-pointer hover:border-primary active:border-primary active:scale-95 transition-all duration-100 flex flex-col" onClick={() => addToCart(item)}>
                                <CardContent className="p-2 text-center flex-1 flex flex-col justify-center">
                                    <p className="font-bold text-base leading-tight">{t(item.name, item.name_en || '')}</p>
                                    <p className="text-sm text-muted-foreground font-semibold">{item.price.toLocaleString()} {t('ل.س', 'SYP')}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Cart Section */}
            <aside className="w-[420px] bg-card ltr:border-l rtl:border-r flex flex-col shadow-lg">
                 <div className="p-4 flex justify-between items-center border-b">
                    <h2 className="font-headline text-2xl">{t("السلة الحالية", "Current Cart")}</h2>
                    <Button variant="ghost" size="icon" onClick={clearCart} disabled={cart.length === 0} className="h-10 w-10">
                        <Trash2 className="h-6 w-6" />
                    </Button>
                 </div>
                 <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {cart.length === 0 ? (
                             <div className="text-center text-muted-foreground py-20 flex flex-col items-center gap-4">
                                <p className="text-lg">{t("أضف أصنافاً لبدء الطلب", "Add items to start an order")}</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex items-center gap-3 text-base">
                                    <div className="flex-1">
                                        <p className="font-semibold">{t(item.name, item.name_en || '')}</p>
                                        <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} {t('ل.س', 'SYP')}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.id, 1)}><Plus className="h-5 w-5" /></Button>
                                        <span className="font-bold w-6 text-center text-lg">{item.quantity}</span>
                                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => updateQuantity(item.id, -1)}><Minus className="h-5 w-5" /></Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
                {cart.length > 0 && (
                    <div className="p-4 border-t mt-auto space-y-3 bg-muted/30">
                        <div className="flex justify-between items-center text-2xl font-bold">
                            <span>{t("الإجمالي", "Total")}</span>
                            <span>{total.toLocaleString()} {t('ل.س', 'SYP')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button size="lg" className="w-full font-bold text-lg h-14 bg-green-600 hover:bg-green-700" onClick={() => setIsConfirming(true)}>
                                <Coins className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
                                {t("دفع نقدي", "Cash")}
                             </Button>
                             <Button size="lg" className="w-full font-bold text-lg h-14" onClick={() => setIsConfirming(true)}>
                                <CreditCard className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
                                {t("دفع بالبطاقة", "Card")}
                             </Button>
                        </div>
                         <Button variant="outline" size="lg" className="w-full h-12 text-base">
                            <Printer className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
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
                        {t("المبلغ الإجمالي هو", "The total amount is")} {total.toLocaleString()} {t('ل.س', 'SYP')}. {t("هل أنت متأكد من إتمام العملية؟", "Are you sure you want to complete the transaction?")}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={completeOrder}>
                            {t("تأكيد وإتمام", "Confirm & Complete")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}
