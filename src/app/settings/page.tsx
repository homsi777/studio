
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
import { fetchExchangeRate } from "@/ai/flows/exchange-rate-flow";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRestaurantSettings, type RestaurantSettings } from '@/hooks/use-restaurant-settings';
import type { User, Table } from '@/types';
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to handle API responses and throw errors with details
async function handleApiResponse(response: Response, errorMessage: string): Promise<any> {
    if (!response.ok) {
        let errorDetail = 'Could not retrieve error details.';
        try {
            errorDetail = await response.text();
        } catch(e) {
            // Ignore if can't parse body
        }
        console.error("API Response Error:", response.status, errorDetail);
        throw new Error(`${errorMessage} (Status: ${response.status})`);
    }
    if (response.status === 204) return null; // Handle no content response
    return response.json();
}

function SettingsPage() {
    const { language } = useLanguage();
    const t = useCallback((ar: string, en: string) => (language === 'ar' ? ar : en), [language]);
    const { toast } = useToast();

    // Use settings hook to fetch and save restaurant settings
    const { settings, setSettings, saveSettings } = useRestaurantSettings();

    // State for users and tables
    const [users, setUsers] = useState<User[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [desiredTableCount, setDesiredTableCount] = useState<number | string>("");
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [isLoadingTables, setIsLoadingTables] = useState(true);
    const [isTableUpdating, setIsTableUpdating] = useState(false);
    const [isLoadingRate, setIsLoadingRate] = useState(false);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setIsLoadingUsers(true);
        try {
            const usersRes = await fetch('/api/v1/users');
            const usersData = await handleApiResponse(usersRes, t('لم نتمكن من جلب قائمة المستخدمين.', 'Could not fetch the user list.'));
            setUsers(usersData);
        } catch (err: any) {
            console.error("Error in fetchUsers:", err);
            toast({ variant: 'destructive', title: t('خطأ', 'Error'), description: err.message });
        } finally {
            setIsLoadingUsers(false);
        }
    }, [t, toast]);

    // Fetch tables
    const fetchTables = useCallback(async () => {
        setIsLoadingTables(true);
        try {
            const tablesRes = await fetch('/api/v1/tables');
            const tablesData = await handleApiResponse(tablesRes, t('لم نتمكن من جلب عدد الطاولات', 'Could not fetch table count'));
            setTables(tablesData);
            setDesiredTableCount(tablesData.length);
        } catch (err: any) {
            console.error("Error in fetchTables:", err);
            toast({ variant: 'destructive', title: t('خطأ', 'Error'), description: err.message });
        } finally {
            setIsLoadingTables(false);
        }
    }, [t, toast]);

    // Fetch data on component mount
    useEffect(() => {
        fetchUsers();
        fetchTables();
    }, [fetchUsers, fetchTables]);

    // Update local settings on input change
    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings((prev: RestaurantSettings) => ({
            ...prev,
            [id]: value
        }));
    }

    const handleSetTableCount = async () => {
        const count = Number(desiredTableCount);
        if (isNaN(count) || count < 0 || count > 200) {
             toast({ variant: 'destructive', title: t('خطأ', 'Error'), description: t('الرجاء إدخال رقم صالح بين 0 و 200.', 'Please enter a valid number between 0 and 200.') });
             return;
        }

        setIsTableUpdating(true);
        try {
            const response = await fetch('/api/v1/tables/set-count', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count }),
            });
            await handleApiResponse(response, t('فشل تحديث عدد الطاولات', 'Failed to update table count'));
            await fetchTables(); // Refetch to get the latest state
            toast({ title: t('تم تحديث الطاولات', 'Tables Updated'), description: t(`تم تحديد عدد الطاولات بنجاح إلى ${count}.`, `Table count successfully set to ${count}.`) });
        } catch (error: any) {
             console.error("Error setting table count:", error);
             toast({ variant: 'destructive', title: t('خطأ', 'Error'), description: error.message });
        } finally {
            setIsTableUpdating(false);
        }
    };
    
    // Fetch exchange rate and then save
    const handleFetchRate = async () => {
        setIsLoadingRate(true);
        try {
            const rate = await fetchExchangeRate();
            const now = new Date();
            const newSettings: Partial<RestaurantSettings> = {
                currencyExchangeRate: rate,
                lastExchangeRateUpdate: now.toISOString()
            };
            setSettings(prev => ({
                ...prev,
                ...newSettings
            }));
            saveSettings({ ...settings, ...newSettings }); // Save the updated settings immediately
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

    // Save all restaurant settings
    const handleSaveRestaurantSettings = () => {
        saveSettings(settings); // Pass the current settings object
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
                            onUserChange={fetchUsers}
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
                                <Label htmlFor="numberOfTables">{t('العدد المطلوب للطاولات', 'Desired Number of Tables')}</Label>
                                {isLoadingTables ? (
                                    <Skeleton className="h-20 w-full" />
                                ) : (
                                    <div className="space-y-2">
                                        <Input 
                                            id="numberOfTables" 
                                            type="number" 
                                            value={desiredTableCount} 
                                            onChange={(e) => setDesiredTableCount(e.target.value)}
                                            className="text-center font-bold"
                                            placeholder={t('أدخل العدد هنا', 'Enter count here')}
                                        />
                                        <Button onClick={handleSetTableCount} disabled={isTableUpdating} className="w-full">
                                            {isTableUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : t('تحديث عدد الطاولات', 'Update Table Count')}
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
                                        <Input id="usd-rate" type="number" value={settings.currencyExchangeRate ?? ""} readOnly disabled />
                                    </div>
                                    <Button onClick={handleFetchRate} disabled={isLoadingRate} variant="outline" size="icon">
                                        {isLoadingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                        <span className="sr-only">Refresh</span>
                                    </Button>
                                </div>
                                {settings.lastExchangeRateUpdate && (
                                    <p className="text-xs text-muted-foreground">
                                        {t("آخر تحديث:", "Last updated:")} {new Date(settings.lastExchangeRateUpdate).toLocaleString(language === 'ar' ? 'ar-SY' : 'en-US')}
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
