

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
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (identifier: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser): User => {
    return {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        username: supabaseUser.user_metadata.username || supabaseUser.email, // Fallback to email
        role: supabaseUser.user_metadata.role || 'employee',
    };
};

export const AuthProvider = ({children}: {children: ReactNode}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const {toast} = useToast();

  const handleAuthStateChange = useCallback(async (_event: AuthChangeEvent, session: Session | null) => {
    try {
      if (session?.user) {
        const appUser = mapSupabaseUserToAppUser(session.user);
        setUser(appUser);
        sessionStorage.setItem('user', JSON.stringify(appUser));
      } else {
        setUser(null);
        sessionStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Could not access sessionStorage or parse session:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const sessionUser = sessionStorage.getItem('user');
      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
    } catch (error) {
       console.error("Could not read from sessionStorage:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    return () => {
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const login = async (identifier: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // For simplicity, we assume the identifier is the email.
      // Supabase does not directly support username login in the same function.
      // A more complex implementation would require a pre-check to resolve username to email.
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier,
        password: pass,
      });

      if (error) {
        throw error;
      }
      
      if (data.user) {
        const appUser = mapSupabaseUserToAppUser(data.user);
        setUser(appUser);
        sessionStorage.setItem('user', JSON.stringify(appUser));
        router.push('/');
        return true;
      }
      
      return false;

    } catch (error: any) {
      console.error('Login process failed:', error);
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
    setUser(null);
    try {
        sessionStorage.removeItem('user');
    } catch(e) {
        console.error("Could not remove 'user' from sessionStorage", e);
    }
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
