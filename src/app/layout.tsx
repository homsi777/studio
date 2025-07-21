import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LanguageProvider } from '@/hooks/use-language';
import { AppContent } from '@/components/app-content';


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
    <LanguageProvider>
        <AppContent>
            {children}
        </AppContent>
    </LanguageProvider>
  );
}
