
"use client";

import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconLogo } from '@/components/icons';
import { LanguageToggle } from '@/components/language-toggle';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRestaurantSettings } from '@/hooks/use-restaurant-settings';

export default function LoginPage() {
    const { language, dir } = useLanguage();
    const t = (ar: string, en: string) => language === 'ar' ? ar : en;
    const { login, isLoading } = useAuth();
    const { toast } = useToast();
    const { settings } = useRestaurantSettings();

    const [identifier, setIdentifier] = useState(''); // Can be email or username
    const [password, setPassword] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(identifier, password);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4 select-none">
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
            </div>
            <div className='text-center mb-8'>
                <h1 className='font-headline text-4xl font-bold text-primary tracking-wider'>{settings.restaurantName}</h1>
                <p className='text-muted-foreground'>{t('حلول ذكية ومتكاملة لإدارة المطاعم', 'Smart and Integrated Restaurant Management Solutions')}</p>
            </div>
            <Card className="w-full max-w-sm" dir={dir}>
                <CardHeader className="text-center">
                    <IconLogo className="w-16 h-16 mx-auto text-primary mb-4" />
                    <CardTitle className="font-headline text-2xl">{t('تسجيل دخول الموظفين', 'Staff Login')}</CardTitle>
                    <CardDescription>{t('الرجاء إدخال بياناتك للوصول إلى لوحة التحكم.', 'Please enter your credentials to access the dashboard.')}</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="identifier">{t('البريد الإلكتروني أو اسم المستخدم', 'Email or Username')}</Label>
                            <Input
                                id="identifier"
                                type="text"
                                placeholder="admin@alalamiya.com"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="username"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('كلمة المرور', 'Password')}</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />}
                            {isLoading ? t('جارِ التحقق...', 'Verifying...') : t('تسجيل الدخول', 'Login')}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
