
"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { QrCode, Printer, ChefHat, User, Laptop } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { AnimatePresence, motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Table } from '@/types';

type QrTarget = 'customer' | 'chef' | 'cashier';

interface GeneratedCode {
    url: string;
    title: string;
    path: string;
}

interface QrCodeGeneratorProps {
  tables: Table[];
}

export function QrCodeGenerator({ tables }: QrCodeGeneratorProps) {
    const { language } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const { toast } = useToast();
    
    const [target, setTarget] = useState<QrTarget>('customer');
    const [tableNumber, setTableNumber] = useState('1');
    const [validationError, setValidationError] = useState('');
    const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
    const [baseUrl, setBaseUrl] = useState('');
    const [isClient, setIsClient] = useState(false);
    const [isLoadingQr, setIsLoadingQr] = useState(false);
    
    const printAreaRef = useRef<HTMLDivElement>(null);
    
    const numberOfTables = useMemo(() => tables.length, [tables]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setBaseUrl(window.location.origin);
            setIsClient(true);
        }
    }, []);

    const validateTableNumber = (value: string) => {
        if (target !== 'customer') {
            setValidationError('');
            return true;
        }
        if (!value) {
            setValidationError(t('الرجاء إدخال رقم طاولة.', 'Please enter a table number.'));
            return false;
        }
        const num = parseInt(value, 10);
        if (isNaN(num) || num <= 0) {
            setValidationError(t('الرجاء إدخال رقم طاولة صحيح.', 'Please enter a valid table number.'));
            return false;
        }
        if (num > numberOfTables) {
            setValidationError(t(`رقم الطاولة يجب أن لا يتجاوز ${numberOfTables}.`, `Table number cannot exceed ${numberOfTables}.`));
            return false;
        }
        setValidationError('');
        return true;
    }

    useEffect(() => {
        setGeneratedCode(null);
        if (isClient) {
           validateTableNumber(tableNumber);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, tableNumber, numberOfTables, isClient, t]);


    const handleTableNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTableNumber(value);
        validateTableNumber(value);
    }

    const generateQRCode = async () => {
        setIsLoadingQr(true);
        if (target === 'customer' && !validateTableNumber(tableNumber)) {
             toast({
                variant: "destructive",
                title: t("خطأ في التحقق", "Validation Error"),
                description: validationError,
            });
            setIsLoadingQr(false);
            return;
        }

        let path = '';
        let title = '';

        try {
            switch(target) {
                case 'customer':
                    if (!tableNumber) return;
                    
                    const tableData = tables.find(t => t.id === parseInt(tableNumber, 10));

                    if (!tableData) {
                         toast({ variant: "destructive", title: "Error", description: `Could not find UUID for table ${tableNumber}`})
                         setIsLoadingQr(false);
                         return;
                    }
                    path = `/menu/${tableData.uuid}`;
                    title = `${t('الطاولة', 'Table')} ${tableNumber}`;
                    break;
                case 'chef':
                    path = '/chef';
                    title = t('واجهة الشيف', 'Chef Interface');
                    break;
                case 'cashier':
                    path = '/pos';
                    title = t('نقطة البيع السريعة', 'Quick POS');
                    break;
                default:
                     setIsLoadingQr(false);
                     return;
            }
        
            if (!path) {
                setIsLoadingQr(false);
                return;
            }

            const fullUrl = `${baseUrl}${path}`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fullUrl)}`;
            
            setGeneratedCode({ url: qrApiUrl, title: title, path: path });

        } catch (e) {
            console.error(e);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate QR code.'})
        } finally {
            setIsLoadingQr(false);
        }
    };
    
    const handlePrint = () => {
        const printContent = printAreaRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print QR Code</title>');
            printWindow.document.write('<style>@page { size: 10cm 10cm; margin: 0; } body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; font-family: sans-serif; text-align: center; } img { max-width: 80%; height: auto; } h2, h3 { margin: 0; } h2 { font-size: 1.5rem; } h3 { font-size: 1.2rem; font-weight: 500; margin-bottom: 1rem; } </style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(`<h2>Al-Maida Restaurant</h2>`); // Consider getting name from settings
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

    const isGenerateDisabled = isLoadingQr || !baseUrl || (target === 'customer' && (!tableNumber || !!validationError));

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
                                onChange={handleTableNumberChange}
                                placeholder={t('أدخل رقم الطاولة...', 'Enter table number...')}
                                required={target === 'customer'}
                                max={numberOfTables}
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
                {isLoadingQr ? <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" /> : <QrCode className="ltr:mr-2 rtl:ml-2 h-4 w-4" />}
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
