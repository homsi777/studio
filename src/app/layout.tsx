import type { Metadata } from 'next';
import './globals.css';
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
import { IconChart, IconChefHat, IconCoin, IconLogo, IconMenu, IconPOS, IconTable } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageToggle } from '@/components/language-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

export const metadata: Metadata = {
  title: "Al-Ma'ida Manager",
  description: 'حلول ذكية ومتكاملة لإدارة المطاعم',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Belleza&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SidebarProvider>
          <Sidebar side="right">
            <SidebarHeader>
              <div className="flex items-center gap-3">
                <IconLogo className="w-10 h-10 text-primary" />
                <div className="flex flex-col">
                  <span className="font-headline text-lg font-semibold tracking-tighter">
                    المائدة
                  </span>
                  <span className="text-xs text-muted-foreground">مدير المطعم</span>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton href="/" tooltip="لوحة التحكم" isActive>
                    <IconTable />
                    <span>لوحة التحكم</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="#" tooltip="واجهة الشيف">
                    <IconChefHat />
                    <span>واجهة الشيف</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="#" tooltip="نقطة البيع">
                    <IconPOS />
                    <span>نقطة البيع السريعة</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarSeparator />
                <SidebarMenuItem>
                  <SidebarMenuButton href="#" tooltip="إدارة القائمة">
                    <IconMenu />
                    <span>إدارة القائمة</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="#" tooltip="التقارير">
                    <IconChart />
                    <span>التقارير</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton href="#" tooltip="المصاريف">
                    <IconCoin />
                    <span>المصاريف</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
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
                    <p className="text-sm font-semibold">المدير العام</p>
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
              <h1 className="font-headline text-xl font-semibold">لوحة التحكم</h1>
            </header>
            {children}
            </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
