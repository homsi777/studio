
"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface MenuItemCardProps {
    item: MenuItem;
    onAddToCart: (item: MenuItem) => void;
    formatCurrency: (amount: number) => string;
}

export const MenuItemCard = React.forwardRef<HTMLButtonElement, MenuItemCardProps>(
    ({ item, onAddToCart, formatCurrency }, ref) => {
        const { language } = useLanguage();
        const t = (ar: string, en: string) => language === 'ar' ? ar : en;
        const [isDialogOpen, setDialogOpen] = React.useState(false);
        
        const handleCardClick = () => {
          setDialogOpen(true);
        }

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
                <div 
                    onClick={handleCardClick} 
                    className="honeycomb-cell group bg-card hover:bg-card/90 cursor-pointer flex flex-col items-center justify-center p-2 text-center select-none"
                >
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <h3 className="font-headline text-sm sm:text-base font-bold leading-tight drop-shadow-md text-foreground">
                            {t(item.name, item.name_en || item.name)}
                        </h3>
                        <p className="text-xs sm:text-sm font-semibold text-primary drop-shadow-md mt-1">
                            {formatCurrency(item.price)}
                        </p>
                    </div>
                     <motion.div
                        whileTap={{ scale: 0.9 }}
                        className="mt-auto"
                     >
                        <Button 
                            onClick={handleAddToCartClick} 
                            size="sm"
                            className="bg-purple-200/50 text-purple-800 hover:bg-purple-200/80 dark:bg-purple-900/50 dark:text-purple-200 dark:hover:bg-purple-900/80 h-7 text-xs rounded-full px-3"
                        >
                            <Plus className="h-4 w-4 rtl:ml-1 ltr:mr-1" />
                            {t('إضافة', 'Add')}
                        </Button>
                    </motion.div>
                </div>
                
                 <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="sm:max-w-[425px]" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                        <DialogHeader>
                            {item.image && (
                                <div className="relative w-full h-48 rounded-md overflow-hidden mb-4">
                                     <Image
                                        src={item.image}
                                        alt={t(item.name, item.name_en || '')}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={item.image_hint || ''}
                                    />
                                </div>
                            )}
                            <DialogTitle className="font-headline text-2xl">{t(item.name, item.name_en || item.name)}</DialogTitle>
                            <DialogDescription>{t(item.description || '', item.description_en || item.description || '')}</DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-between items-center py-4">
                            <span className="text-2xl font-bold text-primary">{formatCurrency(item.price)}</span>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>{t('إغلاق', 'Close')}</Button>
                             <Button type="button" onClick={handleDialogAddToCartClick} size="lg">
                                <Plus className="ltr:mr-2 rtl:ml-2 h-5 w-5"/>
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
