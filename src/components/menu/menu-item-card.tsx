
"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface MenuItemCardProps {
    item: MenuItem;
    onAddToCart: (item: MenuItem) => void;
    formatCurrency: (amount: number) => string;
}

export const MenuItemCard = React.forwardRef<HTMLDivElement, MenuItemCardProps>(
    ({ item, onAddToCart, formatCurrency }, ref) => {
        const { language } = useLanguage();
        const t = (ar: string, en: string) => language === 'ar' ? ar : en;
        const [isDialogOpen, setDialogOpen] = React.useState(false);

        const handleCardClick = () => {
            setDialogOpen(true);
        };

        const handleAddToCartClick = (e: React.MouseEvent) => {
            e.stopPropagation(); // Prevent dialog from opening when add button is clicked
            onAddToCart(item);
        };

        const handleDialogAddToCartClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            onAddToCart(item);
            setDialogOpen(false);
        };

        return (
            <>
                <motion.div
                    ref={ref}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="relative group overflow-hidden rounded-lg bg-card shadow-lg shadow-purple-500/10 dark:shadow-purple-800/20 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1"
                    onClick={handleCardClick}
                >
                    {item.offer && (
                        <Badge variant="destructive" className="absolute top-2 right-2 z-10 bg-accent text-accent-foreground text-xs shadow-lg">
                            {t(item.offer, item.offer_en || item.offer)}
                        </Badge>
                    )}
                    {item.image && (
                         <div className="overflow-hidden">
                             <Image
                                src={item.image}
                                alt={t(item.name, item.name_en || '')}
                                width={300}
                                height={200}
                                className="object-cover w-full h-40 transition-transform duration-300 group-hover:scale-110"
                                data-ai-hint={item.image_hint || ''}
                            />
                         </div>
                    )}
                    <div className="p-4">
                        <h3 className="font-headline text-lg font-bold leading-tight truncate text-foreground">
                            {t(item.name, item.name_en || item.name)}
                        </h3>
                         <p className="text-sm text-muted-foreground h-10 mt-1">
                            {t(item.description || '', item.description_en || '')}
                        </p>
                        <div className="flex justify-between items-center mt-4">
                            <p className="text-lg font-semibold text-primary">
                                {formatCurrency(item.price)}
                            </p>
                            <Button
                                onClick={handleAddToCartClick}
                                size="sm"
                                variant="secondary"
                                className="bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-200 dark:hover:bg-purple-900 h-9 px-4 rounded-full"
                            >
                                <Plus className="h-4 w-4 rtl:ml-2 ltr:mr-2" />
                                {t('إضافة', 'Add')}
                            </Button>
                        </div>
                    </div>
                </motion.div>

                <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-md" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <DialogHeader>
                            <DialogTitle className="font-headline text-2xl">{t(item.name, item.name_en || item.name)}</DialogTitle>
                             <DialogDescription>{t(item.description || '', item.description_en || item.description || '')}</DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <p className="text-muted-foreground">{t(item.description || "لا يوجد وصف متاح.", item.description_en || "No description available.")}</p>
                        </div>
                        <div className="flex justify-between items-center py-4 border-t">
                            <span className="text-2xl font-bold text-primary">{formatCurrency(item.price)}</span>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>{t('إغلاق', 'Close')}</Button>
                            <Button type="button" onClick={handleDialogAddToCartClick} size="lg">
                                <Plus className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
                                {t('إضافة للسلة', 'Add to Cart')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
);

MenuItemCard.displayName = 'MenuItemCard';
