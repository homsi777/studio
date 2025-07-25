
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Expense, ExpenseCategory } from '@/types';
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
import { PlusCircle, MoreHorizontal, FilePenLine, Trash2, ArrowUpDown, Loader2, Calendar as CalendarIcon, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AuthGuard } from '@/components/auth-guard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import type { ColumnDef, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Textarea } from '@/components/ui/textarea';


const categoryMap: Record<ExpenseCategory, { ar: string, en: string, className: string, color: string }> = {
    rent: { ar: 'إيجار', en: 'Rent', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', color: '#10B981' },
    bills: { ar: 'فواتير', en: 'Bills', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', color: '#3B82F6' },
    salaries: { ar: 'رواتب', en: 'Salaries', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300', color: '#8B5CF6' },
    supplies: { ar: 'مشتريات', en: 'Supplies', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', color: '#F59E0B' },
    maintenance: { ar: 'صيانة', en: 'Maintenance', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', color: '#F97316' },
    other: { ar: 'أخرى', en: 'Other', className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', color: '#6B7280' },
};


function ExpensesPage() {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const { toast } = useToast();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [isConfirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({});

    const fetchExpenses = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (dateRange.from) params.append('startDate', dateRange.from.toISOString());
            if (dateRange.to) params.append('endDate', dateRange.to.toISOString());

            const response = await fetch(`/api/v1/expenses?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch expenses');
            const data: Expense[] = await response.json();
            setExpenses(data);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t("خطأ في جلب البيانات", "Fetch Error"),
                description: t("لم نتمكن من جلب المصاريف من الخادم.", "Could not fetch expenses from the server."),
            });
        } finally {
            setIsLoading(false);
        }
    }, [dateRange, t, toast]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);
    
    const openAddDialog = () => {
        setEditingExpense(null);
        setDialogOpen(true);
    }
    
    const openEditDialog = (expense: Expense) => {
        setEditingExpense(expense);
        setDialogOpen(true);
    }

    const openDeleteDialog = (expense: Expense) => {
        setExpenseToDelete(expense);
        setConfirmDeleteOpen(true);
    }

    const handleDelete = async () => {
        if (!expenseToDelete) return;
        try {
            const response = await fetch(`/api/v1/expenses/${expenseToDelete.id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete expense');

            setExpenses(prev => prev.filter(exp => exp.id !== expenseToDelete.id));
             toast({
                title: t("تم الحذف بنجاح", "Expense Deleted"),
                description: t(`تم حذف المصروف "${expenseToDelete.description}".`, `The expense "${expenseToDelete.description}" has been deleted.`),
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: t("خطأ في الحذف", "Delete Error"),
                description: t("لم نتمكن من حذف المصروف.", "Could not delete the expense."),
            });
        } finally {
            setConfirmDeleteOpen(false);
            setExpenseToDelete(null);
        }
    }

    const handleSave = async (formData: Omit<Expense, 'id'>) => {
        const dataToSave = { ...formData };
        Object.keys(dataToSave).forEach(key => {
            const typedKey = key as keyof typeof dataToSave;
            if (dataToSave[typedKey] === '' || dataToSave[typedKey] === null) {
                delete (dataToSave as any)[typedKey];
            }
        });

        if (editingExpense) {
            try {
                const response = await fetch(`/api/v1/expenses/${editingExpense.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave),
                });
                if (!response.ok) throw new Error('Failed to update expense');
                await fetchExpenses();
                toast({
                    title: t("تم التحديث بنجاح", "Expense Updated"),
                    description: t("تم تحديث بيانات المصروف بنجاح.", "The expense data has been updated."),
                });

            } catch (error) {
                console.error(error);
                toast({
                    variant: "destructive",
                    title: t("خطأ في التحديث", "Update Error"),
                    description: t("لم نتمكن من تحديث المصروف.", "Could not update the expense."),
                });
            }
        } else {
            try {
                const response = await fetch('/api/v1/expenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave),
                });
                if (!response.ok) throw new Error('Failed to save expense');
                await fetchExpenses();
                toast({
                    title: t("تم الحفظ بنجاح", "Expense Saved"),
                    description: t("تم تسجيل المصروف الجديد بنجاح.", "The new expense has been recorded."),
                });
            } catch (error) {
                 console.error(error);
                 toast({
                    variant: "destructive",
                    title: t("خطأ في الحفظ", "Save Error"),
                    description: t("لم نتمكن من حفظ المصروف الجديد.", "Could not save the new expense."),
                });
            }
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
                const categoryInfo = categoryMap[category] || categoryMap.other;
                return <Badge variant="outline" className={cn("rounded-md", categoryInfo.className)}>{categoryInfo[language]}</Badge>
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
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                    <Info className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                                    {t('تفاصيل إضافية', 'More Details')}
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <div className="text-xs text-muted-foreground p-2 space-y-1">
                                        <p><strong>{t('المورد:', 'Supplier:')}</strong> {expense.supplier || '-'}</p>
                                        <p><strong>{t('طريقة الدفع:', 'Payment:')}</strong> {expense.payment_method || '-'}</p>
                                        <p><strong>{t('رقم الفاتورة:', 'Invoice #:')}</strong> {expense.invoice_number || '-'}</p>
                                    </div>
                                </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                            <DropdownMenuItem onClick={() => openDeleteDialog(expense)} className="text-red-500 focus:text-red-500">
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
    
    const { filteredTotal, categoryDistribution, expensesByDay } = useMemo(() => {
        const currentRows = table.getRowModel().rows;
        const filteredTotal = currentRows.reduce((total, row) => total + row.original.amount, 0);

        const categoryDistribution = currentRows.reduce((acc, row) => {
            const { category, amount } = row.original;
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {} as Record<ExpenseCategory, number>);

        const expensesByDay = currentRows.reduce((acc, row) => {
            const { date, amount } = row.original;
            const day = format(new Date(date), 'yyyy-MM-dd');
            acc[day] = (acc[day] || 0) + amount;
            return acc;
        }, {} as Record<string, number>);

        return {
            filteredTotal,
            categoryDistribution: Object.entries(categoryDistribution).map(([name, value]) => ({ name: name as ExpenseCategory, value })),
            expensesByDay: Object.entries(expensesByDay).map(([date, amount]) => ({ date, amount })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        };
    }, [table.getRowModel().rows]);
    

    const pieChartConfig = useMemo(() => {
        return categoryDistribution.reduce((acc, { name }) => {
            const categoryInfo = categoryMap[name] || categoryMap.other;
            acc[name] = {
                label: t(categoryInfo.ar, categoryInfo.en),
                color: categoryInfo.color,
            };
            return acc;
        }, {} as any);
    }, [categoryDistribution, t]);

    const barChartConfig = {
      amount: {
        label: t("المبلغ", "Amount"),
        color: "hsl(var(--chart-1))",
      },
    }

    return (
        <main className="flex-1 p-4 sm:p-6" dir={dir}>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-headline text-3xl font-bold text-foreground">{t('إدارة المصاريف', 'Expense Management')}</h1>
                <Button onClick={openAddDialog} size="lg" className="shadow-md shadow-primary/30">
                    <PlusCircle className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                    {t('تسجيل مصروف جديد', 'Record New Expense')}
                </Button>
            </div>
            
            <div className="mb-6">
                <Card className="shadow-lg shadow-purple-500/10">
                    <CardHeader>
                        <CardTitle>{t('نظرة عامة على المصاريف', 'Expenses Overview')}</CardTitle>
                        <CardDescription>{t('ملخص للمصاريف المسجلة حسب الفلاتر المحددة.', 'Summary of recorded expenses based on selected filters.')}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                       <div className='lg:col-span-1 flex flex-col gap-6'>
                            <Card className="shadow-md shadow-purple-500/10">
                                <CardHeader>
                                    <CardTitle>{t('إجمالي المصاريف', 'Total Expenses')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-bold text-primary">{filteredTotal.toLocaleString()} {t('ل.س', 'SYP')}</p>
                                </CardContent>
                            </Card>
                             <Card className="shadow-md shadow-purple-500/10">
                                <CardHeader>
                                    <CardTitle>{t('توزيع المصاريف', 'Expense Distribution')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? <div className="h-[200px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> :
                                    <ChartContainer config={pieChartConfig} className="mx-auto aspect-square h-[200px]">
                                        <PieChart>
                                            <Tooltip
                                            cursor={false}
                                            content={<ChartTooltipContent hideLabel nameKey="name" />}
                                            />
                                            <Pie data={categoryDistribution} dataKey="value" nameKey="name" innerRadius={50} strokeWidth={5}>
                                                {categoryDistribution.map((entry) => (
                                                    <Cell key={`cell-${entry.name}`} fill={categoryMap[entry.name]?.color || '#ccc'} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ChartContainer>
                                    }
                                </CardContent>
                            </Card>
                       </div>
                        <div className="lg:col-span-2">
                            <Card className="h-full shadow-md shadow-purple-500/10">
                                <CardHeader>
                                    <CardTitle>{t('المصاريف عبر الزمن', 'Expenses Over Time')}</CardTitle>
                                </CardHeader>
                                <CardContent className="h-[400px] pl-0">
                                     {isLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div> :
                                        <ChartContainer config={barChartConfig} className="w-full h-full">
                                            <BarChart data={expensesByDay} accessibilityLayer>
                                                <CartesianGrid vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    tickLine={false}
                                                    tickMargin={10}
                                                    axisLine={false}
                                                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                                                />
                                                <YAxis
                                                    tickFormatter={(value) => `${Number(value) / 1000}k`}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    cursor={false}
                                                    content={<ChartTooltipContent indicator="dot" />}
                                                />
                                                <Legend />
                                                <Bar dataKey="amount" fill="var(--color-amount)" radius={4} name={barChartConfig.amount.label} />
                                            </BarChart>
                                        </ChartContainer>
                                     }
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>


            <Card className="shadow-lg shadow-purple-500/10">
                <CardHeader>
                     <div className="flex items-center justify-between flex-wrap gap-2">
                        <CardTitle>{t('سجل المصاريف', 'Expense Log')}</CardTitle>
                        <div className="flex items-center gap-2 flex-wrap">
                             <Input
                                placeholder={t('ابحث في الوصف...', 'Search descriptions...')}
                                value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
                                onChange={(event) =>
                                    table.getColumn('description')?.setFilterValue(event.target.value)
                                }
                                className="max-w-xs"
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
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.from ? (
                                    dateRange.to ? (
                                        <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(dateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>{t('اختر نطاق تاريخ', 'Pick a date range')}</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    locale={language === 'ar' ? ar : undefined}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                     </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </CardContent>
            </Card>

            <ExpenseFormDialog 
                key={editingExpense?.id || 'new'}
                isOpen={isDialogOpen} 
                onOpenChange={setDialogOpen}
                onSave={handleSave}
                expense={editingExpense}
            />
            
            <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <AlertDialogContent dir={dir}>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t("تأكيد الحذف", "Confirm Deletion")}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t(`هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.`, `Are you sure you want to delete this expense? This action cannot be undone.`)}
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

interface ExpenseFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onSave: (formData: Omit<Expense, 'id'>) => void;
    expense: Expense | null;
}

function ExpenseFormDialog({ isOpen, onOpenChange, onSave, expense }: ExpenseFormDialogProps) {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    
    const getInitialFormData = useCallback((): Omit<Expense, 'id'> => {
        if (expense) {
            return {
                description: expense.description,
                description_en: expense.description_en || '',
                amount: expense.amount,
                date: expense.date.split('T')[0], // Ensure date is in YYYY-MM-DD format
                category: expense.category,
                user_id: expense.user_id || 'current_user_id',
                payment_method: expense.payment_method || 'cash',
                supplier: expense.supplier || '',
                invoice_number: expense.invoice_number || '',
                notes: expense.notes || '',
            };
        }
        return { 
            description: '', 
            description_en: '', 
            amount: 0, 
            date: new Date().toISOString().split('T')[0], 
            category: 'supplies' as ExpenseCategory,
            user_id: 'current_user_id', // Should be replaced with actual logged-in user ID
            payment_method: 'cash',
            supplier: '',
            invoice_number: '',
            notes: '',
        };
    }, [expense]);

    const [formData, setFormData] = useState<Omit<Expense, 'id'>>(getInitialFormData);
    
    React.useEffect(() => {
        setFormData(getInitialFormData());
    }, [expense, isOpen, getInitialFormData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        // FIX: Ensure amount is parsed as a number
        setFormData(prev => ({ ...prev, [id]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSelectChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    }

    const handleSubmit = () => {
        onSave(formData);
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange} dir={dir}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="font-headline">{expense ? t('تعديل المصروف', 'Edit Expense') : t('تسجيل مصروف جديد', 'Record New Expense')}</DialogTitle>
                    <DialogDescription>
                        {t('أدخل تفاصيل المصروف ليتم أرشفته. الحقول المعلمة بـ * إلزامية.', 'Enter the expense details to archive it. Fields marked with * are required.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                     <div className="space-y-2">
                        <Label htmlFor="description">{t('وصف المصروف', 'Description')}*</Label>
                        <Input id="description" value={formData.description} onChange={handleChange} required/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="amount">{t('المبلغ (ل.س)', 'Amount (SYP)')}*</Label>
                            <Input id="amount" type="number" value={formData.amount} onChange={handleChange} required/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date">{t('التاريخ', 'Date')}*</Label>
                            <Input id="date" type="date" value={formData.date} onChange={handleChange} required/>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">{t('التصنيف', 'Category')}*</Label>
                            <Select value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
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
                         <div className="space-y-2">
                            <Label htmlFor="payment_method">{t('طريقة الدفع', 'Payment Method')}*</Label>
                             <Select value={formData.payment_method} onValueChange={(v) => handleSelectChange('payment_method', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('اختر طريقة الدفع', 'Select a payment method')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">{t('نقداً', 'Cash')}</SelectItem>
                                    <SelectItem value="credit_card">{t('بطاقة ائتمان', 'Credit Card')}</SelectItem>
                                    <SelectItem value="bank_transfer">{t('تحويل بنكي', 'Bank Transfer')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="supplier">{t('المورد/الجهة', 'Supplier/Beneficiary')}</Label>
                            <Input id="supplier" value={formData.supplier || ''} onChange={handleChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="invoice_number">{t('رقم الفاتورة', 'Invoice Number')}</Label>
                            <Input id="invoice_number" value={formData.invoice_number || ''} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">{t('ملاحظات إضافية', 'Additional Notes')}</Label>
                        <Textarea id="notes" value={formData.notes || ''} onChange={handleChange} />
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
    
