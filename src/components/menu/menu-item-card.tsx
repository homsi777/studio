
"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { MenuItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, Plus } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface MenuItemCardProps {
    item: MenuItem;
    onAddToCart: (item: MenuItem, itemId: string) => void;
    formatCurrency: (amount: number) => string;
}

export const MenuItemCard = React.forwardRef<HTMLButtonElement, MenuItemCardProps>(
    ({ item, onAddToCart, formatCurrency }, ref) => {
        const { language } = useLanguage();
        const t = (ar: string, en: string) => language === 'ar' ? ar : en;

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col group transition-all duration-300 h-full"
            >
                <div className="relative overflow-hidden bg-card rounded-lg shadow-md hover:shadow-xl hover:border-primary/50 border border-transparent flex flex-col flex-grow">
                    {item.image && (
                        <div className="relative aspect-w-4 aspect-h-3 w-full">
                            <Image
                                src={item.image}
                                alt={t(item.name, item.name_en || '')}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint={item.image_hint || ''}
                            />
                            {item.offer && (
                                <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs shadow-lg" variant="destructive">
                                    <Flame className="w-3 h-3 ltr:mr-1 rtl:ml-1" /> {language === 'ar' ? item.offer : (item.offer_en || item.offer)}
                                </Badge>
                            )}
                        </div>
                    )}
                    <div className="p-2 sm:p-3 flex-grow flex flex-col">
                        <div className="flex-1">
                            <h3 className="font-headline text-sm sm:text-base leading-tight h-10">{t(item.name, item.name_en || item.name)}</h3>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed">
                            <span className="font-bold text-xs sm:text-base text-primary">{formatCurrency(item.price)}</span>
                            <Button
                                ref={ref}
                                onClick={() => onAddToCart(item, item.id)}
                                variant="default"
                                size="sm"
                                className="shadow-lg hover:shadow-primary/50 transition-shadow text-xs h-8 px-2 sm:px-3"
                            >
                                <Plus className="ltr:mr-1 rtl:ml-1 h-3 w-3" /> {t('إضافة', 'Add')}
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }
);

MenuItemCard.displayName = 'MenuItemCard';
