
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
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'alamiyah_auth_user';
const SESSION_STORAGE_KEY = 'alamiyah_auth_session';

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

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password: pass}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.success && data.user && data.user.id) {
        try {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
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
        throw new Error(data.message || 'The credentials you entered are incorrect. Please try again.');
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('Error during logout:', error);
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
