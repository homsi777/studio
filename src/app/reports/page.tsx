
"use client"

import { useLanguage } from "@/hooks/use-language"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, FileSpreadsheet, FileCode, Printer, Building, Phone, Mail } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings"

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

function ReportsPage() {
    const { language } = useLanguage();
    const { settings } = useRestaurantSettings();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;

    const chartConfig = {
      sales: {
        label: t("المبيعات", "Sales"),
        color: "hsl(var(--chart-1))",
      },
      expenses: {
        label: t("المصاريف", "Expenses"),
        color: "hsl(var(--chart-2))",
      },
    }

    const handlePrint = () => {
      window.print();
    }

  return (
    <main className="flex-1 p-4 sm:p-6 select-none">
        <div className="hidden print:block print-header space-y-2">
            <h1 className="print-header-title">{settings.restaurantName}</h1>
             <div className="text-xs text-gray-600">
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
                    <Button variant="outline" size="icon" aria-label={t("تصدير PDF", "Export PDF")}>
                        <FileText className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" aria-label={t("تصدير Excel", "Export Excel")}>
                        <FileSpreadsheet className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" aria-label={t("تصدير Word", "Export Word")}>
                        <FileCode className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" aria-label={t("طباعة", "Print")} onClick={handlePrint}>
                        <Printer className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>{t("ملخص الأداء المالي", "Financial Performance Summary")}</CardTitle>
                    <CardDescription className="report-print-hide">{t("مقارنة بين إجمالي المبيعات والمصاريف خلال آخر 7 أيام.", "Sales vs. expenses over the last 7 days.")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[350px] w-full">
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
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip 
                                cursor={false}
                                content={<ChartTooltipContent 
                                    formatter={(value) => `${(typeof value === 'number' ? value.toLocaleString() : value)} ${t('ل.س', 'SYP')}`}
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
                            {topSellingItems.map((item) => (
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
                                <span className="font-bold">{kitchenReportData.avgPreparationTime} {t("دقيقة", "min")}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("ساعات الذروة", "Peak Hours")}</span>
                                <span className="font-bold">{language === 'ar' ? kitchenReportData.peakHours_ar : kitchenReportData.peakHours}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{t("إجمالي الطلبات اليوم", "Total Orders Today")}</span>
                                <span className="font-bold">{kitchenReportData.orderCount}</span>
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
                                <span className="font-bold">150,000 {t("ل.س", "SYP")}</span>
                            </div>
                        </div>
                    </div>
                     <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-bold mb-2">{t("تقرير الموظفين", "Employee Report")}</h4>
                        <p className="text-sm text-muted-foreground">{t("سيتم عرض بيانات أداء الموظفين هنا.", "Employee performance data will be displayed here.")}</p>
                    </div>
                     <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-bold mb-2">{t("تقرير المخزون", "Inventory Report")}</h4>
                        <p className="text-sm text-muted-foreground">{t("سيتم عرض بيانات الصادر والوارد هنا.", "Incoming and outgoing stock data will be displayed here.")}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
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

    