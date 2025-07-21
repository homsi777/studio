"use client";

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { type MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Trash2, Search, Printer, CreditCard, Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const menuItems: MenuItem[] = [
    { id: 'item-1', name: 'مشويات مشكلة', price: 85000, category: 'main', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "syrian food" },
    { id: 'item-4', name: 'كبة مقلية', price: 25000, category: 'appetizer', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "kibbeh food" },
    { id: 'item-5', name: 'فتوش', price: 20000, category: 'appetizer', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "fattoush salad" },
    { id: 'item-6', name: 'شيش طاووق', price: 60000, category: 'main', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "shish taouk" },
    { id: 'item-7', name: 'بيبسي', price: 8000, category: 'drink', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "pepsi can" },
    { id: 'item-8', name: 'عصير برتقال طازج', price: 18000, category: 'drink', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "orange juice" },
    { id: 'item-9', name: 'كنافة بالجبن', price: 35000, category: 'dessert', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "kunafa cheese" },
];


export default function QuickPOSPage() {
    const [cart, setCart] = useState<MenuItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

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
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ), [searchTerm]);

    const completeOrder = () => {
        console.log("Order completed:", cart);
        // Here you would typically send the order to the backend
        setCart([]); // Clear cart after completion
    }

    return (
        <main className="flex h-[calc(100vh-theme(spacing.14))] bg-muted/20" dir="rtl">
            <div className="flex-1 p-4 flex flex-col">
                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="ابحث عن صنف..." 
                            className="w-full text-lg p-6 pl-12" 
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
                                     <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint={item['data-ai-hint']} />
                                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                                </div>
                                <CardContent className="p-2 text-center">
                                    <p className="font-bold text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">{item.price.toLocaleString()} ل.س</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            <aside className="w-[380px] bg-card border-r flex flex-col shadow-lg">
                 <CardHeader>
                    <CardTitle className="font-headline text-2xl">السلة الحالية</CardTitle>
                </CardHeader>
                 <ScrollArea className="flex-1">
                    <CardContent className="space-y-3">
                        {cart.length === 0 ? (
                             <div className="text-center text-muted-foreground py-16">
                                <p>السلة فارغة</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} ل.س</p>
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
                            <span>الإجمالي</span>
                            <span>{total.toLocaleString()} ل.س</span>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="lg" className="w-full font-bold text-lg">إتمام الدفع</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                <AlertDialogTitle>تأكيد الدفع</AlertDialogTitle>
                                <AlertDialogDescription>
                                    المبلغ الإجمالي هو {total.toLocaleString()} ل.س. الرجاء اختيار طريقة الدفع.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={completeOrder} className="bg-green-600 hover:bg-green-700">
                                        <Coins className="ml-2 h-4 w-4" />
                                        دفع نقدي
                                    </AlertDialogAction>
                                     <AlertDialogAction onClick={completeOrder}>
                                        <CreditCard className="ml-2 h-4 w-4" />
                                        دفع بالبطاقة
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                         <Button variant="outline" size="lg" className="w-full">
                            <Printer className="ml-2 h-4 w-4" />
                            طباعة فاتورة
                        </Button>
                    </div>
                )}
            </aside>
        </main>
    );
}