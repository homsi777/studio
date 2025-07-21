"use client";

import React, { useState, useMemo } from 'react';
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
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, Search } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthGuard } from '@/components/auth-guard';


const mockMenuItems: MenuItem[] = [
    { id: 'item-1', name: 'مشويات مشكلة', name_en: 'Mixed Grill', price: 85000, description: 'تشكيلة من الكباب والشيش طاووق واللحم بعجين.', description_en: 'Assortment of kebab, shish tawook, and meat pies.', category: 'main', quantity: 0, offer: 'خصم 15%', offer_en: '15% Off' },
    { id: 'item-4', name: 'كبة مقلية', name_en: 'Fried Kibbeh', price: 25000, description: '4 قطع من الكبة المحشوة باللحم والجوز.', description_en: '4 pieces of kibbeh stuffed with meat and walnuts.', category: 'appetizer', quantity: 0 },
    { id: 'item-5', name: 'فتوش', name_en: 'Fattoush', price: 20000, description: 'سلطة خضروات طازجة مع خبز محمص ودبس رمان.', description_en: 'Fresh vegetable salad with toasted bread and pomegranate molasses.', category: 'appetizer', quantity: 0 },
    { id: 'item-6', name: 'شيش طاووق', name_en: 'Shish Tawook', price: 60000, description: 'أسياخ دجاج متبلة ومشوية على الفحم.', description_en: 'Marinated and charcoal-grilled chicken skewers.', category: 'main', quantity: 0 },
    { id: 'item-7', name: 'بيبسي', name_en: 'Pepsi', price: 8000, description: 'مشروب غازي منعش.', description_en: 'Refreshing soft drink.', category: 'drink', quantity: 0 },
    { id: 'item-8', name: 'عصير برتقال طازج', name_en: 'Fresh Orange Juice', price: 18000, description: 'عصير برتقال طبيعي معصور عند الطلب.', description_en: 'Natural orange juice, squeezed to order.', category: 'drink', quantity: 0, offer: 'عرض خاص', offer_en: 'Special Offer' },
    { id: 'item-9', name: 'كنافة بالجبن', name_en: 'Cheese Kunafa', price: 35000, description: 'طبقة من الكنافة الناعمة مع جبنة حلوة.', description_en: 'A layer of soft kunafa with sweet cheese.', category: 'dessert', quantity: 0 },
];

const categoryMap: Record<MenuItemCategory, { ar: string, en: string }> = {
    main: { ar: 'طبق رئيسي', en: 'Main Course' },
    appetizer: { ar: 'مقبلات', en: 'Appetizer' },
    drink: { ar: 'مشروب', en: 'Drink' },
    dessert: { ar: 'حلويات', en: 'Dessert' },
};

function MenuManagementPage() {
    const { language } = useLanguage();
    const [items, setItems] = useState<MenuItem[]>(mockMenuItems);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<MenuItemCategory | 'all'>('all');

    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const handleAddNew = () => {
        setEditingItem(null);
        setDialogOpen(true);
    };

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setDialogOpen(true);
    };

    const handleDelete = (itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };
    
    const handleSave = (formData: Omit<MenuItem, 'id' | 'quantity'>) => {
        if (editingItem) {
            setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...formData } : item));
        } else {
            const newItem: MenuItem = {
                id: `item-${Date.now()}`,
                quantity: 0,
                ...formData,
            };
            setItems(prev => [newItem, ...prev]);
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
                            <Input id="offer" value={formData.offer} onChange={handleChange} placeholder="مثال: خصم 20%"/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="offer_en">{t('العرض (بالإنجليزية)', 'Offer (English)')}</Label>
                            <Input id="offer_en" value={formData.offer_en} onChange={handleChange} placeholder="e.g. 20% Off"/>
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
