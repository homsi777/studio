"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { QrCodeGenerator } from "@/components/settings/qr-code-generator";
import { UserManagement } from "@/components/settings/user-management";
import { useLanguage } from "@/hooks/use-language";
import { AuthGuard } from "@/components/auth-guard";
import { fetchExchangeRate } from "@/ai/flows/exchange-rate-flow"; // تأكد من أن هذا المسار صحيح
import { Loader2, RefreshCw, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings"; // تأكد من أن هذا المسار صحيح
import type { User } from '@/types'; // تأكد من أن هذا المسار صحيح وأن User type معرف بشكل سليم
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to handle API responses and throw errors with details
// تم تعريفها خارج المكون لتجنب إعادة الإنشاء في كل Render
async function handleApiResponse(response: Response, errorMessage: string): Promise<any> {
    if (!response.ok) {
        const errorDetail = await response.text();
        console.error("API Response Error:", response.status, errorDetail);
        // Include status and a snippet of the errorDetail for the toast message
        throw new Error(`${errorMessage} (${response.status}): ${errorDetail.substring(0, 150)}${errorDetail.length > 150 ? '...' : ''}`);
    }
    return response.json();
}

function SettingsPage() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
    const { toast } = useToast();

    // استخدم هوك الإعدادات لجلب وحفظ إعدادات المطعم
    const { settings, setSettings, saveSettings } = useRestaurantSettings();

    // حالة لسعر الصرف
    const [exchangeRate, setExchangeRate] = useState<number | null>(settings.currencyExchangeRate || null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(settings.lastExchangeRateUpdate ? new Date(settings.lastExchangeRateUpdate) : null);
    const [isLoadingRate, setIsLoadingRate] = useState(false);

    // حالة للمستخدمين والطاولات
    const [users, setUsers] = useState<User[]>([]);
    const [tables, setTables] = useState<{ id: number; uuid: string }[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingTables, setIsLoadingTables] = useState(true);
    const [isTableUpdating, setIsTableUpdating] = useState(false);

    // جلب المستخدمين
    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const usersRes = await fetch('/api/v1/users');
            const usersData = await handleApiResponse(usersRes, t('لم نتمكن من جلب قائمة المستخدمين.', 'Could not fetch the user list.'));
            console.log("Users fetched successfully:", usersData);
            setUsers(usersData);
        } catch (err: any) {
            console.error("Error in fetchUsers:", err);
            toast({ variant: 'destructive', title: t('خطأ', 'Error'), description: err.message });
        } finally {
            setIsLoadingUsers(false);
        }
    }, [t, toast]);

    // جلب الطاولات
    const fetchTables = useCallback(async () => {
        setIsLoadingTables(true);
        try {
            const tablesRes = await fetch('/api/v1/tables');
            const tablesData = await handleApiResponse(tablesRes, t('لم نتمكن من جلب عدد الطاولات', 'Could not fetch table count'));
            console.log("Tables fetched successfully:", tablesData);
            setTables(tablesData);
        } catch (err: any) {
            console.error("Error in fetchTables:", err);
            toast({ variant: 'destructive', title: t('خطأ', 'Error'), description: err.message });
        } finally {
            setIsLoadingTables(false);
        }
    }, [t, toast]);

    // جلب البيانات عند تحميل المكون
    useEffect(() => {
        fetchUsers();
        fetchTables();
    }, [fetchUsers, fetchTables]);

    // مزامنة حالة سعر الصرف الأولية مع الإعدادات المحفوظة
    useEffect(() => {
        if (settings.currencyExchangeRate) {
            setExchangeRate(settings.currencyExchangeRate);
        }
        if (settings.lastExchangeRateUpdate) {
            setLastUpdated(new Date(settings.lastExchangeRateUpdate));
        }
    }, [settings.currencyExchangeRate, settings.lastExchangeRateUpdate]);

    // تحديث الإعدادات المحلية عند تغيير حقول الإدخال
    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [id]: value
        }));
    }

    // إضافة طاولة جديدة
    const handleAddTable = async () => {
        setIsTableUpdating(true);
        try {
            const response = await fetch('/api/v1/tables', { method: 'POST' });
            await handleApiResponse(response, t('فشل إضافة طاولة', 'Failed to add table'));
            await fetchTables(); // إعادة جلب بيانات الطاولات بعد الإضافة
            toast({ title: t('تمت الإضافة', 'Table Added'), description: t('تمت إضافة طاولة جديدة بنجاح.', 'A new table has been added successfully.') });
        } catch (error: any) {
            console.error("Error adding table:", error);
            toast({ variant: 'destructive', title: t('خطأ', 'Error'), description: error.message });
        } finally {
            setIsTableUpdating(false);
        }
    };

    // حذف آخر طاولة
    const handleDeleteLastTable = async () => {
        if (tables.length <= 0) return; // لا تحاول الحذف إذا لم تكن هناك طاولات
        setIsTableUpdating(true);
        try {
            const response = await fetch('/api/v1/tables', { method: 'DELETE' });
            await handleApiResponse(response, t('فشل حذف طاولة', 'Failed to delete table'));
            await fetchTables(); // إعادة جلب بيانات الطاولات بعد الحذف
            toast({ title: t('تم الحذف', 'Table Deleted'), description: t('تم حذف آخر طاولة بنجاح.', 'The last table has been deleted successfully.') });
        } catch (error: any) {
            console.error("Error deleting table:", error);
            toast({ variant: 'destructive', title: t('خطأ', 'Error'), description: error.message });
        } finally {
            setIsTableUpdating(false);
        }
    }

    // جلب سعر الصرف
    const handleFetchRate = async () => {
        setIsLoadingRate(true);
        try {
            const rate = await fetchExchangeRate();
            setExchangeRate(rate);
            const now = new Date();
            setLastUpdated(now);
            // تحديث الإعدادات المحفوظة أيضاً
            setSettings(prev => ({
                ...prev,
                currencyExchangeRate: rate,
                lastExchangeRateUpdate: now.toISOString() // حفظ التاريخ كـ ISO string
            }));
            toast({
                title: t("تم التحديث بنجاح", "Update Successful"),
                description: t(`سعر الصرف الجديد هو ${rate} ل.س للدولار الواحد.`, `The new exchange rate is ${rate} SYP per USD.`),
            });
        } catch (error: any) {
            console.error("Error fetching exchange rate:", error);
            toast({
                variant: "destructive",
                title: t("فشل التحديث", "Update Failed"),
                description: t("لم نتمكن من جلب سعر الصرف. يرجى المحاولة مرة أخرى.", "Could not fetch the exchange rate. Please try again.") + (error.message ? `: ${error.message}` : ''),
            });
        } finally {
            setIsLoadingRate(false);
        }
    };

    // حفظ جميع إعدادات المطعم (مثل الاسم، العنوان، الهاتف، الإيميل)
    const handleSaveRestaurantSettings = async () => {
        // إذا كان لديك API لحفظ هذه الإعدادات، يجب أن تستدعيها هنا
        // حالياً، hook 'useRestaurantSettings' يقوم بحفظها في localStorage
        // لذا هنا فقط نعرض رسالة النجاح
        saveSettings(); // استدعاء دالة الحفظ من الهوك
        toast({
            title: t("تم الحفظ", "Settings Saved"),
            description: t("تم حفظ التغييرات بنجاح.", "Your changes have been saved successfully."),
        });
    }

    return (
        <main className="flex-1 p-4 sm:p-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h1 className="font-headline text-3xl font-bold">{t('الإعدادات', 'Settings')}</h1>
                    <Button onClick={handleSaveRestaurantSettings}>{t('حفظ التغييرات', 'Save Changes')}</Button>
                </div>
                <Separator />

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* General Settings */}
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
                                        <Input id="phone" value={settings.phone} onChange={handleSettingsChange} dir="ltr" className="text-left" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">{t('البريد الإلكتروني (اختياري)', 'Email (Optional)')}</Label>
                                        <Input id="email" type="email" value={settings.email} onChange={handleSettingsChange} dir="ltr" className="text-left" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* User Management */}
                        <UserManagement
                            users={users}
                            isLoading={isLoadingUsers}
                            onUserChange={fetchUsers} // تمرير دالة الجلب كـ callback
                        />

                        {/* Printers Settings */}
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

                    {/* Right Column: QR Codes, Table Management, Currency Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* QR Codes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('رموز QR للطاولات', 'Table QR Codes')}</CardTitle>
                                <CardDescription>{t('إنشاء وطباعة رموز QR لتوجيه الزبائن إلى قائمة الطعام الرقمية لكل طاولة.', 'Generate and print QR codes to direct customers to the digital menu for each table.')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingTables ? (
                                    <Skeleton className="h-48 w-full" />
                                ) : (
                                    <QrCodeGenerator tables={tables} />
                                )}
                            </CardContent>
                        </Card>

                        {/* Table Management */}
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('إدارة الطاولات', 'Table Management')}</CardTitle>
                                <CardDescription>{t('تحديد العدد الإجمالي للطاولات في المطعم.', 'Set the total number of tables in the restaurant.')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Label htmlFor="numberOfTables">{t('العدد الحالي للطاولات', 'Current Number of Tables')}</Label>
                                {isLoadingTables ? (
                                    <Skeleton className="h-10 w-full" />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="outline" onClick={handleDeleteLastTable} disabled={tables.length <= 0 || isTableUpdating}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <div className="relative flex-1">
                                            <Input id="numberOfTables" type="number" value={tables.length} readOnly className="text-center font-bold" />
                                            {isTableUpdating && <div className="absolute inset-0 flex items-center justify-center bg-background/80"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>}
                                        </div>
                                        <Button size="icon" variant="outline" onClick={handleAddTable} disabled={isTableUpdating}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Currency Settings */}
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
                                    <Button onClick={handleFetchRate} disabled={isLoadingRate} variant="outline" size="icon">
                                        {isLoadingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
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