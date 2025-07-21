
"use client";

import React, { useState, useMemo } from 'react';
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
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AuthGuard } from '@/components/auth-guard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

const initialExpenses: Expense[] = [
    { id: 'exp-1', description: 'إيجار المحل لشهر يونيو', description_en: 'Shop rent for June', amount: 2500000, date: '2024-06-01', category: 'rent' },
    { id: 'exp-2', description: 'فاتورة الكهرباء', description_en: 'Electricity Bill', amount: 550000, date: '2024-06-05', category: 'bills' },
    { id: 'exp-3', description: 'شراء خضروات ولحوم من المورد', description_en: 'Purchase of vegetables and meat', amount: 1200000, date: '2024-06-07', category: 'supplies' },
    { id: 'exp-4', description: 'فاتورة المياه', description_en: 'Water Bill', amount: 250000, date: '2024-06-10', category: 'bills' },
    { id: 'exp-5', description: 'شراء مشروبات غازية', description_en: 'Purchase of soft drinks', amount: 400000, date: '2024-06-12', category: 'supplies' },
    { id: 'exp-6', description: 'صيانة نظام التكييف', description_en: 'A/C system maintenance', amount: 300000, date: '2024-06-15', category: 'maintenance' },
    { id: 'exp-7', description: 'رواتب الموظفين', description_en: 'Employee salaries', amount: 5000000, date: '2024-06-25', category: 'salaries' },
];

