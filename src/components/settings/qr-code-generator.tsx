"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

export function QrCodeGenerator() {
    const [tableCount, setTableCount] = useState(12);
    const [baseUrl, setBaseUrl] = useState('');

    useState(() => {
        // Ensure this runs only on the client
        setBaseUrl(window.location.origin);
    });
    
    const generateQRCodes = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>QR Codes</title>');
            printWindow.document.write('<style>body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; } .qr-card { text-align: center; border: 1px solid #ccc; padding: 10px; border-radius: 8px; width: 150px; } img { width: 100px; height: 100px; } h3 { margin: 10px 0 0; }</style>');
            printWindow.document.write('</head><body>');
            for (let i = 1; i <= tableCount; i++) {
                const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${baseUrl}/menu/${i}`)}`;
                printWindow.document.write(
                    `<div class="qr-card">
                        <img src="${url}" alt="QR Code for Table ${i}" />
                        <h3>الطاولة ${i}</h3>
                    </div>`
                );
            }
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    if (!baseUrl) {
        return null; // Or a loading spinner
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="table-count">عدد الطاولات</Label>
                <Input 
                    id="table-count" 
                    type="number" 
                    value={tableCount}
                    onChange={(e) => setTableCount(Number(e.target.value))}
                    min="1"
                />
            </div>
            <Button onClick={generateQRCodes} className="w-full">
                <QrCode className="mr-2 h-4 w-4" />
                إنشاء وطباعة رموز QR
            </Button>
            <Card className="mt-4 bg-muted/40">
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">
                        سيتم إنشاء رموز QR التي توجه إلى الرابط التالي:
                        <span dir="ltr" className="font-mono bg-background/50 rounded p-1 block text-center mt-2">
                            {baseUrl}/menu/[رقم_الطاولة]
                        </span>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
