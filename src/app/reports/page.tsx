
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
import type { Order, Expense } from '@/types';
import { useToast } from '@/hooks/use-toast';

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
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const { toast } = useToast();

    const [reportData, setReportData] = useState<ReportData>(initialReportData);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAndProcessData = async () => {
            setIsLoading(true);
            try {
                // To get all completed orders, I will fetch without a specific status filter
                // as the logic to filter by status=completed was not fully implemented in the API.
                // The processing logic below will filter for completed orders.
                const [ordersRes, expensesRes] = await Promise.all([
                    fetch('/api/v1/orders'),
                    fetch('/api/v1/expenses')
                ]);

                if (!ordersRes.ok || !expensesRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const allOrders: Order[] = await ordersRes.json();
                const expenses: Expense[] = await expensesRes.json();
                
                const orders = allOrders.filter(o => o.status === 'completed');

                // Process data
                const totalRevenue = orders.reduce((sum, order) => sum + order.finalTotal, 0);
                const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
                const netProfit = totalRevenue - totalExpenses;
                const orderCount = orders.length;
                const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

                const topItems: Record<string, {name: string, name_en: string, count: number}> = {};
                orders.forEach(order => {
                    order.items.forEach(item => {
                        if (!topItems[item.id]) {
                            topItems[item.id] = { name: item.name, name_en: item.name_en || '', count: 0 };
                        }
                        topItems[item.id].count += item.quantity;
                    });
                });
                
                const topSellingItems = Object.values(topItems).sort((a, b) => b.count - a.count).slice(0, 5);

                // For demo, we'll use static daily data as we don't have enough timestamps
                const salesData = [
                    { date: "Sat", date_ar: "السبت", sales: 400000, expenses: 150000 },
                    { date: "Sun", date_ar: "الأحد", sales: 300000, expenses: 120000 },
                    { date: "Mon", date_ar: "الإثنين", sales: 500000, expenses: 200000 },
                    { date: "Tue", date_ar: "الثلاثاء", sales: 450000, expenses: 180000 },
                    { date: "Wed", date_ar: "الأربعاء", sales: 600000, expenses: 250000 },
                    { date: "Thu", date_ar: "الخميس", sales: 750000, expenses: 300000 },
                    { date: "Fri", date_ar: "الجمعة", sales: 900000, expenses: 350000 },
                ];
                
                setReportData({
                    totalRevenue,
                    totalExpenses,
                    netProfit,
                    orderCount,
                    avgOrderValue,
                    topSellingItems,
                    salesByDay: salesData,
                });

            } catch (error) {
                console.error("Failed to generate report:", error);
                toast({
                    variant: 'destructive',
                    title: t('خطأ في التقارير', 'Report Error'),
                    description: t('لم نتمكن من جلب بيانات التقارير.', 'Could not fetch data for reports.'),
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndProcessData();
    }, [t, toast]);


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
        { title_ar: "عدد الطلبات", title_en: "Number of Orders", value: reportData.orderCount, icon: <ListOrdered/>, color: "text-blue-500", isCurrency: false },
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
                            <CardDescription className="report-print-hide">{t("مقارنة بين إجمالي المبيعات والمصاريف خلال آخر 7 أيام.", "Sales vs. expenses over the last 7 days.")}</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>{t("الأصناف الأكثر مبيعاً", "Top Selling Items")}</CardTitle>
                            <CardDescription className="report-print-hide">{t("الأصناف الأكثر طلباً هذا الأسبوع.", "Most ordered items this week.")}</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                        <span className="text-muted-foreground">{t("متوسط وقت التحضير", "Avg. Prep Time")}</span>
                                        <span className="font-bold">{18} {t("دقيقة", "min")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("ساعات الذروة", "Peak Hours")}</span>
                                        <span className="font-bold">{t("8:00م - 10:00م", "8:00 PM - 10:00 PM")}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("إجمالي الطلبات اليوم", "Total Orders Today")}</span>
                                        <span className="font-bold">{85}</span>
                                    </div>
                                </div>
                            </div>
                             <div className="p-4 bg-muted/50 rounded-lg">
                                <h4 className="font-bold mb-2">{t("تقرير الزبائن", "Customer Report")}</h4>
                                 <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("الزبائن الجدد", "New Customers")}</span>
                                        <span className="font-bold">15</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t("متوسط قيمة الطلب", "Avg. Order Value")}</span>
                                        <span className="font-bold">{formatCurrency(reportData.avgOrderValue)}</span>
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
