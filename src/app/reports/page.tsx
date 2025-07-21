"use client"

import { useLanguage } from "@/hooks/use-language"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const salesData = [
  { date: "Sat", date_ar: "السبت", sales: 400000, expenses: 150000 },
  { date: "Sun", date_ar: "الأحد", sales: 300000, expenses: 120000 },
  { date: "Mon", date_ar: "الإثنين", sales: 500000, expenses: 200000 },
  { date: "Tue", date_ar: "الثلاثاء", sales: 450000, expenses: 180000 },
  { date: "Wed", date_ar: "الأربعاء", sales: 600000, expenses: 250000 },
  { date: "Thu", date_ar: "الخميس", sales: 750000, expenses: 300000 },
  { date: "Fri", date_ar: "الجمعة", sales: 900000, expenses: 350000 },
]

const topSellingItems = [
    { name: "مشويات مشكلة", name_en: "Mixed Grill", count: 120 },
    { name: "شيش طاووق", name_en: "Shish Tawook", count: 95 },
    { name: "فتوش", name_en: "Fattoush", count: 80 },
    { name: "بيبسي", name_en: "Pepsi", count: 250 },
    { name: "كبة مقلية", name_en: "Fried Kibbeh", count: 70 },
]

const kitchenReportData = {
    avgPreparationTime: "18",
    peakHours: "8:00 PM - 10:00 PM",
    peakHours_ar: "8:00م - 10:00م",
    orderCount: 85,
}

export default function ReportsPage() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const chartConfig = {
      sales: {
        label: t("المبيعات", "Sales"),
        color: "hsl(var(--primary))",
      },
      expenses: {
        label: t("المصاريف", "Expenses"),
        color: "hsl(var(--accent))",
      },
    }

  return (
    <main className="flex-1 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t("التقارير", "Reports")}</h1>
            <div className="flex items-center gap-2">
                <Select defaultValue="weekly">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t("عرض حسب", "View by")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">{t("يومي", "Daily")}</SelectItem>
                        <SelectItem value="weekly">{t("أسبوعي", "Weekly")}</SelectItem>
                        <SelectItem value="monthly">{t("شهري", "Monthly")}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>{t("ملخص الأداء المالي", "Financial Performance Summary")}</CardTitle>
                    <CardDescription>{t("مقارنة بين إجمالي المبيعات والمصاريف خلال آخر 7 أيام.", "Sales vs. expenses over the last 7 days.")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={salesData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey={language === 'ar' ? "date_ar" : "date"}
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                             <YAxis
                                tickFormatter={(value) => `${Number(value) / 1000}k`}
                            />
                            <Tooltip 
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={<ChartTooltipContent 
                                    formatter={(value, name) => `${(typeof value === 'number' ? value.toLocaleString() : value)} ${t('ل.س', 'SYP')}`}
                                    labelClassName="font-bold"
                                />} 
                            />
                            <Legend />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("الأصناف الأكثر مبيعاً", "Top Selling Items")}</CardTitle>
                    <CardDescription>{t("الأصناف الأكثر طلباً هذا الأسبوع.", "Most ordered items this week.")}</CardDescription>
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
                            {topSellingItems.map((item) => (
                                <TableRow key={item.name}>
                                    <TableCell className="font-medium">{language === 'ar' ? item.name : item.name_en}</TableCell>
                                    <TableCell className="text-center">
                                         <Badge>{item.count}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t("تقرير حالة المطبخ", "Kitchen Status Report")}</CardTitle>
                    <CardDescription>{t("نظرة عامة على أداء المطبخ.", "Overview of kitchen performance.")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("متوسط وقت التحضير", "Avg. Preparation Time")}</span>
                        <span className="font-bold">{kitchenReportData.avgPreparationTime} {t("دقيقة", "min")}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("ساعات الذروة", "Peak Hours")}</span>
                        <span className="font-bold">{language === 'ar' ? kitchenReportData.peakHours_ar : kitchenReportData.peakHours}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t("إجمالي الطلبات اليوم", "Total Orders Today")}</span>
                        <span className="font-bold">{kitchenReportData.orderCount}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    </main>
  )
}
