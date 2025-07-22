
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { type MenuItem, type MenuItemCategory } from '@/types';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, Search, Printer, CreditCard, Coins, FilePenLine, Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { AuthGuard } from '@/components/auth-guard';
import { useToast } from '@/hooks/use-toast';


const categories: { value: MenuItemCategory | 'all', ar: string, en: string }[] = [
    { value: 'all', ar: 'الكل', en: 'All' },
    { value: 'appetizer', ar: 'مقبلات', en: 'Appetizers' },
    { value: 'main', ar: 'رئيسية', en: 'Main' },
    { value: 'drink', ar: 'مشروبات', en: 'Drinks' },
    { value: 'dessert', ar: 'حلويات', en: 'Desserts' },
];

function QuickPOSPage() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const { toast } = useToast();

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cart, setCart] = useState<MenuItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<MenuItemCategory | 'all'>('all');
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/v1/menu-items');
                if (!response.ok) throw new Error('Failed to fetch menu items');
                const data = await response.json();
                setMenuItems(data.map((item: MenuItem) => ({ ...item, quantity: 0 })));
            } catch (error) {
                console.error(error);
                toast({
                    variant: 'destructive',
                    title: t('خطأ في جلب البيانات', 'Fetch Error'),
                    description: t('لم نتمكن من تحميل قائمة الطعام.', 'Could not load the menu.'),
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchMenuItems();
    }, [t, toast]);

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, change: number) => {
        setCart(prev => {
            const updatedCart = prev.map(item =>
                item.id === itemId ? { ...item, quantity: (item.quantity || 0) + change } : item
            );
            return updatedCart.filter(item => item.quantity > 0);
        });
    };

    const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * (item.quantity || 0), 0), [cart]);

    const filteredItems = useMemo(() =>
        menuItems.filter(item =>
            (activeCategory === 'all' || item.category === activeCategory) &&
            ((t(item.name, item.name_en || item.name).toLowerCase().includes(searchTerm.toLowerCase())))
        ), [menuItems, searchTerm, activeCategory, language, t]);

    const completeOrder = () => {
        console.log("Order completed:", cart);
        // Here you would typically send the order to the backend
        toast({
            title: t('اكتمل الطلب', 'Order Completed'),
            description: t(`تم تسجيل الطلب النقدي بقيمة ${total.toLocaleString()} ل.س بنجاح.`, `Cash order for ${total.toLocaleString()} SYP recorded successfully.`),
        });
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
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {categories.map(cat => (
                        <Button 
                            key={cat.value} 
                            variant={activeCategory === cat.value ? 'default' : 'outline'}
                            onClick={() => setActiveCategory(cat.value)}
                            className={cn(
                                "py-6 px-5 text-base font-semibold transition-all duration-200 transform hover:scale-105 select-none",
                                activeCategory === cat.value ? 'shadow-lg bg-primary text-primary-foreground' : 'bg-card text-card-foreground shadow-md'
                            )}
                        >
                            {t(cat.ar, cat.en)}
                        </Button>
                    ))}
                </div>
                <ScrollArea className="flex-1 -m-2 p-2">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {filteredItems.map(item => (
                                <Card key={item.id} className="cursor-pointer hover:border-primary active:border-primary active:scale-95 transition-all duration-100 flex flex-col select-none" onClick={() => addToCart(item)}>
                                    <CardContent className="p-2 text-center flex-1 flex flex-col justify-center">
                                        <p className="font-bold text-base leading-tight">{t(item.name, item.name_en || '')}</p>
                                        <p className="text-sm text-muted-foreground font-semibold">{item.price.toLocaleString()} {t('ل.س', 'SYP')}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
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

export default function GuardedQuickPOSPage() {
    return (
        <AuthGuard>
            <QuickPOSPage />
        </AuthGuard>
    )
}
