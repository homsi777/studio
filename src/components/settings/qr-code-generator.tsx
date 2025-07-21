

"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode, Printer, Building, Phone } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { AnimatePresence, motion } from 'framer-motion';
import { useRestaurantSettings } from '@/hooks/use-restaurant-settings';

interface QrCodeInfo {
    url: string;
    title: string;
}

export function QrCodeGenerator() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
    const { settings } = useRestaurantSettings();
    
    const [tableCount, setTableCount] = useState<string>(settings.numberOfTables.toString());
    const [baseUrl, setBaseUrl] = useState('');
    const [generatedCodes, setGeneratedCodes] = useState<QrCodeInfo[]>([]);
    const [isClient, setIsClient] = useState(false);
    
    const printAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
            setIsClient(true);
        }
    }, []);

     useEffect(() => {
        // Update table count when settings change
        setTableCount(settings.numberOfTables.toString());
    }, [settings.numberOfTables]);


    const handleGenerate = () => {
        const count = parseInt(tableCount, 10);
        if (isNaN(count) || count <= 0) {
            setGeneratedCodes([]);
            return;
        }

        const codes: QrCodeInfo[] = Array.from({ length: count }, (_, i) => {
            const tableId = i + 1;
            const path = `/menu/${tableId}`;
            const fullUrl = `${baseUrl}${path}`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fullUrl)}`;
            return {
                url: qrApiUrl,
                title: `${t('الطاولة', 'Table')} ${tableId}`
            };
        });
        setGeneratedCodes(codes);
    };
    
    const handlePrint = () => {
        const printContent = printAreaRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print QR Codes</title>');
            printWindow.document.write('<style>@import url("https://fonts.googleapis.com/css2?family=Alegreya:wght@700&family=Belleza&display=swap"); @page { size: A4; margin: 20mm; } body { font-family: "Alegreya", serif; } .qr-page { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px 20px; } .qr-card { text-align: center; border: 2px solid #ddd; padding: 20px; border-radius: 15px; break-inside: avoid; } img { max-width: 100%; height: auto; } h2 { font-family: "Belleza", sans-serif; font-size: 28px; margin-bottom: 5px; } h3 { font-size: 22px; margin-top: 0; margin-bottom: 20px; } .footer { margin-top: 15px; font-size: 14px; } </style>');
            printWindow.document.write('</head><body><div class="qr-page">');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</div></body></html>');
            printWindow.document.close();
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
            }, 500);
        }
    };
    
    if (!isClient) {
        return <div className="h-64 bg-muted rounded-md animate-pulse"></div>;
    }

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="table-count" className="font-bold">{t('1. حدد عدد الطاولات للطباعة', '1. Specify number of tables to print')}</Label>
                    <Input 
                        id="table-count" 
                        type="number" 
                        value={tableCount}
                        onChange={(e) => setTableCount(e.target.value)}
                        min="1"
                        placeholder={t('أدخل عدد الطاولات...', 'Enter number of tables...')}
                    />
                </div>
            </div>

            <Button onClick={handleGenerate} className="w-full" disabled={!baseUrl || !tableCount}>
                <QrCode className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('توليد الرموز', 'Generate Codes')}
            </Button>

            <AnimatePresence>
            {generatedCodes.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 text-center"
                >
                    <div ref={printAreaRef} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {generatedCodes.map((code, index) => (
                             <div key={index} className="qr-card border rounded-lg p-4 space-y-2">
                                <h2>{settings.restaurantName}</h2>
                                <h3>{code.title}</h3>
                                <img src={code.url} alt={`QR Code for ${code.title}`} className="w-full h-auto mx-auto rounded-md" />
                                <div className='footer text-xs'>
                                    <p className="flex items-center justify-center gap-1"><Building className="w-3 h-3"/> {settings.address}</p>
                                    <p className="flex items-center justify-center gap-1"><Phone className="w-3 h-3"/> {settings.phone}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handlePrint} variant="outline" className="w-full">
                        <Printer className="ltr:mr-2 rtl:ml-2 h-4 w-4"/>
                        {t('طباعة كل الرموز', 'Print All Codes')}
                    </Button>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
