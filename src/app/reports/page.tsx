"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const salesData = [
  { date: "السبت", sales: 400000 },
  { date: "الأحد", sales: 300000 },
  { date: "الإثنين", sales: 500000 },
  { date: "الثلاثاء", sales: 450000 },
  { date: "الأربعاء", sales: 600000 },
  { date: "الخميس", sales: 750000 },
  { date: "الجمعة", sales: 900000 },
]

const topSellingItems = [
    { name: "مشويات مشكلة", count: 120 },
    { name: "شيش طاووق", count: 95 },
    { name: "فتوش", count: 80 },
    { name: "بيبسي", count: 250 },
    { name: "كبة مقلية", count: 70 },
]

const kitchenReportData = {
    avgPreparationTime: "18 دقيقة",
    peakHours: "8:00م - 10:00م",
    orderCount: 85,
}

export default function ReportsPage() {
    const chartConfig = {
      sales: {
        label: "المبيعات (ل.س)",
        color: "hsl(var(--primary))",
      },
    }

  return (
    <main className="flex-1 p-4 sm:p-6" dir="rtl">
        <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl font-bold text-foreground">التقارير</h1>
            <div className="flex items-center gap-2">
                <Select defaultValue="weekly">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="عرض حسب" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">يومي</SelectItem>
                        <SelectItem value="weekly">أسبوعي</SelectItem>
                        <SelectItem value="monthly">شهري</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>ملخص المبيعات الأسبوعي</CardTitle>
                    <CardDescription>إجمالي المبيعات بالليرة السورية خلال آخر 7 أيام.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <BarChart data={salesData} accessibilityLayer>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                             <YAxis
                                tickFormatter={(value) => `${Number(value) / 1000} ألف`}
                            />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>الأصناف الأكثر مبيعاً</CardTitle>
                    <CardDescription>الأصناف الأكثر طلباً هذا الأسبوع.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الصنف</TableHead>
                                <TableHead className="text-center">عدد الطلبات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topSellingItems.map((item) => (
                                <TableRow key={item.name}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
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
                    <CardTitle>تقرير حالة المطبخ</CardTitle>
                    <CardDescription>نظرة عامة على أداء المطبخ.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">متوسط وقت التحضير</span>
                        <span className="font-bold">{kitchenReportData.avgPreparationTime}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">ساعات الذروة</span>
                        <span className="font-bold">{kitchenReportData.peakHours}</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">إجمالي الطلبات اليوم</span>
                        <span className="font-bold">{kitchenReportData.orderCount}</span>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>ملخص المصاريف</CardTitle>
                    <CardDescription>إجمالي المصاريف المسجلة هذا الشهر.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">إيجار</span>
                        <span className="font-bold">2,500,000 ل.س</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">فواتير</span>
                        <span className="font-bold">800,000 ل.س</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">مشتريات</span>
                        <span className="font-bold">7,200,000 ل.س</span>
                    </div>
                     <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                        <span>الإجمالي</span>
                        <span>10,500,000 ل.س</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    </main>
  )
}
