"use client";

import { useState } from 'react';
import Image from 'next/image';
import { type MenuItem, type MenuItemCategory } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Separator } from '@/components/ui/separator';

const mockMenuItems: MenuItem[] = [
    { id: 'item-1', name: 'مشويات مشكلة', price: 85000, description: 'تشكيلة من الكباب والشيش طاووق واللحم بعجين.', category: 'main', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "syrian food" },
    { id: 'item-4', name: 'كبة مقلية', price: 25000, description: '4 قطع من الكبة المحشوة باللحم والجوز.', category: 'appetizer', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "kibbeh food" },
    { id: 'item-5', name: 'فتوش', price: 20000, description: 'سلطة خضروات طازجة مع خبز محمص ودبس رمان.', category: 'appetizer', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "fattoush salad" },
    { id: 'item-6', name: 'شيش طاووق', price: 60000, description: 'أسياخ دجاج متبلة ومشوية على الفحم.', category: 'main', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "shish taouk" },
    { id: 'item-7', name: 'بيبسي', price: 8000, description: 'مشروب غازي منعش.', category: 'drink', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "pepsi can" },
    { id: 'item-8', name: 'عصير برتقال طازج', price: 18000, description: 'عصير برتقال طبيعي معصور عند الطلب.', category: 'drink', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "orange juice" },
    { id: 'item-9', name: 'كنافة بالجبن', price: 35000, description: 'طبقة من الكنافة الناعمة مع جبنة حلوة.', category: 'dessert', image: 'https://placehold.co/600x400', quantity: 0, "data-ai-hint": "kunafa cheese" },
];

const categoryMap: Record<MenuItemCategory, string> = {
    main: 'طبق رئيسي',
    appetizer: 'مقبلات',
    drink: 'مشروب',
    dessert: 'حلويات',
};

export default function MenuManagementPage() {
    const [items, setItems] = useState<MenuItem[]>(mockMenuItems);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

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

    return (
        <main className="flex-1 p-4 sm:p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-headline text-3xl font-bold text-foreground">إدارة القائمة</h1>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    إضافة صنف جديد
                </Button>
            </div>
            
            <div className="mb-4 flex items-center gap-4">
                <div className="relative flex-1">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="ابحث عن صنف..." className="pl-10" />
                </div>
                 <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">كل التصنيفات</SelectItem>
                        <SelectItem value="main">أطباق رئيسية</SelectItem>
                        <SelectItem value="appetizer">مقبلات</SelectItem>
                        <SelectItem value="drink">مشروبات</SelectItem>
                        <SelectItem value="dessert">حلويات</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">صورة</TableHead>
                            <TableHead>الاسم</TableHead>
                            <TableHead>التصنيف</TableHead>
                            <TableHead>السعر</TableHead>
                            <TableHead className="w-[50px]">أدوات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Image src={item.image} alt={item.name} width={64} height={64} className="rounded-md object-cover" data-ai-hint={item['data-ai-hint']} />
                                </TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{categoryMap[item.category]}</Badge>
                                </TableCell>
                                <TableCell>{item.price.toLocaleString()} ل.س</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                <FilePenLine className="ml-2 h-4 w-4" />
                                                تعديل
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-500">
                                                <Trash2 className="ml-2 h-4 w-4" />
                                                حذف
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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
    const [formData, setFormData] = useState<Omit<MenuItem, 'id' | 'quantity'>>({
        name: '', name_en: '', description: '', description_en: '', price: 0, category: 'main', image: 'https://placehold.co/600x400'
    });

    React.useEffect(() => {
        if (item) {
            setFormData({
                name: item.name,
                name_en: item.name_en,
                description: item.description,
                description_en: item.description_en,
                price: item.price,
                category: item.category,
                image: item.image,
            });
        } else {
            setFormData({
                 name: '', name_en: '', description: '', description_en: '', price: 0, category: 'main', image: 'https://placehold.co/600x400'
            });
        }
    }, [item, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleCategoryChange = (value: MenuItemCategory) => {
        setFormData(prev => ({ ...prev, category: value }));
    }

    const handleSubmit = () => {
        onSave(formData);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="font-headline">{item ? 'تعديل الصنف' : 'إضافة صنف جديد'}</DialogTitle>
                    <DialogDescription>
                        املأ التفاصيل أدناه لحفظ الصنف في قائمة الطعام.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="name">الاسم (بالعربية)</Label>
                            <Input id="name" value={formData.name} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="name_en">الاسم (بالإنجليزية)</Label>
                            <Input id="name_en" value={formData.name_en} onChange={handleChange} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">الوصف (بالعربية)</Label>
                        <Textarea id="description" value={formData.description} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description_en">الوصف (بالإنجليزية)</Label>
                        <Textarea id="description_en" value={formData.description_en} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="price">السعر (ل.س)</Label>
                            <Input id="price" type="number" value={formData.price} onChange={handleChange}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="category">التصنيف</Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر تصنيفاً" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="appetizer">مقبلات</SelectItem>
                                    <SelectItem value="main">طبق رئيسي</SelectItem>
                                    <SelectItem value="drink">مشروب</SelectItem>
                                    <SelectItem value="dessert">حلويات</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="image">رابط الصورة</Label>
                        <Input id="image" value={formData.image} onChange={handleChange} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>إلغاء</Button>
                    <Button onClick={handleSubmit}>حفظ الصنف</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}