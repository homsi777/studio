
'use client';

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import {useRouter} from 'next/navigation';
import type {User} from '@/types';
import {useToast} from './use-toast';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'alamiyah_auth_user';
const TRIAL_START_DATE_KEY = 'alamiyah_trial_start_date';
const TRIAL_DURATION_DAYS = 4;

export const AuthProvider = ({children}: {children: ReactNode}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const {toast} = useToast();

  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        if (parsedUser && parsedUser.id) { // Ensure user object is valid
          setUser(parsedUser);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Could not access sessionStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    setIsLoading(true);

    // Trial period logic ONLY for the temporary 'admin' user
    if (username === 'admin') {
      try {
        const trialStartDateStr = localStorage.getItem(TRIAL_START_DATE_KEY);
        if (trialStartDateStr) {
          const trialStartDate = new Date(trialStartDateStr);
          const now = new Date();
          const daysPassed = (now.getTime() - trialStartDate.getTime()) / (1000 * 3600 * 24);
          
          if (daysPassed > TRIAL_DURATION_DAYS) {
            toast({
              variant: 'destructive',
              title: 'انتهت الفترة التجريبية',
              description: 'الرجاء التواصل مع المطور لتفعيل النسخة الكاملة.',
            });
            setIsLoading(false);
            return false;
          }
        } else {
          // First login with trial user, set the trial start date
          localStorage.setItem(TRIAL_START_DATE_KEY, new Date().toISOString());
        }
      } catch (error) {
          console.error("Could not access localStorage for trial check:", error);
      }
    }


    try {
      const response = await fetch('/api/v1/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password: pass}),
      });

      if (!response.ok) {
        // If response is not ok, it might be a server error returning HTML
        const text = await response.text();
        try {
          // Try to parse it as JSON first, it might be a valid error response
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Login failed');
        } catch (e) {
          // If it fails, it's likely the HTML error page.
          throw new Error('Server returned an invalid response. Please check server logs.');
        }
      }
      
      const data = await response.json();

      if (data.success && data.user && data.user.id) {
        try {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
          setUser(data.user);
          setIsAuthenticated(true);
          router.push('/');
          return true;
        } catch (error) {
          console.error('Could not access sessionStorage:', error);
          toast({
            variant: "destructive",
            title: "خطأ في المتصفح",
            description: "لا يمكن الوصول إلى ذاكرة التخزين المؤقت للمتصفح. قد لا يعمل التطبيق بشكل صحيح.",
          });
          return false;
        }
      } else {
        toast({
            variant: "destructive",
            title: 'فشل تسجيل الدخول',
            description: data.message || 'البيانات التي أدخلتها غير صحيحة. يرجى المحاولة مرة أخرى.',
        });
        return false;
      }
    } catch (error: any) {
      console.error('Login process failed:', error);
      let description = 'لا يمكن الاتصال بخدمة المصادقة. تحقق من اتصالك بالإنترنت.';
      if (error instanceof SyntaxError) {
        description = 'حدث خطأ في الخادم. يرجى مراجعة سجلات الخادم.';
      } else if (error.message) {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'خطأ في تسجيل الدخول',
        description: description,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error('Could not access sessionStorage:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{isAuthenticated, user, login, logout, isLoading}}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
