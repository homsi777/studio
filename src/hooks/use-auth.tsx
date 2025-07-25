
'use client';

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import {useRouter} from 'next/navigation';
import type {User} from '@/types';
import {useToast} from './use-toast';
import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({children}: {children: ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const {toast} = useToast();

  const handleAuthStateChange = useCallback((_event: AuthChangeEvent, session: Session | null) => {
    try {
      if (session?.user) {
        const userData: User = {
          id: session.user.id,
          email: session.user.email,
          username: session.user.email,
          role: session.user.user_metadata.role || 'employee',
        };
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
      } else {
        setUser(null);
        sessionStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Could not access sessionStorage or parse session:', error);
      setUser(null);
    } finally {
      // We are only done loading once we have checked for an existing session.
      setIsLoading(false);
    }
  }, []);

  // Load user from session storage on initial load
  useEffect(() => {
    try {
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
    } catch (error) {
       console.error("Could not read from sessionStorage:", error);
    }
    setIsLoading(false); // Mark loading as false after checking session
  }, []);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    return () => {
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Use Supabase client-side SDK directly for login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: pass,
      });

      if (error) {
        // Let Supabase provide the specific error message
        throw error;
      }
      
      // onAuthStateChange will handle setting the user and session
      if (data.user) {
        router.push('/');
        return true;
      }
      // This should ideally not be reached if Supabase flow is correct
      return false;

    } catch (error: any) {
      console.error('Login process failed:', error);
      
      // Provide user-friendly error messages based on Supabase errors
      const t = (ar: string, en: string) => document.documentElement.lang === 'ar' ? ar : en;
      const description = error.message.includes('Invalid login credentials')
        ? t('البيانات التي أدخلتها غير صحيحة. يرجى المحاولة مرة أخرى.', 'The credentials you entered are incorrect. Please try again.')
        : t('حدث خطأ غير متوقع. يرجى التحقق من اتصالك بالإنترنت.', 'An unexpected error occurred. Please check your internet connection.');

      toast({
        variant: 'destructive',
        title: t('فشل تسجيل الدخول', 'Login Failed'),
        description: description,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will clear the user state
    router.push('/login');
  };
  
  const isAuthenticated = !!user;

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
