"use client"
import React, { useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Toaster } from '@/components/ui/toaster';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { IconChart, IconChefHat, IconCoin, IconLogo, IconMenu, IconPOS, IconSettings, IconTable, IconUsers } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

export function AppContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language, dir } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);
  
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <html lang={language} dir={dir}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Belleza&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {/* We can hide the main sidebar on the customer menu page */}
        <div className="[&_[data-customer-menu]]:hidden">
            <SidebarProvider>
            <Sidebar side={language === 'ar' ? 'right' : 'left'}>
                <SidebarHeader>
                <div className="flex items-center gap-3">
                    <IconLogo className="w-10 h-10 text-primary" />
                    <div className="flex flex-col">
                    <span className="font-headline text-lg font-semibold tracking-tighter">
                        {t('المائدة', 'Al-Ma\'ida')}
                    </span>
                    <span className="text-xs text-muted-foreground">{t('مدير المطعم', 'Restaurant Manager')}</span>
                    </div>
                </div>
                </SidebarHeader>
                <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                    <SidebarMenuButton href="/" tooltip={t('لوحة التحكم', 'Dashboard')}>
                        <IconTable />
                        <span>{t('لوحة التحكم', 'Dashboard')}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                    <SidebarMenuButton href="/chef" tooltip={t('واجهة الشيف', 'Chef Interface')}>
                        <IconChefHat />
                        <span>{t('واجهة الشيف', 'Chef Interface')}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton href="/menu/1" tooltip={t('قائمة الزبون (تجريبي)', 'Customer Menu (Demo)')}>
                        <IconUsers />
                        <span>{t('عرض قائمة الزبون', 'View Customer Menu')}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                    <SidebarMenuButton href="/pos" tooltip={t('نقطة البيع السريعة', 'Quick POS')}>
                        <IconPOS />
                        <span>{t('نقطة البيع السريعة', 'Quick POS')}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarSeparator />
                    <SidebarMenuItem>
                    <SidebarMenuButton href="/menu-management" tooltip={t('إدارة القائمة', 'Menu Management')}>
                        <IconMenu />
                        <span>{t('إدارة القائمة', 'Menu Management')}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                    <SidebarMenuButton href="/reports" tooltip={t('التقارير', 'Reports')}>
                        <IconChart />
                        <span>{t('التقارير', 'Reports')}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                    <SidebarMenuButton href="/expenses" tooltip={t('المصاريف', 'Expenses')}>
                        <IconCoin />
                        <span>{t('المصاريف', 'Expenses')}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                    <SidebarMenuButton href="/settings" tooltip={t('الإعدادات', 'Settings')}>
                        <IconSettings />
                        <span>{t('الإعدادات', 'Settings')}</span>
                    </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="flex items-center justify-between p-2">
                    <LanguageToggle />
                    <ThemeToggle />
                </div>
                <SidebarSeparator />
                <div className="flex items-center gap-3 p-2">
                    <Avatar>
                        <AvatarImage src="https://placehold.co/40x40" alt="Admin" data-ai-hint="manager profile" />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="text-sm font-semibold">{t('المدير العام', 'General Manager')}</p>
                        <p className="text-xs text-muted-foreground">admin@almaida.com</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <SidebarTrigger className="md:hidden" />
                {/* This title can be dynamic based on the page */}
                <h1 className="font-headline text-xl font-semibold">{t('لوحة التحكم', 'Dashboard')}</h1>
                </header>
                {children}
            </SidebarInset>
            </SidebarProvider>
        </div>
        
        {/* Render children outside the sidebar structure if it's a customer menu page */}
        <div className="hidden has-[[data-customer-menu]]:block">
            {children}
        </div>
        
        <Toaster />
      </body>
    </html>
  );
}
