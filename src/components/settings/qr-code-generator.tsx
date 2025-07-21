"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

export function QrCodeGenerator() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);

    const [tableCount, setTableCount] = useState(12);
    const [baseUrl, setBaseUrl] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // This ensures the component has mounted on the client
        // and window object is available.
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
            setIsClient(true);
        }
    }, []);
    
    const generateQRCodes = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>QR Codes</title>');
            printWindow.document.write('<style>body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; padding: 20px; } .qr-card { page-break-inside: avoid; text-align: center; border: 1px solid #ccc; padding: 10px; border-radius: 8px; width: 150px; } img { width: 100px; height: 100px; margin: 10px auto; display: block; } h3 { margin: 0; font-size: 16px; font-weight: bold; }</style>');
            printWindow.document.write('</head><body>');
            for (let i = 1; i <= tableCount; i++) {
                const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/menu/${i}`)}`;
                printWindow.document.write(
                    `<div class="qr-card">
                        <h3>${t('الطاولة', 'Table')} ${i}</h3>
                        <img src="${url}" alt="QR Code for Table ${i}" />
                    </div>`
                );
            }
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            // Use a timeout to ensure images are loaded before printing
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);
        }
    };

    if (!isClient) {
        // Render a placeholder or nothing on the server to avoid hydration errors
        return <div className="h-24 bg-muted rounded-md animate-pulse"></div>;
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="table-count">{t('عدد الطاولات', 'Number of Tables')}</Label>
                <Input 
                    id="table-count" 
                    type="number" 
                    value={tableCount}
                    onChange={(e) => setTableCount(Number(e.target.value))}
                    min="1"
                    placeholder={t('أدخل عدد الطاولات...', 'Enter number of tables...')}
                />
            </div>
            <Button onClick={generateQRCodes} className="w-full" disabled={!baseUrl || tableCount < 1}>
                <QrCode className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('إنشاء وطباعة رموز QR', 'Generate & Print QR Codes')}
            </Button>
            <Card className="mt-4 bg-muted/40">
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                        {t('سيتم إنشاء رموز QR التي توجه إلى الرابط التالي:', 'QR codes will be generated pointing to the following URL:')}
                        <span dir="ltr" className="font-mono bg-background/50 rounded p-1 block text-center mt-2">
                            {baseUrl ? `${baseUrl}/menu/[${t('رقم_الطاولة', 'table_number')}]` : 'Loading...'}
                        </span>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
