
"use client";
import { useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { type MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { MinusCircle, PlusCircle, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/use-language';
import { DigitalClock } from '@/components/digital-clock';
import { useRestaurantSettings } from '@/hooks/use-restaurant-settings';

const menuItems: MenuItem[] = [
    { id: 'item-1', name: 'مشويات مشكلة', name_en: 'Mixed Grill', price: 85000, description: 'كباب، شيش طاووق، لحم بعجين.', category: 'main', quantity: 0, offer: 'خصم 15%', offer_en: '15% Off' },
    { id: 'item-4', name: 'كبة مقلية', name_en: 'Fried Kibbeh', price: 25000, description: '4 قطع محشوة باللحم والجوز.', category: 'appetizer', quantity: 0 },
    { id: 'item-5', name: 'فتوش', name_en: 'Fattoush', price: 20000, description: 'خضروات طازجة وخبز محمص.', category: 'appetizer', quantity: 0 },
    { id: 'item-6', name: 'شيش طاووق', name_en: 'Shish Tawook', price: 60000, description: 'أسياخ دجاج متبلة ومشوية.', category: 'main', quantity: 0 },
    { id: 'item-7', name: 'بيبسي', name_en: 'Pepsi', price: 8000, description: 'مشروب غازي منعش.', category: 'drink', quantity: 0 },
    { id: 'item-8', name: 'عصير برتقال', name_en: 'Orange Juice', price: 18000, description: 'طبيعي معصور عند الطلب.', category: 'drink', quantity: 0, offer: 'عرض خاص', offer_en: 'Special Offer' },
    { id: 'item-9', name: 'كنافة بالجبن', name_en: 'Cheese Kunafa', price: 35000, description: 'طبقة كنافة ناعمة مع جبنة.', category: 'dessert', quantity: 0 },
    { id: 'item-10', name: 'سلطة سيزر', name_en: 'Caesar Salad', price: 30000, description: 'خس، دجاج مشوي، وصلصة السيزر.', category: 'appetizer', quantity: 0 },
];

// In a real app, this would be fetched from the backend based on the UUID
const uuidToTableMap: Record<string, string> = {
    "d2a5c1b8-3e9f-4b0a-8d1c-7f8e9a2b3c4d": "5",
    "a1b2c3d4-e5f6-7890-1234-567890abcdef": "1"
};

const USD_TO_SYP_RATE = 15000;

export default function MenuPage() {
    const params = useParams();
    const tableId = params.uuid as string;
    const displayTableNumber = uuidToTableMap[tableId] || tableId;

    const { language, dir } = useLanguage();
    const { settings } = useRestaurantSettings();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const [cart, setCart] = useState<MenuItem[]>([]);
    const [currency, setCurrency] = useState<'SYP' | 'USD'>('SYP');
    const [orderState, setOrderState] = useState<'idle' | 'sending' | 'confirmed'>('idle');
    const cartRef = useRef<HTMLDivElement | null>(null);

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
        const value = currency === 'SYP' ? amount : amount / USD_TO_SYP_RATE;
        const symbol = currency === 'SYP' ? 'ل.س' : '$';
        const formattedAmount = currency === 'SYP' ? value.toLocaleString('ar-SY') : value.toFixed(2);
        return `${formattedAmount} ${symbol}`;
    };

    const handleSendOrder = () => {
        setOrderState('sending');
        // When sending to backend, we'd send the UUID (tableId)
        console.log('Sending order for UUID:', { tableId, cart, total });
        setTimeout(() => {
            setOrderState('confirmed');
        }, 2000);
    };

    const sections = useMemo(() => [
        { title: t('المقبلات', 'Appetizers'), items: menuItems.filter(i => i.category === 'appetizer') },
        { title: t('الأطباق الرئيسية', 'Main Courses'), items: menuItems.filter(i => i.category === 'main') },
        { title: t('المشروبات', 'Drinks'), items: menuItems.filter(i => i.category === 'drink') },
        { title: t('الحلويات', 'Desserts'), items: menuItems.filter(i => i.category === 'dessert') }
    ], [language]);
    
    if (orderState === 'confirmed') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center" dir={dir}>
                 <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                    <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
                    <h1 className="font-headline text-3xl font-bold text-foreground mb-2">{t('تم إرسال طلبكم بنجاح!', 'Your order has been sent successfully!')}</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        {t('الشيف قد استلم طلبكم وسيبدأ بتحضيره قريباً. شكراً لاختياركم مطعم العالمية ونتمنى لكم وقتاً ممتعاً.', 'The chef has received your order and will start preparing it soon. Thank you for choosing Al-Alamiyah Restaurant, we wish you a pleasant time.')}
                    </p>
                 </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen font-body select-none" dir={dir}>
            <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <div className="container mx-auto flex justify-between items-center gap-4">
                    <div className="text-center">
                        <h1 className="font-headline text-2xl font-bold text-primary">{settings.restaurantName}</h1>
                        <p className="text-sm text-muted-foreground">{t('الطاولة رقم', 'Table No.')} {displayTableNumber}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <DigitalClock />
                        <Button variant="outline" size="sm" onClick={() => setCurrency(c => c === 'SYP' ? 'USD' : 'SYP')}>
                            {currency === 'SYP' ? 'USD' : 'SYP'}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 pb-32">
                 {sections.map(section => (
                    section.items.length > 0 &&
                    <section key={section.title} className="mb-12">
                        <h2 className="font-headline text-3xl font-bold mb-6 text-primary">{section.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {section.items.map(item => (
                                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <Card className="overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:border-primary/50 h-full relative">
                                    <CardContent className="p-4 flex-grow flex flex-col">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className="font-headline text-xl">{language === 'ar' ? item.name : (item.name_en || item.name)}</h3>
                                                {item.offer && (
                                                    <Badge className="bg-accent text-accent-foreground text-xs shadow-lg" variant="destructive">
                                                        {language === 'ar' ? item.offer : (item.offer_en || item.offer)}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground text-sm mt-1">{language === 'ar' ? item.description : (item.description_en || item.description)}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-dashed">
                                            <span className="font-bold text-lg text-primary">{formatCurrency(item.price)}</span>
                                            <Button onClick={() => addToCart(item)} variant="default" size="sm">
                                                <PlusCircle className="ltr:mr-2 rtl:ml-2 h-4 w-4"/> {t('إضافة', 'Add')}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                 ))}
            </main>

            <AnimatePresence>
            {cart.length > 0 && (
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 z-20"
            >
                <Sheet>
                    <SheetTrigger asChild>
                         <div className="bg-card border-t p-4 shadow-lg cursor-pointer">
                            <div className="container mx-auto flex justify-between items-center">
                                <div className="flex items-center gap-4" ref={cartRef}>
                                    <div className="relative">
                                        <ShoppingCart className="text-primary h-8 w-8"/>
                                        <motion.div
                                             key={cart.reduce((acc, item) => acc + item.quantity, 0)}
                                             initial={{ scale: 1.5, opacity: 0 }}
                                             animate={{ scale: 1, opacity: 1 }}
                                             className="absolute -top-2 -right-2 bg-accent text-accent-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold"
                                        >
                                            {cart.reduce((acc, item) => acc + item.quantity, 0)}
                                        </motion.div>
                                    </div>
                                    <div>
                                        <p className="font-bold">{t('سلة الطلبات', 'Order Cart')}</p>
                                        <p className="text-sm font-bold text-primary">{formatCurrency(total)}</p>
                                    </div>
                                </div>
                                <Button>{orderState === 'sending' ? t('جارِ الإرسال...', 'Sending...') : t('عرض الطلب والتأكيد', 'View & Confirm Order')}</Button>
                            </div>
                        </div>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh] flex flex-col" dir={dir}>
                        <SheetHeader className="text-right">
                            <SheetTitle className="font-headline text-2xl">{t('طلبك من الطاولة', 'Your order from Table')} {displayTableNumber}</SheetTitle>
                        </SheetHeader>
                        <div className="flex-1 overflow-y-auto py-4">
                           <AnimatePresence>
                            {cart.map(item => (
                                <motion.div 
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-center justify-between py-4"
                                >
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="font-bold">{language === 'ar' ? item.name : (item.name_en || item.name)}</p>
                                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="h-5 w-5"/></Button>
                                        <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircle className="h-5 w-5"/></Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => updateQuantity(item.id, 0)}><Trash2 className="h-5 w-5"/></Button>
                                    </div>
                                </motion.div>
                            ))}
                           </AnimatePresence>
                        </div>
                        <SheetFooter>
                            <div className="w-full space-y-4">
                                <Separator />
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span>{t('الإجمالي:', 'Total:')}</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                                <Button size="lg" className="w-full font-bold text-lg" onClick={handleSendOrder} disabled={orderState === 'sending'}>
                                    {orderState === 'sending' ? t('جارِ الإرسال...', 'Sending...') : t('تأكيد وإرسال الطلب إلى المطبخ', 'Confirm & Send to Kitchen')}
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
