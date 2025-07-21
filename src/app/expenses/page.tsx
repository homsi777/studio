"use client";

import { useState } from 'react';
import { type Expense, type ExpenseCategory } from '@/types';
import { useLanguage } from '@/hooks/use-language';
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const mockExpenses: Expense[] = [
    { id: 'exp-1', description: 'إيجار المحل لشهر يونيو', description_en: 'Shop rent for June', amount: 2500000, date: '2024-06-01', category: 'rent' },
    { id: 'exp-2', description: 'فاتورة الكهرباء', description_en: 'Electricity Bill', amount: 550000, date: '2024-06-05', category: 'bills' },
    { id: 'exp-3', description: 'شراء خضروات ولحوم من المورد', description_en: 'Purchase of vegetables and meat', amount: 1200000, date: '2024-06-07', category: 'supplies' },
    { id: 'exp-4', description: 'فاتورة المياه', description_en: 'Water Bill', amount: 250000, date: '2024-06-10', category: 'bills' },
    { id: 'exp-5', description: 'شراء مشروبات غازية', description_en: 'Purchase of soft drinks', amount: 400000, date: '2024-06-12', category: 'supplies' },
];

const categoryMap: Record<ExpenseCategory, { ar: string, en: string, className: string }> = {
    rent: { ar: 'إيجار', en: 'Rent', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    bills: { ar: 'فواتير', en: 'Bills', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    salaries: { ar: 'رواتب', en: 'Salaries', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    supplies: { ar: 'مشتريات', en: 'Supplies', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    maintenance: { ar: 'صيانة', en: 'Maintenance', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    marketing: { ar: 'تسويق', en: 'Marketing', className: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300' },
    other: { ar: 'أخرى', en: 'Other', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

export default function ExpensesPage() {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
    const [isDialogOpen, setDialogOpen] = useState(false);
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const handleSave = (formData: Omit<Expense, 'id'>) => {
        const newExpense: Expense = {
            id: `exp-${Date.now()}`,
            ...formData,
        };
        setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setDialogOpen(false);
    };

    return (
        <main className="flex-1 p-4 sm:p-6" dir={dir}>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-headline text-3xl font-bold text-foreground">{t('إدارة المصاريف', 'Expense Management')}</h1>
                <Button onClick={() => setDialogOpen(true)} size="lg" className="shadow-md">
                    <PlusCircle className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    {t('تسجيل مصروف جديد', 'Record New Expense')}
                </Button>
            </div>
            
             <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('إجمالي المصاريف', 'Total Expenses')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalExpenses.toLocaleString()} {t('ل.س', 'SYP')}</p>
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle>{t('سجل المصاريف', 'Expense Log')}</CardTitle>
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={t('ابحث في المصاريف...', 'Search expenses...')} className="ltr:pl-10 rtl:pr-10" />
                        </div>
                     </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('الوصف', 'Description')}</TableHead>
                                <TableHead>{t('التصنيف', 'Category')}</TableHead>
                                <TableHead>{t('التاريخ', 'Date')}</TableHead>
                                <TableHead className="text-right">{t('المبلغ', 'Amount')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{language === 'ar' ? expense.description : expense.description_en}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn("rounded-md", categoryMap[expense.category].className)}>{categoryMap[expense.category][language]}</Badge>
                                    </TableCell>
                                    <TableCell>{new Date(expense.date).toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-CA')}</TableCell>
                                    <TableCell className="text-right">{expense.amount.toLocaleString()} {t('ل.س', 'SYP')}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ExpenseFormDialog 
                isOpen={isDialogOpen} 
                onOpenChange={setDialogOpen}
                onSave={handleSave}
            />
        </main>
    );
}

interface ExpenseFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (formData: Omit<Expense, 'id'>) => void;
}

function ExpenseFormDialog({ isOpen, onOpenChange, onSave }: ExpenseFormDialogProps) {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const initialFormData = { description: '', description_en: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'supplies' as ExpenseCategory };
    const [formData, setFormData] = useState<Omit<Expense, 'id'>>(initialFormData);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleCategoryChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value as ExpenseCategory }));
    }

    const handleSubmit = () => {
        onSave(formData);
        // Reset form
        setFormData(initialFormData);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} dir={dir}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{t('تسجيل مصروف جديد', 'Record New Expense')}</DialogTitle>
                    <DialogDescription>
                        {t('أدخل تفاصيل المصروف ليتم أرشفته.', 'Enter the expense details to archive it.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="description">{t('وصف المصروف (عربي)', 'Description (Arabic)')}</Label>
                        <Input id="description" value={formData.description} onChange={handleChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description_en">{t('وصف المصروف (إنجليزي)', 'Description (English)')}</Label>
                        <Input id="description_en" value={formData.description_en} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="amount">{t('المبلغ (ل.س)', 'Amount (SYP)')}</Label>
                            <Input id="amount" type="number" value={formData.amount} onChange={handleChange}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date">{t('التاريخ', 'Date')}</Label>
                            <Input id="date" type="date" value={formData.date} onChange={handleChange}/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="category">{t('التصنيف', 'Category')}</Label>
                        <Select value={formData.category} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('اختر تصنيفاً', 'Select a category')} />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(categoryMap) as Array<keyof typeof categoryMap>).map((cat) => (
                                   <SelectItem key={cat} value={cat}>{t(categoryMap[cat].ar, categoryMap[cat].en)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>{t('إلغاء', 'Cancel')}</Button>
                    <Button onClick={handleSubmit}>{t('حفظ المصروف', 'Save Expense')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
