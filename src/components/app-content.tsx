"use client"
import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { usePathname } from 'next/navigation';
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
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { IconChart, IconChefHat, IconCoin, IconLogo, IconMenu, IconPOS, IconSettings, IconTable, IconUsers } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

export function AppContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language, dir } = useLanguage();
  const pathname = usePathname();
  const [pageTitle, setPageTitle] = useState('');
  
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const pageTitles: Record<string, { ar: string, en: string }> = {
    '/': { ar: 'لوحة التحكم', en: 'Dashboard' },
    '/chef': { ar: 'واجهة الشيف', en: 'Chef Interface' },
    '/pos': { ar: 'نقطة البيع السريعة', en: 'Quick POS' },
    '/menu-management': { ar: 'إدارة القائمة', en: 'Menu Management' },
    '/reports': { ar: 'التقارير', en: 'Reports' },
    '/expenses': { ar: 'المصاريف', en: 'Expenses' },
    '/settings': { ar: 'الإعدادات', en: 'Settings' },
  }

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  useEffect(() => {
    const currentTitleKey = Object.keys(pageTitles).find(key => pathname.startsWith(key) && (key !== '/' || pathname === '/'));
    const title = pageTitles[currentTitleKey || '/'];
    setPageTitle(t(title.ar, title.en));
  }, [pathname, language, t, pageTitles]);
  

  const isCustomerMenu = pathname.startsWith('/menu/');

  if (isCustomerMenu) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <>
      <SidebarProvider>
      <Sidebar side={language === 'ar' ? 'right' : 'left'}>
          <SidebarHeader>
          <div className="flex items-center gap-3">
              <IconLogo className="w-10 h-10 text-primary" />
              <div className="flex flex-col">
              <span className="font-headline text-lg font-semibold tracking-tighter">
                  {t('العالمية', 'Al-Alamiyah')}
              </span>
              <span className="text-xs text-muted-foreground">{t('مدير المطعم', 'Restaurant Manager')}</span>
              </div>
          </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/" tooltip={t('لوحة التحكم', 'Dashboard')} isActive={pathname === '/'}>
                        <IconTable />
                        <span>{t('لوحة التحكم', 'Dashboard')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/chef" tooltip={t('واجهة الشيف', 'Chef Interface')} isActive={pathname === '/chef'}>
                        <IconChefHat />
                        <span>{t('واجهة الشيف', 'Chef Interface')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/pos" tooltip={t('نقطة البيع السريعة', 'Quick POS')} isActive={pathname === '/pos'}>
                        <IconPOS />
                        <span>{t('نقطة البيع السريعة', 'Quick POS')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton href="/menu/1" tooltip={t('قائمة الزبون (تجريبي)', 'Customer Menu (Demo)')} target="_blank">
                      <IconUsers />
                      <span>{t('عرض قائمة الزبون', 'View Customer Menu')}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            
            <SidebarGroup>
              <SidebarGroupLabel>{t('إدارة المطعم', 'Management')}</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/menu-management" tooltip={t('إدارة القائمة', 'Menu Management')} isActive={pathname === '/menu-management'}>
                      <IconMenu />
                      <span>{t('إدارة القائمة', 'Menu Management')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/reports" tooltip={t('التقارير', 'Reports')} isActive={pathname === '/reports'}>
                      <IconChart />
                      <span>{t('التقارير', 'Reports')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/expenses" tooltip={t('المصاريف', 'Expenses')} isActive={pathname === '/expenses'}>
                      <IconCoin />
                      <span>{t('المصاريف', 'Expenses')}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

          </SidebarContent>
          <SidebarFooter>
          <SidebarMenu>
              <SidebarMenuItem>
              <SidebarMenuButton href="/settings" tooltip={t('الإعدادات', 'Settings')} isActive={pathname === '/settings'}>
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
              <div className="flex-1">
                  <p className="text-sm font-semibold">{t('المدير العام', 'General Manager')}</p>
                  <p className="text-xs text-muted-foreground">admin@alamiyah.com</p>
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
          <h1 className="font-headline text-xl font-semibold">{pageTitle}</h1>
          </header>
          {children}
      </SidebarInset>
      </SidebarProvider>
      
      <Toaster />
    </>
  );
}
