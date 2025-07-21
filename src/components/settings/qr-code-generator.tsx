
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Printer, Building, Phone } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AnimatePresence, motion } from 'framer-motion';
import { useRestaurantSettings } from '@/hooks/use-restaurant-settings';

type TargetType = 'customer' | 'chef' | 'pos';

export function QrCodeGenerator() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
    const { settings } = useRestaurantSettings();
    
    const [target, setTarget] = useState<TargetType>('customer');
    const [tableNumber, setTableNumber] = useState<string>('1');
    const [baseUrl, setBaseUrl] = useState('');
    const [generatedQrUrl, setGeneratedQrUrl] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    
    const qrImageRef = useRef<HTMLImageElement>(null);
    const printAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
            setIsClient(true);
        }
    }, []);

    const handleGenerate = () => {
        let path = '';
        switch(target) {
            case 'customer':
                if (!tableNumber) return;
                path = `/menu/${tableNumber}`;
                break;
            case 'chef':
                path = '/chef';
                break;
            case 'pos':
                path = '/pos';
                break;
        }
        const fullUrl = `${baseUrl}${path}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fullUrl)}`;
        setGeneratedQrUrl(qrApiUrl);
    };
    
    const handlePrint = () => {
        const printContent = printAreaRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print QR Code</title>');
            printWindow.document.write('<style>@import url("https://fonts.googleapis.com/css2?family=Alegreya:wght@700&family=Belleza&display=swap"); body { font-family: "Alegreya", serif; text-align: center; padding-top: 50px; } .qr-card { border: 2px solid #ddd; padding: 20px; border-radius: 15px; max-width: 300px; margin: 20px auto; break-inside: avoid; } img { width: 250px; height: 250px; } h2 { font-family: "Belleza", sans-serif; font-size: 28px; margin-bottom: 5px; } h3 { font-size: 22px; margin-top: 0; margin-bottom: 20px; } .footer { margin-top: 15px; font-size: 14px; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');
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
                <Label className="font-bold">{t('1. لمن موجه رمز QR؟', '1. Who is this QR code for?')}</Label>
                <RadioGroup value={target} onValueChange={(value: TargetType) => setTarget(value)} className="flex gap-4">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <RadioGroupItem value="customer" id="r-customer" />
                        <Label htmlFor="r-customer">{t('للزبون', 'For Customer')}</Label>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <RadioGroupItem value="chef" id="r-chef" />
                        <Label htmlFor="r-chef">{t('للشيف', 'For Chef')}</Label>
                    </div>
                     <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <RadioGroupItem value="pos" id="r-pos" />
                        <Label htmlFor="r-pos">{t('للكاشير', 'For Cashier')}</Label>
                    </div>
                </RadioGroup>
            </div>

            <AnimatePresence>
                {target === 'customer' && (
                    <motion.div 
                        key="table-input"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="table-number" className="font-bold">{t('2. حدد رقم الطاولة', '2. Specify Table Number')}</Label>
                            <Input 
                                id="table-number" 
                                type="number" 
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                min="1"
                                placeholder={t('أدخل رقم الطاولة...', 'Enter table number...')}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button onClick={handleGenerate} className="w-full" disabled={!baseUrl || (target === 'customer' && !tableNumber)}>
                <QrCode className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('توليد الرمز', 'Generate Code')}
            </Button>

            <AnimatePresence>
            {generatedQrUrl && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 text-center"
                >
                    <div ref={printAreaRef}>
                        <div className="qr-card">
                             <h2>{settings.restaurantName}</h2>
                            <h3>
                                {target === 'customer' && `${t('الطاولة', 'Table')} ${tableNumber}`}
                                {target === 'chef' && t('واجهة الشيف', 'Chef Interface')}
                                {target === 'pos' && t('نقطة البيع', 'POS')}
                            </h3>
                            <img ref={qrImageRef} src={generatedQrUrl} alt="Generated QR Code" className="w-48 h-48 mx-auto rounded-md" />
                            <div className='footer'>
                                <p className="flex items-center justify-center gap-1 text-xs"><Building className="w-3 h-3"/> {settings.address}</p>
                                <p className="flex items-center justify-center gap-1 text-xs"><Phone className="w-3 h-3"/> {settings.phone}</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handlePrint} variant="outline" className="w-full">
                        <Printer className="ltr:mr-2 rtl:ml-2 h-4 w-4"/>
                        {t('طباعة', 'Print')}
                    </Button>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
