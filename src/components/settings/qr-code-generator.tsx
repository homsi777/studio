

"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QrCode, Printer, ChefHat, User, Laptop } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { AnimatePresence, motion } from 'framer-motion';
import { useRestaurantSettings } from '@/hooks/use-restaurant-settings';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';

type QrTarget = 'customer' | 'chef' | 'cashier';

interface GeneratedCode {
    url: string;
    title: string;
    path: string;
}

// Mock function to generate UUIDs
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


export function QrCodeGenerator() {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
    const { settings } = useRestaurantSettings();
    const { toast } = useToast();
    
    const [target, setTarget] = useState<QrTarget>('customer');
    const [tableNumber, setTableNumber] = useState('');
    const [validationError, setValidationError] = useState('');
    const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [isClient, setIsClient] = useState(false);
    
    const printAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
            setIsClient(true);
        }
    }, []);

    useEffect(() => {
        setGeneratedCode(null);
        validateTableNumber(tableNumber);
    }, [target, tableNumber]);


    const validateTableNumber = (value: string) => {
        if (target !== 'customer' || !value) {
            setValidationError('');
            return true;
        }
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
            setValidationError(t('الرجاء إدخال رقم طاولة صحيح.', 'Please enter a valid table number.'));
            return false;
        }
        if (num > settings.numberOfTables) {
            setValidationError(t(`رقم الطاولة يجب أن لا يتجاوز ${settings.numberOfTables}.`, `Table number cannot exceed ${settings.numberOfTables}.`));
            return false;
        }
        setValidationError('');
        return true;
    }

    const generateQRCode = async () => {
        if (target === 'customer' && !validateTableNumber(tableNumber)) {
             toast({
                variant: "destructive",
                title: t("خطأ في التحقق", "Validation Error"),
                description: validationError,
            });
            return;
        }

        let path = '';
        let title = '';

        // This simulates the backend generating a secure URL with a UUID
        // In a real app, this would be an API call.
        const simulateBackendUrlGeneration = (target: QrTarget, tableNumber?: string): {path: string, title: string} => {
            switch(target) {
                case 'customer':
                    if (!tableNumber) return {path: '', title: ''};
                    // Backend would associate this UUID with the table number
                    const tableUuid = generateUUID(); 
                    return {
                        path: `/menu/${tableUuid}`,
                        title: `${t('الطاولة', 'Table')} ${tableNumber}`
                    }
                case 'chef':
                    return { path: '/chef', title: t('واجهة الشيف', 'Chef Interface') };
                case 'cashier':
                    return { path: '/pos', title: t('نقطة البيع السريعة', 'Quick POS') };
                default:
                    return {path: '', title: ''};
            }
        }
        
        const { path: securePath, title: codeTitle } = simulateBackendUrlGeneration(target, tableNumber);
        
        if (!securePath) return;

        const fullUrl = `${baseUrl}${securePath}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fullUrl)}`;
        
        setGeneratedCode({ url: qrApiUrl, title: codeTitle, path: securePath });
    };
    
    const handlePrint = () => {
        const printContent = printAreaRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print QR Code</title>');
            printWindow.document.write('<style>@page { size: 10cm 10cm; margin: 0; } body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; font-family: sans-serif; text-align: center; } img { max-width: 80%; height: auto; } h2, h3 { margin: 0; } h2 { font-size: 1.5rem; } h3 { font-size: 1.2rem; font-weight: 500; margin-bottom: 1rem; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(`<h2>${settings.restaurantName}</h2>`);
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

    const isGenerateDisabled = !baseUrl || (target === 'customer' && (!tableNumber || !!validationError));

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div>
                    <Label className="font-bold">{t('1. لمن موجه رمز QR؟', '1. Who is the QR code for?')}</Label>
                    <RadioGroup value={target} onValueChange={(value: QrTarget) => setTarget(value)} className="mt-2 grid grid-cols-3 gap-2">
                        {[
                            { value: 'customer', label: t('للزبون', 'Customer'), icon: <User/> },
                            { value: 'chef', label: t('للشيف', 'Chef'), icon: <ChefHat /> },
                            { value: 'cashier', label: t('للكاشير', 'Cashier'), icon: <Laptop /> }
                        ].map(item => (
                             <Label key={item.value} htmlFor={item.value} className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 p-3 cursor-pointer hover:bg-accent/50 ${target === item.value ? 'border-primary bg-primary/10' : ''}`}>
                                <RadioGroupItem value={item.value} id={item.value} className="sr-only"/>
                                {item.icon}
                                <span className="text-sm font-semibold">{item.label}</span>
                            </Label>
                        ))}
                    </RadioGroup>
                </div>
                
                <AnimatePresence>
                    {target === 'customer' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                        >
                            <Label htmlFor="table-number" className="font-bold">{t('2. حدد رقم الطاولة', '2. Specify Table Number')}</Label>
                            <Input 
                                id="table-number" 
                                type="number" 
                                value={tableNumber}
                                onChange={(e) => setTableNumber(e.target.value)}
                                placeholder={t('أدخل رقم الطاولة...', 'Enter table number...')}
                                required={target === 'customer'}
                                max={settings.numberOfTables}
                                min="1"
                            />
                             {validationError && (
                                <Alert variant="destructive" className="p-2 text-xs flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        {validationError}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Button onClick={generateQRCode} className="w-full" disabled={isGenerateDisabled}>
                <QrCode className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                {t('توليد الرمز', 'Generate Code')}
            </Button>

            <AnimatePresence>
            {generatedCode && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4 text-center"
                >
                    <div ref={printAreaRef} className="border rounded-lg p-4 space-y-2">
                        <h3 className="font-headline text-lg">{generatedCode.title}</h3>
                        <img src={generatedCode.url} alt={`QR Code for ${generatedCode.title}`} className="w-48 h-48 mx-auto rounded-md" />
                    </div>
                    <Button onClick={handlePrint} variant="outline" className="w-full">
                        <Printer className="ltr:mr-2 rtl:ml-2 h-4 w-4"/>
                        {t('طباعة الرمز', 'Print Code')}
                    </Button>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
