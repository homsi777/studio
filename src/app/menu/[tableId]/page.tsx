"use client";
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { type MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { MinusCircle, PlusCircle, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const menuItems: MenuItem[] = [
    { id: 'item-1', name: 'مشويات مشكلة', price: 85000, description: 'تشكيلة من الكباب والشيش طاووق واللحم بعجين.', category: 'main', image: 'https://placehold.co/600x400', quantity: 0 },
    { id: 'item-4', name: 'كبة مقلية', price: 25000, description: '4 قطع من الكبة المحشوة باللحم والجوز.', category: 'appetizer', image: 'https://placehold.co/600x400', quantity: 0 },
    { id: 'item-5', name: 'فتوش', price: 20000, description: 'سلطة خضروات طازجة مع خبز محمص ودبس رمان.', category: 'appetizer', image: 'https://placehold.co/600x400', quantity: 0 },
    { id: 'item-6', name: 'شيش طاووق', price: 60000, description: 'أسياخ دجاج متبلة ومشوية على الفحم.', category: 'main', image: 'https://placehold.co/600x400', quantity: 0 },
    { id: 'item-7', name: 'بيبسي', price: 8000, description: 'مشروب غازي منعش.', category: 'drink', image: 'https://placehold.co/600x400', quantity: 0 },
    { id: 'item-8', name: 'عصير برتقال طازج', price: 18000, description: 'عصير برتقال طبيعي معصور عند الطلب.', category: 'drink', image: 'https://placehold.co/600x400', quantity: 0 },
];

const USD_TO_SYP_RATE = 15000;

export default function MenuPage({ params }: { params: { tableId: string } }) {
    const [cart, setCart] = useState<MenuItem[]>([]);
    const [currency, setCurrency] = useState<'SYP' | 'USD'>('SYP');
    const [orderState, setOrderState] = useState<'idle' | 'sending' | 'confirmed'>('idle');

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
        // Simulate API call
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
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
                                <Card key={item.id} className="overflow-hidden flex flex-col group">
                                    <div className="relative h-48 w-full">
                                        <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" data-ai-hint="syrian food" className="transition-transform duration-300 group-hover:scale-105"/>
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="font-headline text-xl">{item.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <p className="text-muted-foreground text-sm">{item.description}</p>
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center mt-auto">
                                        <span className="font-bold text-lg text-primary">{formatCurrency(item.price)}</span>
                                        <Button onClick={() => addToCart(item)}>
                                            <PlusCircle className="mr-2 h-4 w-4"/> إضافة
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
                                <div className="flex items-center gap-4">
                                    <ShoppingCart className="text-primary"/>
                                    <div>
                                        <p className="font-bold">سلة الطلبات ({cart.reduce((acc, item) => acc + item.quantity, 0)} صنف)</p>
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
                                    <div className="flex items-center gap-4">
                                        <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md object-cover" data-ai-hint="restaurant dish" />
                                        <div>
                                            <p className="font-bold">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}><PlusCircle className="h-5 w-5"/></Button>
                                        <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                                        <Button variant="ghost" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}><MinusCircle className="h-5 w-5"/></Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => updateQuantity(item.id, 0)}><Trash2 className="h-5 w-5"/></Button>
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
