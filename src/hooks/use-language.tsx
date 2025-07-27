"use client"; // هذا المكون يستخدم React Hooks لذا يجب أن يكون Client Component

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// تعريف أنواع اللغات المدعومة
export type Language = 'ar' | 'en';

// تعريف واجهة السياق (Context Interface)
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  dir: 'rtl' | 'ltr';
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
    setLanguageState(prevLang => (prevLang === 'ar' ? 'en' : 'ar'));
  }, []);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, dir }}>
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
