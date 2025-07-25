
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

  const loadUserFromSession = useCallback(() => {
    try {
      const sessionString = sessionStorage.getItem('supabase.auth.session');
      if (sessionString) {
        const session = JSON.parse(sessionString);
        if (session.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.email,
            role: session.user.user_metadata.role || 'employee',
          };
          setUser(userData);
        } else {
           setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Could not access sessionStorage or parse session:', error);
      setUser(null);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserFromSession();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
         const userData: User = {
            id: session.user.id,
            email: session.user.email,
            username: session.user.email,
            role: session.user.user_metadata.role || 'employee',
          };
          setUser(userData);
          // Store session for persistence across page loads
          try {
            sessionStorage.setItem('supabase.auth.session', JSON.stringify(session));
          } catch (e) {
            console.error("Could not write to sessionStorage:", e);
          }
      } else {
          setUser(null);
          try {
            sessionStorage.removeItem('supabase.auth.session');
          } catch(e) {
            console.error("Could not remove from sessionStorage:", e);
          }
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [loadUserFromSession]);

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
        // Now the backend error message will be shown, which is more accurate.
        throw new Error(data.message || 'Login failed');
      }
      
      if (data.success && data.user && data.user.id) {
          const session = data.session;
          try {
             if (session) {
                await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
                const userData: User = {
                    id: data.user.id,
                    email: data.user.email,
                    username: data.user.email,
                    role: data.user.role || 'employee',
                };
                setUser(userData);
                router.push('/');
                return true;
             }
             throw new Error("Session data is missing from login response.");
          } catch (error) {
            console.error('Could not set session or access storage:', error);
            toast({
              variant: "destructive",
              title: "خطأ في المتصفح",
              description: "لا يمكن الوصول إلى ذاكرة التخزين المؤقت للمتصفح. قد لا يعمل التطبيق بشكل صحيح.",
            });
            return false;
          }
      } else {
        // This case is for unexpected successful responses that don't match the contract.
        throw new Error(data.message || 'The credentials you entered are incorrect. Please try again.');
      }
    } catch (error: any) {
      console.error('Login process failed:', error);
      
      // Determine the error type and show a more specific message.
      const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch';
      const description = isNetworkError
        ? 'لا يمكن الاتصال بخدمة المصادقة. تحقق من اتصالك بالإنترنت.' 
        : error.message || 'حدث خطأ غير متوقع.';

      toast({
        variant: 'destructive',
        title: 'فشل تسجيل الدخول',
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
        sessionStorage.removeItem('supabase.auth.session');
    } catch(e) {
        console.error("Could not remove from sessionStorage:", e);
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
