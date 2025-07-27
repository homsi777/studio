// src/app/settings/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { useOrderFlow } from '@/hooks/use-order-flow';
import { useRestaurantSettings } from '@/hooks/use-restaurant-settings';
import { fetchExchangeRate } from '@/ai/flows/exchange-rate-flow';
import { Table as TableType } from '@/types';
import { QrCodeGenerator } from '@/components/settings/qr-code-generator';
import { UserManagement } from '@/components/settings/user-management';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import { Loader2, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
    const { language, t } = useLanguage();
    const { tables, loading: orderFlowLoading, fetchAllData, addTable, deleteTableByUuid } = useOrderFlow();
    const { settings, setSettings, saveSettings } = useRestaurantSettings();

    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]); // Placeholder for user data
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [numberOfTables, setNumberOfTables] = useState(0);
    const [isUpdatingTables, setIsUpdatingTables] = useState(false);
    const [isUpdatingRate, setIsUpdatingRate] = useState(false);

    useEffect(() => {
        setIsLoading(orderFlowLoading);
        if (!orderFlowLoading) {
            setNumberOfTables(tables.length);
        }
    }, [orderFlowLoading, tables]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const res = await fetch('/api/v1/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data.users || []);
        } catch (error) {
            toast.error(t('فشل جلب المستخدمين', 'Failed to fetch users'));
            console.error(error);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveSettings = () => {
        saveSettings(settings);
        toast.success(t('تم حفظ الإعدادات بنجاح!', 'Settings saved successfully!'));
    };

    const handleUpdateExchangeRate = async () => {
        setIsUpdatingRate(true);
        try {
            const rate = await fetchExchangeRate();
            setSettings(prev => ({ ...prev, currencyExchangeRate: rate, lastExchangeRateUpdate: new Date().toISOString() }));
            toast.success(`${t('تم تحديث سعر الصرف:', 'Exchange rate updated:')} ${rate}`);
        } catch (error) {
            console.error(error);
            toast.error(t('فشل تحديث سعر الصرف.', 'Failed to update exchange rate.'));
        } finally {
            setIsUpdatingRate(false);
        }
    };

    useEffect(() => {
        // Automatically save settings when exchange rate is updated
        if (settings.currencyExchangeRate !== null) {
            saveSettings(settings);
        }
    }, [settings, saveSettings]);

    const handleSetTableCount = async () => {
        setIsUpdatingTables(true);
        const currentCount = tables.length;
        const desiredCount = Number(numberOfTables);

        if (isNaN(desiredCount) || desiredCount < 0 || desiredCount > 200) {
            toast.error(t('الرجاء إدخال رقم صحيح بين 0 و 200.', 'Please enter a valid number between 0 and 200.'));
            setIsUpdatingTables(false);
            return;
        }

        try {
            if (desiredCount > currentCount) {
                // Add tables
                const tablesToAdd = desiredCount - currentCount;
                for (let i = 0; i < tablesToAdd; i++) {
                    await addTable();
                }
            } else if (desiredCount < currentCount) {
                // Remove tables
                const tablesToRemove = currentCount - desiredCount;
                const tablesToDelete = tables.slice(-tablesToRemove);
                for (const table of tablesToDelete) {
                    await deleteTableByUuid(table.uuid);
                }
            }
            toast.success(`${t('تم تحديث عدد الطاولات إلى', 'Table count updated to')} ${desiredCount}`);
            await fetchAllData(true); // Force refetch from server to get latest state
        } catch (error) {
            console.error("Failed to update table count", error);
            toast.error(t('حدث خطأ أثناء تحديث عدد الطاولات.', 'An error occurred while updating table count.'));
        } finally {
            setIsUpdatingTables(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[calc(100vh-200px)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <main className="flex-1 p-4 sm:p-6 space-y-6">
            <h1 className="font-headline text-3xl font-bold text-foreground">{t('الإعدادات', 'Settings')}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('إعدادات المطعم العامة', 'General Restaurant Settings')}</CardTitle>
                            <CardDescription>{t('إدارة المعلومات الأساسية لمطعمك.', 'Manage the basic information for your restaurant.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="restaurantName">{t('اسم المطعم', 'Restaurant Name')}</Label>
                                    <Input id="restaurantName" name="restaurantName" value={settings.restaurantName} onChange={handleSettingsChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t('رقم الهاتف', 'Phone Number')}</Label>
                                    <Input id="phone" name="phone" value={settings.phone} onChange={handleSettingsChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">{t('العنوان', 'Address')}</Label>
                                <Input id="address" name="address" value={settings.address} onChange={handleSettingsChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('البريد الإلكتروني', 'Email')}</Label>
                                <Input id="email" name="email" type="email" value={settings.email} onChange={handleSettingsChange} />
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>{t('إدارة الطاولات', 'Table Management')}</CardTitle>
                            <CardDescription>{t('تحديد العدد الإجمالي للطاولات المتاحة في المطعم.', 'Set the total number of tables available in the restaurant.')}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-end gap-4">
                            <div className="flex-grow space-y-2">
                                <Label htmlFor="table-count">{t('العدد الإجمالي للطاولات', 'Total Number of Tables')}</Label>
                                <Input
                                    id="table-count"
                                    type="number"
                                    value={numberOfTables}
                                    onChange={(e) => setNumberOfTables(parseInt(e.target.value, 10))}
                                    min="0"
                                />
                            </div>
                            <Button onClick={handleSetTableCount} disabled={isUpdatingTables}>
                                {isUpdatingTables && <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />}
                                {t('تحديث العدد', 'Update Count')}
                            </Button>
                        </CardContent>
                    </Card>

                    <UserManagement users={users} isLoading={loadingUsers} onUserChange={fetchUsers} />

                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('مولد رموز QR', 'QR Code Generator')}</CardTitle>
                            <CardDescription>{t('إنشاء رموز QR للطاولات أو لوصول الموظفين السريع.', 'Create QR codes for tables or for quick staff access.')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QrCodeGenerator tables={tables} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('إعدادات العملة', 'Currency Settings')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>{t('سعر صرف الدولار الأمريكي (USD)', 'USD Exchange Rate')}</Label>
                                <div className="flex items-center gap-2">
                                    <Input value={settings.currencyExchangeRate || ''} readOnly disabled />
                                    <Button variant="outline" size="icon" onClick={handleUpdateExchangeRate} disabled={isUpdatingRate}>
                                        {isUpdatingRate ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {settings.lastExchangeRateUpdate && (
                                    <p className="text-xs text-muted-foreground">
                                        {t('آخر تحديث:', 'Last updated:')} {new Date(settings.lastExchangeRateUpdate).toLocaleString(language)}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <Button onClick={handleSaveSettings} size="lg">{t('حفظ كل الإعدادات', 'Save All Settings')}</Button>
            </div>
        </main>
    );
}
