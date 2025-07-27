
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from "@/hooks/use-language"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet, FileCode, Printer, Building, Phone, Mail, TrendingUp, TrendingDown, DollarSign, ListOrdered, Wallet, Loader2 } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings"
import type { Order, Expense, MenuItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useOrderFlow } from '@/hooks/use-order-flow';

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  orderCount: number;
  avgOrderValue: number;
  salesByDay: { date: string; date_ar: string; sales: number; expenses: number }[];
  topSellingItems: { name: string; name_en: string; count: number }[];
}


const initialReportData: ReportData = {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    orderCount: 0,
    avgOrderValue: 0,
    salesByDay: [],
    topSellingItems: [],
};


function ReportsPage() {
    const { language } = useLanguage();
    const { settings } = useRestaurantSettings();
    const { orders: allOrders, loading: orderFlowLoading } = useOrderFlow();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const { toast } = useToast();

    const [reportData, setReportData] = useState<ReportData>(initialReportData);
    const [isLoading, setIsLoading] = useState(true);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expensesLoading, setExpensesLoading] = useState(true);

    useEffect(() => {
        const fetchExpenses = async () => {
            setExpensesLoading(true);
            try {
                const expensesRes = await fetch('/api/v1/expenses');
                if (!expensesRes.ok) {
                    throw new Error('Failed to fetch expenses');
                }
                const expenseData = await expensesRes.json();
                setExpenses(expenseData.expenses || []);
            } catch (error) {
                console.error("Failed to fetch expenses for report:", error);
                toast({
                    variant: 'destructive',
                    title: t('خطأ في التقارير', 'Report Error'),
                    description: t('لم نتمكن من جلب بيانات المصاريف.', 'Could not fetch expense data for reports.'),
                });
            } finally {
                setExpensesLoading(false);
            }
        };

        fetchExpenses();
    }, [t, toast]);


    useEffect(() => {
        if (orderFlowLoading || expensesLoading) {
            setIsLoading(true);
            return;
        }

        const processData = () => {
            try {
                const orders = allOrders.filter(o => o.status === 'completed');

                const totalRevenue = orders.reduce((sum, order) => sum + (order.final_total || 0), 0);
                const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
                const netProfit = totalRevenue - totalExpenses;
                const orderCount = orders.length;
                const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

                const topItemsMap: Record<string, {name: string, name_en: string, count: number}> = {};
                orders.forEach(order => {
                    (order.items || []).forEach(item => {
                        const itemId = item.id || (item as any).menu_item_id;
                        if (!itemId) return;
                        if (!topItemsMap[itemId]) {
                            topItemsMap[itemId] = { name: item.name, name_en: (item as any).name_en || '', count: 0 };
                        }
                        topItemsMap[itemId].count += item.quantity || 1;
                    });
                });
                
                const topSellingItems = Object.values(topItemsMap).sort((a, b) => b.count - a.count).slice(0, 5);

                const salesByDay: ReportData['salesByDay'] = [];
                const expensesByDay: { [key: string]: number } = {};

                const dateToDay = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-CA');

                expenses.forEach(expense => {
                    const day = dateToDay(expense.date);
                    if (!expensesByDay[day]) expensesByDay[day] = 0;
                    expensesByDay[day] += expense.amount || 0;
                });

                const salesAndExpensesByDay: { [key: string]: { sales: number; expenses: number } } = {};
                
                orders.forEach(order => {
                    if (order.completed_at) {
                        const day = dateToDay(order.completed_at);
                        if (!salesAndExpensesByDay[day]) salesAndExpensesByDay[day] = { sales: 0, expenses: 0 };
                        salesAndExpensesByDay[day].sales += order.final_total || 0;
                    }
                });

                Object.keys(expensesByDay).forEach(day => {
                    if (!salesAndExpensesByDay[day]) salesAndExpensesByDay[day] = { sales: 0, expenses: 0 };
                    salesAndExpensesByDay[day].expenses += expensesByDay[day];
                });
                
                const sortedDays = Object.keys(salesAndExpensesByDay).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
                
                const finalSalesByDay = sortedDays.map(day => {
                    const dateObj = new Date(day);
                    const dayName = dateObj.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
                    return {
                        date: dayName,
                        date_ar: dayName,
                        sales: salesAndExpensesByDay[day].sales,
                        expenses: salesAndExpensesByDay[day].expenses
                    }
                });
                
                setReportData({
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    orderCount,
                    avgOrderValue,
                    topSellingItems,
                    salesByDay: finalSalesByDay,
                });

            } catch (error) {
                console.error("Failed to process report data:", error);
                 toast({
                    variant: 'destructive',
                    title: t('خطأ في معالجة البيانات', 'Data Processing Error'),
                    description: t('حدث خطأ أثناء تحليل بيانات التقارير.', 'An error occurred while analyzing report data.'),
                });
            } finally {
                setIsLoading(false);
            }
        };

        processData();
    }, [allOrders, expenses, orderFlowLoading, expensesLoading, t, toast, language]);


    const chartConfig = {
      sales: {
        label: t("المبيعات", "Sales"),
        color: "hsl(var(--chart-1))",
      },
      expenses: {
        label: t("المصاريف", "Expenses"),
        color: "hsl(var(--chart-2))",
      },
    } as const;

    const kpiCards = [
        { title_ar: "إجمالي الإيرادات", title_en: "Total Revenue", value: reportData.totalRevenue, icon: <TrendingUp/>, color: "text-green-500" },
        { title_ar: "إجمالي المصاريف", title_en: "Total Expenses", value: reportData.totalExpenses, icon: <TrendingDown/>, color: "text-red-500" },
        { title_ar: "صافي الربح", title_en: "Net Profit", value: reportData.netProfit, icon: <Wallet/>, color: "text-primary" },
        { title_ar: "عدد الطلبات المكتملة", title_en: "Completed Orders", value: reportData.orderCount, icon: <ListOrdered/>, color: "text-blue-500", isCurrency: false },
    ];

    const handlePrint = () => {
      window.print();
    }
    
    const formatCurrency = (value: number) => {
        return `${value.toLocaleString('ar-SY')} ${t('ل.س', 'SYP')}`;
    }

  return (
    <main className="flex-1 p-4 sm:p-6 select-none">
        <div className="hidden print:block print-header space-y-2">
            <h1 className="print-header-title">{settings.restaurantName}</h1>
             <div className="text-xs text-gray-600 space-y-1">
                <p className="flex items-center justify-center gap-2"><Building className="w-3 h-3"/> {settings.address}</p>
                <p className="flex items-center justify-center gap-2"><Phone className="w-3 h-3"/> {settings.phone}</p>
                {settings.email && <p className="flex items-center justify-center gap-2"><Mail className="w-3 h-3"/> {settings.email}</p>}
            </div>
             <p className="text-sm pt-2">{t('تاريخ الطباعة', 'Print Date')}: {new Date().toLocaleDateString(language === 'ar' ? 'ar-SY' : 'en-CA')}</p>
        </div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4 report-print-hide">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t("التقارير التحليلية", "Analytical Reports")}</h1>
            <div className="flex items-center gap-2 flex-wrap">
                <Select defaultValue="weekly">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("عرض حسب", "View by")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">{t("يومي", "Daily")}</SelectItem>
                        <SelectItem value="weekly">{t("أسبوعي", "Weekly")}</SelectItem>
                        <SelectItem value="monthly">{t("شهري", "Monthly")}</SelectItem>
                        <SelectItem value="yearly">{t("سنوي", "Yearly")}</SelectItem>
                    </SelectContent>
                </Select>
                 <div className="flex items-center gap-1">
                     <Button variant="outline" size="icon" aria-label={t("طباعة", "Print")} onClick={handlePrint}>
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {kpiCards.map(kpi => (
                        <Card key={kpi.title_en}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t(kpi.title_ar, kpi.title_en)}</CardTitle>
                                {React.cloneElement(kpi.icon, { className: `h-4 w-4 ${kpi.color}` })}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {kpi.isCurrency === false ? kpi.value.toLocaleString() : formatCurrency(kpi.value)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                     <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>{t("ملخص الأداء المالي", "Financial Performance Summary")}</CardTitle>
                            <CardDescription className="report-print-hide">{t("مقارنة بين إجمالي المبيعات والمصاريف.", "Sales vs. expenses.")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {reportData.salesByDay.length > 0 ? (
                                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                                    <BarChart data={reportData.salesByDay} accessibilityLayer>
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                            dataKey={language === 'ar' ? "date_ar" : "date"}
                                            tickLine={false}
                                            tickMargin={10}
                                            axisLine={false}
                                        />
                                         <YAxis
                                            tickFormatter={(value) => `${Number(value) / 1000}k`}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip 
                                            cursor={false}
                                            content={<ChartTooltipContent 
                                                formatter={(value) => formatCurrency(value as number)}
                                                labelClassName="font-bold text-lg"
                                                indicator="dot"
                                            />} 
                                        />
                                        <Legend contentStyle={{fontFamily: 'Alegreya'}} />
                                        <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} name={chartConfig.sales.label} />
                                        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} name={chartConfig.expenses.label}/>
                                    </BarChart>
                                </ChartContainer>
                             ) : (
                                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                                    {t('لا توجد بيانات لعرض الرسم البياني.', 'No data available for the chart.')}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>{t("الأصناف الأكثر مبيعاً", "Top Selling Items")}</CardTitle>
                            <CardDescription className="report-print-hide">{t("الأصناف الأكثر طلباً.", "Most ordered items.")}</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {reportData.topSellingItems.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("الصنف", "Item")}</TableHead>
                                        <TableHead className="text-center">{t("عدد الطلبات", "Orders")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {reportData.topSellingItems.map((item) => (
                                        <TableRow key={item.name}>
                                            <TableCell className="font-medium">{language === 'ar' ? item.name : item.name_en}</TableCell>
                                            <TableCell className="text-center">
                                                 <Badge variant="secondary">{item.count}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                           ) : (
                                <div className="flex items-center justify-center h-40 text-muted-foreground">
                                    {t('لا توجد بيانات.', 'No data available.')}
                                </div>
                           )}
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>{t("تقارير إضافية", "Additional Reports")}</CardTitle>
                            <CardDescription className="report-print-hide">{t("نظرة عامة على جوانب أخرى من أداء المطعم.", "Overview of other aspects of restaurant performance.")}</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-bold mb-2">{t("تقرير حالة المطبخ", "Kitchen Status Report")}</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("متوسط قيمة الطلب", "Avg. Order Value")}</span>
                                        <span className="font-bold">{formatCurrency(reportData.avgOrderValue)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("ساعات الذروة", "Peak Hours")}</span>
                                        <span className="font-bold">{t("غير محدد", "N/A")}</span>
                                    </div>
                                </div>
                            </div>
                             <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-bold mb-2">{t("تقرير الزبائن", "Customer Report")}</h4>
                                 <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("الزبائن الجدد", "New Customers")}</span>
                                        <span className="font-bold">{t("غير محدد", "N/A")}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )}
    </main>
  )
}


export default function GuardedReportsPage() {
    return (
        <AuthGuard>
            <ReportsPage />
        </AuthGuard>
    )
}
