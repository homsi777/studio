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

const mockExpenses: Expense[] = [
    { id: 'exp-1', description: 'إيجار المحل لشهر يونيو', description_en: 'Shop rent for June', amount: 2500000, date: '2024-06-01', category: 'rent' },
    { id: 'exp-2', description: 'فاتورة الكهرباء', description_en: 'Electricity Bill', amount: 550000, date: '2024-06-05', category: 'bills' },
    { id: 'exp-3', description: 'شراء خضروات ولحوم من المورد', description_en: 'Purchase of vegetables and meat', amount: 1200000, date: '2024-06-07', category: 'supplies' },
    { id: 'exp-4', description: 'فاتورة المياه', description_en: 'Water Bill', amount: 250000, date: '2024-06-10', category: 'bills' },
    { id: 'exp-5', description: 'شراء مشروبات غازية', description_en: 'Purchase of soft drinks', amount: 400000, date: '2024-06-12', category: 'supplies' },
];

const categoryMap: Record<ExpenseCategory, { ar: string, en: string }> = {
    rent: { ar: 'إيجار', en: 'Rent' },
    bills: { ar: 'فواتير', en: 'Bills' },
    salaries: { ar: 'رواتب', en: 'Salaries' },
    supplies: { ar: 'مشتريات', en: 'Supplies' },
};

export default function ExpensesPage() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
    const [isDialogOpen, setDialogOpen] = useState(false);
    
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    const handleSave = (formData: Omit<Expense, 'id'>) => {
        const newExpense: Expense = {
            id: `exp-${Date.now()}`,
            ...formData,
        };
        setExpenses(prev => [newExpense, ...prev]);
        setDialogOpen(false);
    };

    return (
        <main className="flex-1 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-headline text-3xl font-bold text-foreground">{t('إدارة المصاريف', 'Expense Management')}</h1>
                <Button onClick={() => setDialogOpen(true)}>
                    <PlusCircle className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    {t('تسجيل مصروف جديد', 'Record New Expense')}
                </Button>
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
                                <TableHead>{t('المبلغ', 'Amount')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map(expense => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{language === 'ar' ? expense.description : expense.description_en}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{categoryMap[expense.category][language]}</Badge>
                                    </TableCell>
                                    <TableCell>{expense.date}</TableCell>
                                    <TableCell>{expense.amount.toLocaleString()} {t('ل.س', 'SYP')}</TableCell>
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
    const { language } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
        description: '', description_en: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'supplies'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleCategoryChange = (value: ExpenseCategory) => {
        setFormData(prev => ({ ...prev, category: value }));
    }

    const handleSubmit = () => {
        onSave(formData);
        // Reset form
        setFormData({ description: '', description_en: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'supplies' });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
                                <SelectItem value="rent">{t('إيجار', 'Rent')}</SelectItem>
                                <SelectItem value="bills">{t('فواتير', 'Bills')}</SelectItem>
                                <SelectItem value="salaries">{t('رواتب', 'Salaries')}</SelectItem>
                                <SelectItem value="supplies">{t('مشتريات', 'Supplies')}</SelectItem>
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