const categoryMap: Record<ExpenseCategory, { ar: string, en: string, className: string }> = {
    rent: { ar: 'إيجار', en: 'Rent', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    bills: { ar: 'فواتير', en: 'Bills', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
    salaries: { ar: 'رواتب', en: 'Salaries', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
    supplies: { ar: 'مشتريات', en: 'Supplies', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
    maintenance: { ar: 'صيانة', en: 'Maintenance', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' },
    other: { ar: 'أخرى', en: 'Other', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};


function ExpensesPage() {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const totalExpenses = useMemo(() => {
        return expenses.reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses]);
    
    const openAddDialog = () => {
        setEditingExpense(null);
        setDialogOpen(true);
    }
    
    const openEditDialog = (expense: Expense) => {
        setEditingExpense(expense);
        setDialogOpen(true);
    }

    const handleDelete = (id: string) => {
        setExpenses(prev => prev.filter(exp => exp.id !== id));
    }

    const handleSave = (formData: Omit<Expense, 'id'>) => {
        if (editingExpense) {
            // Update existing expense
            setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? { ...editingExpense, ...formData } : exp));
        } else {
            // Add new expense
            const newExpense: Expense = {
                id: `exp-${Date.now()}`,
                ...formData,
            };
            setExpenses(prev => [newExpense, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setDialogOpen(false);
    };
    
    const columns: ColumnDef<Expense>[] = [
        {
            accessorKey: 'description',
            header: t('الوصف', 'Description'),
            cell: ({ row }) => {
                const description = language === 'ar' ? row.original.description : (row.original.description_en || row.original.description)
                return <div className="font-medium">{description}</div>
            },
        },
        {
            accessorKey: 'category',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('التصنيف', 'Category')}
                        <ArrowUpDown className="ltr:ml-2 rtl:mr-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const category = row.original.category;
                return <Badge variant="outline" className={cn("rounded-md", categoryMap[category].className)}>{categoryMap[category][language]}</Badge>
            },
        },
        {
            accessorKey: 'date',
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                    >
                        {t('التاريخ', 'Date')}
                        <ArrowUpDown className="ltr:ml-2 rtl:mr-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => new Date(row.original.date).toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-CA'),
        },
        {
            accessorKey: 'amount',
            header: ({ column }) => {
                 return (
                    <div className="text-right">
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
                        >
                            {t('المبلغ', 'Amount')}
                            <ArrowUpDown className="ltr:ml-2 rtl:mr-2 h-4 w-4" />
                        </Button>
                    </div>
                )
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue('amount'));
                return <div className="text-right font-mono">{amount.toLocaleString()} {t('ل.س', 'SYP')}</div>
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => {
                const expense = row.original;
                return (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">{t('فتح القائمة', 'Open menu')}</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={language === 'ar' ? 'start' : 'end'}>
                            <DropdownMenuItem onClick={() => openEditDialog(expense)}>
                                <FilePenLine className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                {t('تعديل', 'Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(expense.id)} className="text-red-500 focus:text-red-500">
                                <Trash2 className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                {t('حذف', 'Delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ];

    const table = useReactTable({
        data: expenses,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });
    
    const filteredTotal = useMemo(() => 
        table.getRowModel().rows.reduce((total, row) => total + row.original.amount, 0)
    , [table.getRowModel().rows]);

    return (
        <main className="flex-1 p-4 sm:p-6" dir={dir}>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-headline text-3xl font-bold text-foreground">{t('إدارة المصاريف', 'Expense Management')}</h1>
                <Button onClick={openAddDialog} size="lg" className="shadow-md">
                    <PlusCircle className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    {t('تسجيل مصروف جديد', 'Record New Expense')}
                </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('إجمالي المصاريف (الكلي)', 'Total Expenses (Overall)')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{totalExpenses.toLocaleString()} {t('ل.س', 'SYP')}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('إجمالي المصاريف (المعروضة)', 'Total Expenses (Filtered)')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{filteredTotal.toLocaleString()} {t('ل.س', 'SYP')}</p>
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle>{t('سجل المصاريف', 'Expense Log')}</CardTitle>
                        <div className="flex items-center gap-2">
                             <Input
                                placeholder={t('ابحث في الوصف...', 'Search descriptions...')}
                                value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
                                onChange={(event) =>
                                    table.getColumn('description')?.setFilterValue(event.target.value)
                                }
                                className="max-w-sm"
                            />
                            <Select 
                                value={(table.getColumn('category')?.getFilterValue() as string) ?? 'all'}
                                onValueChange={(value) =>
                                    table.getColumn('category')?.setFilterValue(value === 'all' ? undefined : value)
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder={t('فلترة حسب الفئة', 'Filter by category')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">{t('كل الفئات', 'All Categories')}</SelectItem>
                                    {(Object.keys(categoryMap) as Array<keyof typeof categoryMap>).map((cat) => (
                                        <SelectItem key={cat} value={cat}>{t(categoryMap[cat].ar, categoryMap[cat].en)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                     </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => {
                                            return (
                                                <TableHead key={header.id}>
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}
                                                </TableHead>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            {t('لا توجد نتائج.', 'No results.')}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            {t('السابق', 'Previous')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            {t('التالي', 'Next')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <ExpenseFormDialog 
                key={editingExpense?.id || 'new'}
                isOpen={isDialogOpen} 
                onOpenChange={setDialogOpen}
                onSave={handleSave}
                expense={editingExpense}
            />
        </main>
    );
}

interface ExpenseFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (formData: Omit<Expense, 'id'>) => void;
    expense: Expense | null;
}

function ExpenseFormDialog({ isOpen, onOpenChange, onSave, expense }: ExpenseFormDialogProps) {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    
    const getInitialFormData = (): Omit<Expense, 'id'> => {
        if (expense) {
            return {
                description: expense.description,
                description_en: expense.description_en || '',
                amount: expense.amount,
                date: expense.date,
                category: expense.category,
            };
        }
        return { 
            description: '', 
            description_en: '', 
            amount: 0, 
            date: new Date().toISOString().split('T')[0], 
            category: 'supplies' as ExpenseCategory 
        };
    }

    const [formData, setFormData] = useState<Omit<Expense, 'id'>>(getInitialFormData);
    
    React.useEffect(() => {
        setFormData(getInitialFormData());
    }, [expense, isOpen]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleCategoryChange = (value: string) => {
        setFormData(prev => ({ ...prev, category: value as ExpenseCategory }));
    }

    const handleSubmit = () => {
        onSave(formData);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} dir={dir}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-headline">{expense ? t('تعديل المصروف', 'Edit Expense') : t('تسجيل مصروف جديد', 'Record New Expense')}</DialogTitle>
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
                    <Button onClick={handleSubmit}>{t('حفظ', 'Save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function GuardedExpensesPage() {
    return (
        <AuthGuard>
            <ExpensesPage />
        </AuthGuard>
    )
}
