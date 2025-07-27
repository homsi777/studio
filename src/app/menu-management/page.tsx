
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrderFlow } from '@/hooks/use-order-flow';


const categoryMap: Record<MenuItemCategory, { ar: string, en: string }> = {
    main: { ar: 'طبق رئيسي', en: 'Main Course' },
    appetizer: { ar: 'مقبلات', en: 'Appetizer' },
    drink: { ar: 'مشروب', en: 'Drink' },
    dessert: { ar: 'حلويات', en: 'Dessert' },
};

function MenuManagementPage() {
    const { language, dir } = useLanguage();
    const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, loading: orderFlowLoading, fetchAllData } = useOrderFlow();
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<MenuItemCategory | 'all'>('all');
    const { toast } = useToast();
    const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    useEffect(() => {
        setIsLoading(orderFlowLoading);
    }, [orderFlowLoading]);


    const handleAddNew = () => {
        setEditingItem(null);
        setDialogOpen(true);
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setDialogOpen(true);
    };

    const openDeleteDialog = (item: MenuItem) => {
        setItemToDelete(item);
        setConfirmDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteMenuItem(itemToDelete.id);
            toast({
                title: t("تم الحذف بنجاح", "Item Deleted"),
                description: t(`تم حذف صنف "${itemToDelete.name}".`, `The item "${t(itemToDelete.name, itemToDelete.name_en || '')}" has been deleted.`),
            });
        } catch(error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t("خطأ في الحذف", "Delete Error"),
                description: t("لم نتمكن من حذف الصنف.", "Could not delete the item."),
            });
        } finally {
            setConfirmDeleteOpen(false);
            setItemToDelete(null);
        }
    };
    
    const handleSave = async (formData: Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'quantity'>) => {
        try {
            if (editingItem) {
                await updateMenuItem(editingItem.id, formData);
            } else {
                await addMenuItem(formData);
            }
            
            const successMessage = editingItem 
                ? t("تم التحديث بنجاح", "Item Updated") 
                : t("تمت الإضافة بنجاح", "Item Added");

            toast({ title: successMessage });
            await fetchAllData(true); // Force refetch after save/update

        } catch (error) {
            console.error(error);
            const errorMessage = editingItem 
                ? t("لم نتمكن من تحديث الصنف.", "Could not update the item.")
                : t("لم نتمكن من حفظ الصنف الجديد.", "Could not save the new item.");
            
            toast({
                variant: "destructive",
                title: editingItem ? t("خطأ في التحديث", "Update Error") : t("خطأ في الحفظ", "Save Error"),
                description: errorMessage,
            });
        }
        
        setDialogOpen(false);
    };

    const handleToggleAvailability = async (item: MenuItem, isChecked: boolean) => {
        try {
            await updateMenuItem(item.id, { is_available: isChecked });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: t('خطأ في التحديث', 'Update Error'),
                description: t('لم نتمكن من تحديث حالة الصنف. يرجى إعادة المحاولة.', 'Could not update item status. Please try again.'),
            });
        }
    }
    
    const filteredItems = useMemo(() =>
        menuItems.filter(item =>
            (activeCategory === 'all' || item.category === activeCategory) &&
            ((t(item.name, item.name_en || item.name).toLowerCase().includes(searchTerm.toLowerCase())))
        ).sort((a,b) => (a.is_available === b.is_available) ? 0 : a.is_available ? -1 : 1), [menuItems, searchTerm, activeCategory, t]);


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
                            <Card className={cn(
                                "h-full flex flex-col relative overflow-hidden transition-opacity duration-300",
                                !item.is_available && "opacity-50 bg-muted/30"
                            )}>
                                {item.offer && (
                                    <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs shadow-lg z-10" variant="destructive">
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
                                            <DropdownMenuItem onClick={() => openDeleteDialog(item)} className="text-red-500 focus:text-red-500">
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
                                    <div className="flex items-center gap-2">
                                        <Switch 
                                          id={`available-${item.id}`} 
                                          checked={item.is_available} 
                                          onCheckedChange={(isChecked) => handleToggleAvailability(item, isChecked)}
                                        />
                                        <Label htmlFor={`available-${item.id}`} className="text-xs font-semibold">{t('متوفر', 'Available')}</Label>
                                    </div>
                                    <span className="font-bold text-lg text-primary">{item.price.toLocaleString()} {t('ل.س', 'SYP')}</span>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                </div>
            )}

            <MenuItemFormDialog 
                key={editingItem?.id || 'new'}
                isOpen={isDialogOpen} 
                onOpenChange={setDialogOpen}
                item={editingItem}
                onSave={handleSave}
            />

            <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setConfirmDeleteOpen} dir={dir}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t("تأكيد الحذف", "Confirm Deletion")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(`هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء.`, `Are you sure you want to delete this item? This action cannot be undone.`)}
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t("حذف", "Delete")}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    );
}


