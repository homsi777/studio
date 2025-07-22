
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { type MenuItem, type MenuItemCategory } from '@/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthGuard } from '@/components/auth-guard';
import { useToast } from '@/hooks/use-toast';


const categoryMap: Record<MenuItemCategory, { ar: string, en: string }> = {
    main: { ar: 'طبق رئيسي', en: 'Main Course' },
    appetizer: { ar: 'مقبلات', en: 'Appetizer' },
    drink: { ar: 'مشروب', en: 'Drink' },
    dessert: { ar: 'حلويات', en: 'Dessert' },
};

function MenuManagementPage() {
    const { language } = useLanguage();
    const [items, setItems] = useState<MenuItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<MenuItemCategory | 'all'>('all');
    const { toast } = useToast();

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                setIsLoading(true);
                const response = await fetch('/api/v1/menu-items');
                if (!response.ok) {
                    throw new Error('Failed to fetch menu items');
                }
                const data: MenuItem[] = await response.json();
                setItems(data);
            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: t("خطأ في جلب البيانات", "Fetch Error"),
                    description: t("لم نتمكن من جلب قائمة الطعام من الخادم.", "Could not fetch the menu from the server."),
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchMenuItems();
    }, [toast, t]);

    const handleAddNew = () => {
        setEditingItem(null);
        setDialogOpen(true);
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setDialogOpen(true);
    };

    const handleDelete = (itemId: string) => {
        // TODO: Implement DELETE request
        console.log("Deleting item:", itemId);
        setItems(prev => prev.filter(item => item.id !== itemId));
    };
    
    const handleSave = async (formData: Omit<MenuItem, 'id' | 'quantity'>) => {
        if (editingItem) {
            // TODO: Implement PUT request
            console.log("Updating item:", editingItem.id, formData);
            setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...formData } : item));
        } else {
            // Add new item via API
            try {
                 const response = await fetch('/api/v1/menu-items', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    throw new Error('Failed to save item');
                }
                const newItem = await response.json();
                setItems(prev => [newItem, ...prev]);
                toast({
                    title: t("تمت الإضافة بنجاح", "Item Added"),
                    description: t(`تمت إضافة صنف "${formData.name}" إلى القائمة.`, `"${formData.name}" has been added to the menu.`),
                });
            } catch(error) {
                 console.error(error);
                 toast({
                    variant: "destructive",
                    title: t("خطأ في الحفظ", "Save Error"),
                    description: t("لم نتمكن من حفظ الصنف الجديد.", "Could not save the new item."),
                });
            }
        }
        setDialogOpen(false);
    };
    
    const filteredItems = useMemo(() =>
        items.filter(item =>
            (activeCategory === 'all' || item.category === activeCategory) &&
            ((t(item.name, item.name_en || item.name).toLowerCase().includes(searchTerm.toLowerCase())))
        ), [items, searchTerm, activeCategory, language, t]);


    return (
        <main className="flex-1 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h1 className="font-headline text-3xl font-bold text-foreground">{t('إدارة القائمة', 'Menu Management')}</h1>
                 <div className="flex items-center gap-2 flex-wrap">
                     <div className="relative w-full max-w-sm">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={t('ابحث عن صنف...', 'Search for an item...')} 
                            className="ltr:pl-10 rtl:pr-10" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                     <Select value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={t('التصنيف', 'Category')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('كل التصنيفات', 'All Categories')}</SelectItem>
                            <SelectItem value="main">{t('أطباق رئيسية', 'Main Courses')}</SelectItem>
                            <SelectItem value="appetizer">{t('مقبلات', 'Appetizers')}</SelectItem>
                            <SelectItem value="drink">{t('مشروبات', 'Drinks')}</SelectItem>
                            <SelectItem value="dessert">{t('حلويات', 'Desserts')}</SelectItem>
                        </SelectContent>
                    </Select>
                     <Button onClick={handleAddNew}>
                        <PlusCircle className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                        {t('إضافة صنف جديد', 'Add New Item')}
                    </Button>
                </div>
            </div>
            
             {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                    {filteredItems.map(item => (
                        <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            <Card className="h-full flex flex-col relative overflow-hidden">
                                {item.offer && (
                                    <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs shadow-lg" variant="destructive">
                                        {language === 'ar' ? item.offer : (item.offer_en || item.offer)}
                                    </Badge>
                                )}
                                <CardHeader className="flex-row items-start justify-between">
                                    <CardTitle className="font-headline text-xl flex-1">{language === 'ar' ? item.name : (item.name_en || item.name)}</CardTitle>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
                                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                <FilePenLine className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                                {t('تعديل', 'Edit')}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-500 hover:!text-red-500">
                                                <Trash2 className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                                {t('حذف', 'Delete')}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{language === 'ar' ? item.description : (item.description_en || item.description)}</p>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center bg-muted/20 pt-4">
                                    <Badge variant="outline">{categoryMap[item.category][language]}</Badge>
                                    <span className="font-bold text-lg text-primary">{item.price.toLocaleString()} {t('ل.س', 'SYP')}</span>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            )}

            <MenuItemFormDialog 
                isOpen={isDialogOpen} 
                onOpenChange={setDialogOpen}
                item={editingItem}
                onSave={handleSave}
            />
        </main>
    );
}


interface MenuItemFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: MenuItem | null;
    onSave: (formData: Omit<MenuItem, 'id' | 'quantity'>) => void;
}

