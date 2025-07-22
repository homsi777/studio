
"use client";
import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import type { MenuItem, Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Minus, Plus, ShoppingCart, Trash2, CheckCircle, Loader2, PartyPopper, Check, ArrowLeft, Utensils } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/hooks/use-language';
import { useRestaurantSettings } from '@/hooks/use-restaurant-settings';
import { useOrderFlow } from '@/hooks/use-order-flow';
import { uuidToTableMap } from '@/lib/utils';
import { MenuItemCard } from '@/components/menu/menu-item-card';
import { useToast } from '@/hooks/use-toast';


export default function MenuPage() {
    const params = useParams();
    const tableUuid = params.uuid as string;
    const displayTableNumber = uuidToTableMap[tableUuid] || 'N/A';

    const { language, dir } = useLanguage();
    const { settings } = useRestaurantSettings();
    const { submitOrder, confirmFinalOrder, orders } = useOrderFlow();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const { toast } = useToast();

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [isLoadingMenu, setIsLoadingMenu] = useState(true);
    const [cart, setCart] = useState<MenuItem[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<MenuItem['category'] | 'all'>('all');

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setIsLoadingMenu(true);
                const response = await fetch('/api/v1/menu-items');
                if (!response.ok) throw new Error('Failed to fetch menu');
                const data = await response.json();
                setMenuItems(data);
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load the menu.",
                })
            } finally {
                setIsLoadingMenu(false);
            }
        };
        fetchMenuItems();
    }, [toast]);

    useEffect(() => {
        let sid = sessionStorage.getItem('session_id');
        if (!sid) {
            sid = crypto.randomUUID();
            sessionStorage.setItem('session_id', sid);
        }
        setSessionId(sid);
    }, []);

    useEffect(() => {
        if (!sessionId) return;
        const activeOrder = orders.find(o => o.tableUuid === tableUuid && o.sessionId === sessionId && o.status !== 'completed' && o.status !== 'cancelled');
        setCurrentOrder(activeOrder || null);
    }, [orders, tableUuid, sessionId]);

    const addToCart = (item: MenuItem) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            setCart(prevCart => prevCart.filter(item => item.id !== itemId));
        } else {
            setCart(prevCart => prevCart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
        }
    };

    const total = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cart]);

    const formatCurrency = (amount: number) => {
        const value = amount;
        const symbol = t('ل.س', 'SYP');
        return `${value.toLocaleString('ar-SY')} ${symbol}`;
    };

    const handleSendOrder = async () => {
        if (!sessionId || !tableUuid || displayTableNumber === 'N/A' || cart.length === 0) {
            toast({
                variant: 'destructive',
                title: t('خطأ', 'Error'),
                description: t('لا يمكن إرسال طلب فارغ أو بدون معلومات الطاولة.', 'Cannot send an empty order or without table info.'),
            });
            return;
        }

        setIsSubmitting(true);
        const newOrder: Omit<Order, 'id' | 'status' | 'timestamp'> = {
            tableId: parseInt(displayTableNumber),
            tableUuid: tableUuid,
            sessionId: sessionId,
            items: cart.map(({ quantity, ...item }) => ({ ...item, quantity: quantity || 0 })), // Ensure quantity is set
            total: total,
        }
        await submitOrder(newOrder);
        setIsSubmitting(false);
        setCart([]);
    };

    const sections = useMemo(() => [
        { id: 'all', title: t('الكل', 'All'), icon: <Utensils/> },
        { id: 'appetizer', title: t('المقبلات', 'Appetizers'), icon: <Utensils/> },
        { id: 'main', title: t('الرئيسية', 'Main'), icon: <Utensils/> },
        { id: 'drink', title: t('المشروبات', 'Drinks'), icon: <Utensils/> },
        { id: 'dessert', title: t('الحلويات', 'Desserts'), icon: <Utensils/> }
    ], [t]);
    
    const filteredItems = useMemo(() => {
        if (activeCategory === 'all') return menuItems;
        return menuItems.filter(i => i.category === activeCategory);
    }, [activeCategory, menuItems]);
    
    if (currentOrder) {
        if (currentOrder.status === 'pending_chef_approval' || currentOrder.status === 'pending_cashier_approval') {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center" dir={dir}>
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                        <Loader2 className="w-24 h-24 text-primary mx-auto mb-6 animate-spin" />
                        <h1 className="font-headline text-3xl font-bold text-foreground mb-2">{t('بانتظار موافقة المطعم...', 'Awaiting Restaurant Approval...')}</h1>
                        <p className="text-muted-foreground max-w-md mx-auto mb-4">
                            {t('طلبك قيد المراجعة من قبل الشيف والمحاسب. سيتم إعلامك فوراً عند الموافقة للمتابعة.', 'Your order is being reviewed by the chef and cashier. You will be notified immediately upon approval to proceed.')}
                        </p>
                        {currentOrder.status === 'pending_cashier_approval' && (
                             <motion.div initial={{opacity: 0, y:10}} animate={{opacity:1, y:0}} className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-lg p-3 text-sm font-semibold">
                                {t('تمت موافقة الشيف بنجاح!', 'Chef Approved!')}
                             </motion.div>
                        )}
                    </motion.div>
                </div>
            );
        }

        if (currentOrder.status === 'pending_final_confirmation') {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center" dir={dir}>
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                        <PartyPopper className="w-24 h-24 text-green-500 mx-auto mb-6" />
                        <h1 className="font-headline text-3xl font-bold text-foreground mb-2">{t('تمت الموافقة على طلبك!', 'Your Order is Approved!')}</h1>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            {t('الشيف والمحاسب جاهزان. هل تود تأكيد الطلب نهائياً وإرساله إلى المطبخ؟', 'The chef and cashier are ready. Would you like to finalize the order and send it to the kitchen?')}
                        </p>
                        <Button onClick={() => confirmFinalOrder(currentOrder.id)} size="lg" className="h-14 text-lg">
                            <Check className="w-6 h-6 ltr:mr-2 rtl:ml-2" />
                            {t('تأكيد الطلب النهائي', 'Confirm Final Order')}
                        </Button>
                    </motion.div>
                </div>
            );
        }

        if (currentOrder.status === 'confirmed') {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center" dir={dir}>
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                        <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
                        <h1 className="font-headline text-3xl font-bold text-foreground mb-2">{t('تم إرسال طلبكم بنجاح!', 'Your order has been sent successfully!')}</h1>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            {t('طلبك الآن قيد التحضير. نتمنى لكم وقتاً ممتعاً!', 'Your order is now being prepared. We wish you a pleasant time!')}
                        </p>
                    </motion.div>
                </div>
            );
        }
    }


    return (
        <div className="bg-background min-h-screen font-body select-none" dir={dir}>
            <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-30">
                <div className="container mx-auto flex justify-between items-center gap-4">
                    <div className="text-center flex-1">
                        <h1 className="font-headline text-2xl font-bold text-primary">{settings.restaurantName}</h1>
                        <p className="text-sm text-muted-foreground">{t('الطاولة رقم', 'Table No.')} {displayTableNumber}</p>
                    </div>
                </div>
            </header>

             <nav className="flex justify-center gap-2 sm:gap-4 p-4 sticky top-[73px] bg-background/80 backdrop-blur-sm z-20 overflow-x-auto">
                {sections.map(section => (
                    <Button 
                        key={section.id} 
                        variant={activeCategory === section.id ? 'default' : 'ghost'}
                        onClick={() => setActiveCategory(section.id as any)}
                        className="rounded-full shrink-0"
                        size="lg"
                    >
                        {section.title}
                    </Button>
                ))}
            </nav>

            <main className="container mx-auto p-4 sm:p-6 pb-32">
                 {isLoadingMenu ? (
                    <div className="flex justify-center items-center h-64">
                         <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                ) : filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredItems.map(item => (
                            <MenuItemCard
                                key={item.id}
                                item={item}
                                onAddToCart={addToCart}
                                formatCurrency={formatCurrency}
                            />
                        ))}
                    </div>
                 ) : (
                    <div className="text-center py-20 text-muted-foreground">
                        <Utensils className="mx-auto h-12 w-12 mb-4"/>
                        <p>{t('لا توجد أصناف متاحة في هذا القسم حالياً.', 'No items available in this category right now.')}</p>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div
                        initial={{ y: "110%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "110%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed bottom-4 right-4 z-40"
                    >
                        <Sheet>
                            <SheetTrigger asChild>
                                <motion.button
                                    className="rounded-full h-16 w-16 shadow-2xl bg-primary hover:bg-primary/90 relative flex items-center justify-center text-primary-foreground"
                                    whileTap={{ scale: 0.9 }}
                                    key={cart.length}
                                    animate={{ scale: [1, 1.1, 1], transition: { duration: 0.3 } }}
                                >
                                    <ShoppingCart className="h-8 w-8" />
                                    <motion.div
                                        key={cart.reduce((acc, item) => acc + item.quantity, 0)}
                                        initial={{ scale: 0, y: 10 }}
                                        animate={{ scale: 1, y: 0 }}
                                        className="absolute -top-1 -right-1 bg-accent text-accent-foreground rounded-full h-7 w-7 flex items-center justify-center text-sm font-bold border-2 border-background"
                                    >
                                        {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                    </motion.div>
                                </motion.button>
                            </SheetTrigger>
                            <SheetContent side={language === 'ar' ? 'left' : 'right'} className="w-full sm:max-w-md flex flex-col" dir={dir}>
                                <SheetHeader className="text-start">
                                    <SheetTitle className="font-headline text-2xl">{t('سلة الطلبات', 'Your Order')}</SheetTitle>
                                </SheetHeader>
                                <div className="flex-1 overflow-y-auto -mx-6 px-6 py-4 space-y-4">
                                    <AnimatePresence>
                                        {cart.map(item => (
                                            <motion.div
                                                key={item.id}
                                                layout
                                                initial={{ opacity: 0, x: 50 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -50 }}
                                                transition={{ duration: 0.3 }}
                                                className="flex items-center gap-4"
                                            >
                                                {item.image && <Image src={item.image} alt={t(item.name, item.name_en || '')} width={64} height={64} className="rounded-md object-cover" data-ai-hint={item.image_hint || ''} />}
                                                <div className="flex-1">
                                                    <p className="font-bold">{language === 'ar' ? item.name : (item.name_en || item.name)}</p>
                                                    <p className="text-sm text-primary font-semibold">{formatCurrency(item.price)}</p>
                                                </div>
                                                <div className="flex items-center gap-1 bg-muted p-1 rounded-full">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                                    <span className="font-bold text-base w-6 text-center">{item.quantity}</span>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-9 w-9 rounded-full" onClick={() => updateQuantity(item.id, 0)}><Trash2 className="h-5 w-5" /></Button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                <SheetFooter>
                                    <div className="w-full space-y-4 pt-4 border-t">
                                        <div className="flex justify-between items-center text-xl font-bold">
                                            <span>{t('الإجمالي:', 'Total:')}</span>
                                            <span>{formatCurrency(total)}</span>
                                        </div>
                                        <Button size="lg" className="w-full font-bold text-lg h-14" onClick={handleSendOrder} disabled={isSubmitting}>
                                            {isSubmitting ? (
                                                <Loader2 className="w-5 h-5 ltr:mr-2 rtl:ml-2 animate-spin"/>
                                            ) : (
                                                <ArrowLeft className="w-5 h-5 ltr:mr-2 rtl:ml-2"/>
                                            )}
                                            {isSubmitting ? t('جارِ الإرسال...', 'Submitting...') : t('إرسال للموافقة', 'Send for Approval')}
                                        </Button>
                                    </div>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
