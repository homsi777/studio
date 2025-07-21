"use client";
import { useState, useMemo, useRef } from 'react';
import { type MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { MinusCircle, PlusCircle, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const menuItems: MenuItem[] = [
    { id: 'item-1', name: 'مشويات مشكلة', price: 85000, description: 'تشكيلة من الكباب والشيش طاووق واللحم بعجين.', category: 'main', quantity: 0 },
    { id: 'item-4', name: 'كبة مقلية', price: 25000, description: '4 قطع من الكبة المحشوة باللحم والجوز.', category: 'appetizer', quantity: 0 },
    { id: 'item-5', name: 'فتوش', price: 20000, description: 'سلطة خضروات طازجة مع خبز محمص ودبس رمان.', category: 'appetizer', quantity: 0 },
    { id: 'item-6', name: 'شيش طاووق', price: 60000, description: 'أسياخ دجاج متبلة ومشوية على الفحم.', category: 'main', quantity: 0 },
    { id: 'item-7', name: 'بيبسي', price: 8000, description: 'مشروب غازي منعش.', category: 'drink', quantity: 0 },
    { id: 'item-8', name: 'عصير برتقال طازج', price: 18000, description: 'عصير برتقال طبيعي معصور عند الطلب.', category: 'drink', quantity: 0 },
];

const USD_TO_SYP_RATE = 15000;

interface FlyingItem {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export default function MenuPage({ params }: { params: { tableId: string } }) {
    const [cart, setCart] = useState<MenuItem[]>([]);
    const [currency, setCurrency] = useState<'SYP' | 'USD'>('SYP');
    const [orderState, setOrderState] = useState<'idle' | 'sending' | 'confirmed'>('idle');
    const [flyingItem, setFlyingItem] = useState<FlyingItem | null>(null);

    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const cartRef = useRef<HTMLDivElement | null>(null);

    const addToCart = (item: MenuItem, e: React.MouseEvent<HTMLButtonElement>) => {
        const itemCard = (e.currentTarget as HTMLElement).closest('.menu-item-card');

        if (itemCard && cartRef.current) {
            const rect = itemCard.getBoundingClientRect();
            setFlyingItem({ id: item.id + Date.now(), x: rect.left, y: rect.top, width: rect.width, height: rect.height });
        }

        setTimeout(() => {
            setCart(prevCart => {
                const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
                if (existingItem) {
                    return prevCart.map(cartItem =>
                        cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
                    );
                }
                return [...prevCart, { ...item, quantity: 1 }];
            });
        }, 100); // Small delay to let the flying animation start
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
        console.log('Sending order:', { tableId: params.tableId, cart, total });
        setTimeout(() => {
            setOrderState('confirmed');
        }, 2000);
    };

    const appetizers = menuItems.filter(item => item.category === 'appetizer');
    const mainCourses = menuItems.filter(item => item.category === 'main');
    const drinks = menuItems.filter(item => item.category === 'drink');
    
    if (orderState === 'confirmed') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center" dir="rtl">
                 <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                    <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
                    <h1 className="font-headline text-3xl font-bold text-foreground mb-2">تم إرسال طلبكم بنجاح!</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        الشيف قد استلم طلبكم وسيبدأ بتحضيره قريباً. شكراً لاختياركم مطعم المائدة ونتمنى لكم وقتاً ممتعاً.
                    </p>
                 </motion.div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen font-body" dir="rtl">
            <AnimatePresence>
                {flyingItem && cartRef.current && (
                    <motion.div
                        className="fixed z-50 rounded-lg bg-card border border-primary/50"
                        initial={{ x: flyingItem.x, y: flyingItem.y, width: flyingItem.width, height: flyingItem.height, opacity: 1 }}
                        animate={{
                            x: cartRef.current.getBoundingClientRect().left + (cartRef.current.getBoundingClientRect().width / 2),
                            y: cartRef.current.getBoundingClientRect().top + (cartRef.current.getBoundingClientRect().height / 2),
                            width: 0,
                            height: 0,
                            opacity: 0,
                        }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        onAnimationComplete={() => setFlyingItem(null)}
                    />
                )}
            </AnimatePresence>
            <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="text-center">
                        <h1 className="font-headline text-2xl font-bold">قائمة طعام المائدة</h1>
                        <p className="text-sm text-muted-foreground">الطاولة رقم {params.tableId}</p>
                    </div>
                     <Button variant="outline" size="sm" onClick={() => setCurrency(c => c === 'SYP' ? 'USD' : 'SYP')}>
                        {currency === 'SYP' ? 'عرض بالـ USD' : 'عرض بالـ SYP'}
                    </Button>
                </div>
            </header>

            <main className="container mx-auto p-4 pb-32">
                 {[{ title: 'المقبلات', items: appetizers }, { title: 'الأطباق الرئيسية', items: mainCourses }, { title: 'المشروبات', items: drinks }].map(section => (
                    <section key={section.title} className="mb-12">
                        <h2 className="font-headline text-3xl font-bold mb-6 text-primary">{section.title}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {section.items.map(item => (
                                <Card key={item.id} ref={el => itemRefs.current[item.id] = el} className="menu-item-card overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl hover:border-primary/50">
                                    <CardHeader>
                                        <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-muted-foreground text-sm">{item.description}</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center mt-auto bg-muted/20 pt-6">
                                        <span className="font-bold text-lg text-primary">{formatCurrency(item.price)}</span>
                                        <Button onClick={(e) => addToCart(item, e)} variant="default">
                                            <PlusCircle className="mr-2 h-4 w-4"/> إضافة للسلة
                                        </Button>
                                    </CardFooter>
                                </Card>
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
                                        <p className="font-bold">سلة الطلبات</p>
                                        <p className="text-sm font-bold text-primary">{formatCurrency(total)}</p>
                                    </div>
                                </div>
                                <Button>{orderState === 'sending' ? 'جارِ الإرسال...' : 'عرض الطلب والتأكيد'}</Button>
                            </div>
                        </div>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh] flex flex-col" dir="rtl">
                        <SheetHeader className="text-right">
                            <SheetTitle className="font-headline text-2xl">طلبك من الطاولة {params.tableId}</SheetTitle>
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
                                    <div>
                                        <p className="font-bold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
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
                                    <span>الإجمالي:</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                                <Button size="lg" className="w-full font-bold text-lg" onClick={handleSendOrder} disabled={orderState === 'sending'}>
                                    {orderState === 'sending' ? 'جارِ الإرسال...' : 'تأكيد وإرسال الطلب إلى المطبخ'}
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