function MenuItemFormDialog({ isOpen, onOpenChange, item, onSave }: MenuItemFormDialogProps) {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [formData, setFormData] = useState<Omit<MenuItem, 'id' | 'quantity'>>({
        name: '', name_en: '', description: '', description_en: '', price: 0, category: 'main', offer: '', offer_en: ''
    });

    React.useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                name_en: item.name_en || '',
                description: item.description || '',
                description_en: item.description_en || '',
                price: item.price,
                category: item.category,
                offer: item.offer || '',
                offer_en: item.offer_en || '',
            });
        } else {
            setFormData({
                 name: '', name_en: '', description: '', description_en: '', price: 0, category: 'main', offer: '', offer_en: ''
            });
        }
    }, [item, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: parseFloat(value) || 0 }));
    }

    const handleCategoryChange = (value: MenuItemCategory) => {
        setFormData(prev => ({ ...prev, category: value }));
    }

    const handleSubmit = () => {
        onSave(formData);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="font-headline">{item ? t('تعديل الصنف', 'Edit Item') : t('إضافة صنف جديد', 'Add New Item')}</DialogTitle>
                    <DialogDescription>
                        {t('املأ التفاصيل أدناه لحفظ الصنف في قائمة الطعام.', 'Fill in the details below to save the item to the menu.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">{t('الاسم (بالعربية)', 'Name (Arabic)')}</Label>
                            <Input id="name" value={formData.name} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="name_en">{t('الاسم (بالإنجليزية)', 'Name (English)')}</Label>
                            <Input id="name_en" value={formData.name_en} onChange={handleChange} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">{t('الوصف (بالعربية)', 'Description (Arabic)')}</Label>
                        <Textarea id="description" value={formData.description} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description_en">{t('الوصف (بالإنجليزية)', 'Description (English)')}</Label>
                        <Textarea id="description_en" value={formData.description_en} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="price">{t('السعر (ل.س)', 'Price (SYP)')}</Label>
                            <Input id="price" type="number" value={formData.price} onChange={handlePriceChange}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="category">{t('التصنيف', 'Category')}</Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('اختر تصنيفاً', 'Select a category')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="appetizer">{t('مقبلات', 'Appetizer')}</SelectItem>
                                    <SelectItem value="main">{t('طبق رئيسي', 'Main Course')}</SelectItem>
                                    <SelectItem value="drink">{t('مشروب', 'Drink')}</SelectItem>
                                    <SelectItem value="dessert">{t('حلويات', 'Dessert')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="offer">{t('العرض (بالعربية)', 'Offer (Arabic)')}</Label>
                            <Input id="offer" value={formData.offer || ''} onChange={handleChange} placeholder="مثال: خصم 20%"/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="offer_en">{t('العرض (بالإنجليزية)', 'Offer (English)')}</Label>
                            <Input id="offer_en" value={formData.offer_en || ''} onChange={handleChange} placeholder="e.g. 20% Off"/>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>{t('إلغاء', 'Cancel')}</Button>
                    <Button onClick={handleSubmit}>{t('حفظ الصنف', 'Save Item')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function GuardedMenuManagementPage() {
    return (
        <AuthGuard>
            <MenuManagementPage />
        </AuthGuard>
    )
}
