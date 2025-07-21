
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QrCodeGenerator } from "@/components/settings/qr-code-generator";
import { UserManagement } from "@/components/settings/user-management";
import { useLanguage } from "@/hooks/use-language";
import { AuthGuard } from "@/components/auth-guard";
import { fetchExchangeRate } from "@/ai/flows/exchange-rate-flow";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";


function SettingsPage() {
  const { language } = useLanguage();
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const { toast } = useToast();
  
  const { settings, setSettings } = useRestaurantSettings();

  const [exchangeRate, setExchangeRate] = useState<number | null>(15000);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setSettings(prev => ({ 
        ...prev, 
        [id]: type === 'number' ? parseInt(value, 10) || 0 : value 
    }));
  }

  const handleFetchRate = async () => {
    setIsLoading(true);
    try {
      const rate = await fetchExchangeRate();
      setExchangeRate(rate);
      setLastUpdated(new Date());
      toast({
        title: t("تم التحديث بنجاح", "Update Successful"),
        description: t(`سعر الصرف الجديد هو ${rate} ل.س للدولار الواحد.`, `The new exchange rate is ${rate} SYP per USD.`),
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: t("فشل التحديث", "Update Failed"),
        description: t("لم نتمكن من جلب سعر الصرف. يرجى المحاولة مرة أخرى.", "Could not fetch the exchange rate. Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <main className="flex-1 p-4 sm:p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="font-headline text-2xl font-semibold">{t('الإعدادات', 'Settings')}</h1>
            <Button>{t('حفظ التغييرات', 'Save Changes')}</Button>
        </div>
        <Separator />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                      <CardTitle>{t('الإعدادات العامة', 'General Settings')}</CardTitle>
                      <CardDescription>{t('إدارة المعلومات الأساسية للمطعم.', 'Manage basic restaurant information.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="space-y-2">
                          <Label htmlFor="restaurantName">{t('اسم المطعم', 'Restaurant Name')}</Label>
                          <Input id="restaurantName" value={settings.restaurantName} onChange={handleSettingsChange} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="address">{t('العنوان', 'Address')}</Label>
                          <Input id="address" value={settings.address} onChange={handleSettingsChange} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <Label htmlFor="phone">{t('رقم الهاتف', 'Phone Number')}</Label>
                              <Input id="phone" value={settings.phone} onChange={handleSettingsChange} dir="ltr" className="text-left"/>
                          </div>
                           <div className="space-y-2">
                              <Label htmlFor="email">{t('البريد الإلكتروني (اختياري)', 'Email (Optional)')}</Label>
                              <Input id="email" type="email" value={settings.email} onChange={handleSettingsChange} dir="ltr" className="text-left"/>
                          </div>
                      </div>
                  </CardContent>
                </Card>
                
                <UserManagement />

                <Card>
                <CardHeader>
                    <CardTitle>{t('إعدادات الطابعات', 'Printers Settings')}</CardTitle>
                    <CardDescription>{t('إدارة إعدادات طابعات التقارير والفواتير.', 'Manage settings for report and receipt printers.')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="printer-a4">{t('طابعة التقارير (A4)', 'Reports Printer (A4)')}</Label>
                        <Input id="printer-a4" defaultValue="Microsoft Print to PDF" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="printer-thermal">{t('طابعة الفواتير (حرارية 80مم)', 'Receipt Printer (80mm Thermal)')}</Label>
                        <Input id="printer-thermal" defaultValue="POS-80C" />
                    </div>
                    <Button variant="outline">{t('اختبار الطباعة', 'Test Print')}</Button>
                </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('رموز QR للطاولات', 'Table QR Codes')}</CardTitle>
                        <CardDescription>{t('إنشاء وطباعة رموز QR لتوجيه الزبائن إلى قائمة الطعام الرقمية لكل طاولة.', 'Generate and print QR codes to direct customers to the digital menu for each table.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <QrCodeGenerator />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('إدارة الطاولات', 'Table Management')}</CardTitle>
                        <CardDescription>{t('تحديد العدد الإجمالي للطاولات في المطعم.', 'Set the total number of tables in the restaurant.')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Label htmlFor="numberOfTables">{t('عدد الطاولات', 'Number of Tables')}</Label>
                        <Input id="numberOfTables" type="number" value={settings.numberOfTables} onChange={handleSettingsChange} min="1"/>
                    </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                      <CardTitle>{t('إعدادات العملة', 'Currency Settings')}</CardTitle>
                      <CardDescription>{t('جلب آخر سعر صرف للدولار الأمريكي تلقائياً.', 'Automatically fetch the latest USD exchange rate.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="usd-rate">{t('السعر الحالي (ل.س لكل 1$)', 'Current Rate (SYP per 1 USD)')}</Label>
                          <Input id="usd-rate" type="number" value={exchangeRate ?? ""} readOnly disabled />
                        </div>
                        <Button onClick={handleFetchRate} disabled={isLoading} variant="outline" size="icon">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            <span className="sr-only">Refresh</span>
                        </Button>
                      </div>
                      {lastUpdated && (
                        <p className="text-xs text-muted-foreground">
                          {t("آخر تحديث:", "Last updated:")} {lastUpdated.toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}
                        </p>
                      )}
                  </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </main>
  );
}

export default function GuardedSettingsPage() {
    return (
        <AuthGuard>
            <SettingsPage />
        </AuthGuard>
    )
}
