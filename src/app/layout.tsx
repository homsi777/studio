import type { Metadata } from 'next';
import './globals.css';
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
      <html lang="ar" dir="rtl">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=Belleza&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <AppContent>
              {children}
          </AppContent>
        </body>
      </html>
    </LanguageProvider>
  );
}
