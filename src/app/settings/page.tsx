"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QrCodeGenerator } from "@/components/settings/qr-code-generator";
import { useLanguage } from "@/hooks/use-language";

export default function SettingsPage() {
  const { language } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-semibold">{t('الإعدادات', 'Settings')}</h1>
            <Button>{t('حفظ التغييرات', 'Save Changes')}</Button>
        </div>
        <Separator />

        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Card>
                <CardHeader>
                    <CardTitle>{t('الإعدادات العامة', 'General Settings')}</CardTitle>
                    <CardDescription>{t('إدارة الإعدادات الأساسية للمطعم.', 'Manage basic restaurant settings.')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="restaurant-name">{t('اسم المطعم', 'Restaurant Name')}</Label>
                    <Input id="restaurant-name" defaultValue="العالمية" />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="restaurant-address">{t('العنوان', 'Address')}</Label>
                    <Input id="restaurant-address" defaultValue="دمشق، سوريا" />
                    </div>
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle>{t('إعدادات العملة', 'Currency Settings')}</CardTitle>
                    <CardDescription>{t('تحديد سعر صرف العملات.', 'Set currency exchange rates.')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="usd-rate">{t('سعر صرف الدولار الأمريكي (مقابل الليرة السورية)', 'USD Exchange Rate (vs. SYP)')}</Label>
                    <Input id="usd-rate" type="number" defaultValue="15000" />
                    </div>
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle>{t('إعدادات الطابعة', 'Printer Settings')}</CardTitle>
                    <CardDescription>{t('إدارة إعدادات طابعة الفواتير.', 'Manage invoice printer settings.')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                    <Label htmlFor="printer-name">{t('اسم الطابعة', 'Printer Name')}</Label>
                    <Input id="printer-name" defaultValue="POS-80C" />
                    </div>
                    <Button variant="outline">{t('اختبار الطباعة', 'Test Print')}</Button>
                </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('رموز QR للطاولات', 'Table QR Codes')}</CardTitle>
                        <CardDescription>{t('إنشاء وطباعة رموز QR لتوجيه الزبائن إلى قائمة الطعام الرقمية لكل طاولة.', 'Generate and print QR codes to direct customers to the digital menu for each table.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QrCodeGenerator />
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </main>
  );
}
