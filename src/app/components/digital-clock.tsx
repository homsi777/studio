

"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Clock } from 'lucide-react';

export function DigitalClock() {
    const { language } = useLanguage();
    const [time, setTime] = useState<Date | null>(null);

    useEffect(() => {
        // Set initial time on mount only on the client
        setTime(new Date());

        // Update time every second
        const timerId = setInterval(() => setTime(new Date()), 1000);
        
        // Cleanup interval on component unmount
        return () => clearInterval(timerId);
    }, []);

    if (!time) {
        // Render a placeholder on the server and initial client render to avoid hydration mismatch
        return (
            <div className="flex items-center justify-center gap-2 font-mono text-sm font-semibold text-foreground bg-muted/50 px-3 py-1.5 rounded-md min-w-[120px]">
                <Clock className="h-4 w-4 text-primary" />
                <span>--:--:-- --</span>
            </div>
        );
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(language === 'ar' ? 'ar-SY' : 'en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="flex items-center justify-center gap-2 font-mono text-sm font-semibold text-foreground bg-muted/50 px-3 py-1.5 rounded-md min-w-[120px]">
            <Clock className="h-4 w-4 text-primary" />
            <span>{formatTime(time)}</span>
        </div>
    );
}
