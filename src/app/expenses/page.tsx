"use client";

import { useState } from 'react';
import { type Expense, type ExpenseCategory } from '@/types';
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
    { id: 'exp-1', description: 'إيجار المحل لشهر يونيو', amount: 2500000, date: '2024-06-01', category: 'rent' },
    { id: 'exp-2', description: 'فاتورة الكهرباء', amount: 550000, date: '2024-06-05', category: 'bills' },
    { id: 'exp-3', description: 'شراء خضروات ولحوم من المورد', amount: 1200000, date: '2024-06-07', category: 'supplies' },
    { id: 'exp-4', description: 'فاتورة المياه', amount: 250000, date: '2024-06-10', category: 'bills' },
    { id: 'exp-5', description: 'شراء مشروبات غازية', amount: 400000, date: '2024-06-12', category: 'supplies' },
];

const categoryMap: Record<ExpenseCategory, string> = {
    rent: 'إيجار',
    bills: 'فواتير',
    salaries: 'رواتب',
    supplies: 'مشتريات',
};

export default function ExpensesPage() {
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
        <main className="flex-1 p-4 sm:p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-headline text-3xl font-bold text-foreground">إدارة المصاريف</h1>
                <Button onClick={() => setDialogOpen(true)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    تسجيل مصروف جديد
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     <Card>
                         <CardHeader>
                             <div className="flex items-center justify-between">
                                <CardTitle>سجل المصاريف</CardTitle>
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="ابحث في المصاريف..." className="pl-10" />
                                </div>
                             </div>
                         </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>الوصف</TableHead>
                                        <TableHead>التصنيف</TableHead>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>المبلغ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map(expense => (
                                        <TableRow key={expense.id}>
                                            <TableCell className="font-medium">{expense.description}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{categoryMap[expense.category]}</Badge>
                                            </TableCell>
                                            <TableCell>{expense.date}</TableCell>
                                            <TableCell>{expense.amount.toLocaleString()} ل.س</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                <div>
                     <Card>
                        <CardHeader>
                            <CardTitle>ملخص المصاريف</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-lg p-4 bg-muted/50 rounded-lg">
                                <span>إجمالي المصاريف</span>
                                <span className="font-bold">{totalExpenses.toLocaleString()} ل.س</span>
                            </div>
                            {/* Can add charts or more details here */}
                        </CardContent>
                    </Card>
                </div>
            </div>

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
    const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
        description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'supplies'
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
        setFormData({ description: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'supplies' });
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="font-headline">تسجيل مصروف جديد</DialogTitle>
                    <DialogDescription>
                        أدخل تفاصيل المصروف ليتم أرشفته.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="space-y-2">
                        <Label htmlFor="description">وصف المصروف</Label>
                        <Input id="description" value={formData.description} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="amount">المبلغ (ل.س)</Label>
                            <Input id="amount" type="number" value={formData.amount} onChange={handleChange}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date">التاريخ</Label>
                            <Input id="date" type="date" value={formData.date} onChange={handleChange}/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="category">التصنيف</Label>
                        <Select value={formData.category} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر تصنيفاً" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rent">إيجار</SelectItem>
                                <SelectItem value="bills">فواتير</SelectItem>
                                <SelectItem value="salaries">رواتب</SelectItem>
                                <SelectItem value="supplies">مشتريات</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>إلغاء</Button>
                    <Button onClick={handleSubmit}>حفظ المصروف</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
