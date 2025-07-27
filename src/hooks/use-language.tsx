"use client"; // هذا المكون يستخدم React Hooks لذا يجب أن يكون Client Component

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// تعريف أنواع اللغات المدعومة
export type Language = 'ar' | 'en';

// تعريف واجهة السياق (Context Interface)
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean; // هل اللغة من اليمين لليسار (Right-To-Left)
}

// إنشاء السياق بقيم افتراضية
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// مكون المزود (Provider Component)
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // يمكن هنا جلب اللغة الافتراضية من localStorage أو من إعدادات المستخدم
  const [language, setLanguageState] = useState<Language>('ar'); // الافتراضي: العربية

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    // يمكن هنا حفظ اللغة في localStorage لاستمرارها بين الجلسات
    // localStorage.setItem('appLanguage', lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prevLang => (prevLang === 'ar' ? 'en' : 'ar'));
  }, [setLanguage]);

  const isRTL = language === 'ar'; // العربية هي RTL

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook مخصص لاستخدام السياق
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// هذا هو الـ Hook الذي قد يكون موجوداً لديك ويسبب التباساً
// إذا كان لديك useIsMobile في نفس الملف، تأكد من تصديره بشكل منفصل
// export const useIsMobile = () => { /* ... */ };