interface MenuItemFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    item: MenuItem | null;
    onSave: (formData: Omit<MenuItem, 'id' | 'created_at' | 'updated_at' | 'quantity'>) => void;
}

const menuItemSchema = z.object({
  name: z.string().min(1, { message: "الاسم بالعربية مطلوب." }),
  name_en: z.string().optional().transform(v => v || null),
  description: z.string().optional().transform(v => v || null),
  description_en: z.string().optional().transform(v => v || null),
  price: z.coerce.number().positive({ message: "السعر يجب أن يكون رقماً موجباً." }),
  category: z.enum(['main', 'appetizer', 'drink', 'dessert'], { errorMap: () => ({ message: "الرجاء اختيار تصنيف." }) }),
  offer: z.string().optional().transform(v => v || null),
  offer_en: z.string().optional().transform(v => v || null),
  image: z.string().optional().transform(v => v || null),
  image_hint: z.string().optional().transform(v => v || null),
  is_available: z.boolean().default(true),
});
type MenuItemFormData = z.infer<typeof menuItemSchema>;


function MenuItemFormDialog({ isOpen, onOpenChange, item, onSave }: MenuItemFormDialogProps) {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<MenuItemFormData>({
        resolver: zodResolver(menuItemSchema),
        mode: 'onChange',
        defaultValues: {
            name: '',
            name_en: '',
            description: '',
            description_en: '',
            price: 0,
            category: 'main',
            offer: '',
            offer_en: '',
            image: '',
            image_hint: '',
            is_available: true,
        }
    });

    useEffect(() => {
        if (isOpen) {
            if (item) {
                reset({
                    name: item.name,
                    name_en: item.name_en || '',
                    description: item.description || '',
                    description_en: item.description_en || '',
                    price: item.price,
                    category: item.category as MenuItemCategory,
                    offer: item.offer || '',
                    offer_en: item.offer_en || '',
                    image: item.image || '',
                    image_hint: item.image_hint || '',
                    is_available: item.is_available,
                });
            } else {
                reset({
                    name: '',
                    name_en: '',
                    description: '',
                    description_en: '',
                    price: undefined,
                    category: 'main',
                    offer: '',
                    offer_en: '',
                    image: '',
                    image_hint: '',
                    is_available: true,
                });
            }
        }
    }, [item, isOpen, reset]);

    const onSubmit = (data: MenuItemFormData) => {
        onSave(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]" dir={dir}>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle className="font-headline">{item ? t('تعديل الصنف', 'Edit Item') : t('إضافة صنف جديد', 'Add New Item')}</DialogTitle>
                        <DialogDescription>
                            {t('املأ التفاصيل أدناه لحفظ الصنف في قائمة الطعام.', 'Fill in the details below to save the item to the menu.')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="name">{t('الاسم (بالعربية)', 'Name (Arabic)')}*</Label>
                                <Input id="name" {...register('name')} />
                                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="name_en">{t('الاسم (بالإنجليزية)', 'Name (English)')}</Label>
                                <Input id="name_en" {...register('name_en')} />
                                {errors.name_en && <p className="text-xs text-destructive">{errors.name_en.message}</p>}
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description">{t('الوصف (بالعربية)', 'Description (Arabic)')}</Label>
                            <Textarea id="description" {...register('description')} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="description_en">{t('الوصف (بالإنجليزية)', 'Description (English)')}</Label>
                            <Textarea id="description_en" {...register('description_en')} />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="price">{t('السعر (ل.س)', 'Price (SYP)')}*</Label>
                                <Input id="price" type="number" {...register('price')} step="any" />
                                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="category">{t('التصنيف', 'Category')}*</Label>
                                <Controller
                                    control={control}
                                    name="category"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('اختر تصنيفاً', 'Select a category')} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="appetizer">{t('مقبلات', 'Appetizer')}</SelectItem>
                                                <SelectItem value="main">{t('طبق رئيسي', 'Main Course')}</SelectItem>
                                                <SelectItem value="drink">{t('مشروب', 'Drink')}</SelectItem>
                                                <SelectItem value="dessert">{t('حلويات', 'Desserts')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="offer">{t('العرض (بالعربية)', 'Offer (Arabic)')}</Label>
                                <Input id="offer" {...register('offer')} placeholder="مثال: خصم 20%"/>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="offer_en">{t('العرض (بالإنجليزية)', 'Offer (English)')}</Label>
                                <Input id="offer_en" {...register('offer_en')} placeholder="e.g. 20% Off"/>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>{t('إلغاء', 'Cancel')}</Button>
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting && <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />}
                          {t('حفظ الصنف', 'Save Item')}
                        </Button>
                    </DialogFooter>
                </form>
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

    
