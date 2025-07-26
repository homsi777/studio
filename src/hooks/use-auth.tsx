
'use client';

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User, UserRole } from '@/types';
import { useToast } from './use-toast';
import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapSupabaseUserToAppUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    username: supabaseUser.user_metadata.username || supabaseUser.email,
    role: supabaseUser.user_metadata.role || 'employee',
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuthStateChange = useCallback(async (event: AuthChangeEvent, session: Session | null) => {
    setIsLoading(true);
    if (session?.user) {
      const appUser = mapSupabaseUserToAppUser(session.user);
      setUser(appUser);
      // For simplicity, we manage session persistence via Supabase's cookie handling
    } else {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const appUser = mapSupabaseUserToAppUser(session.user);
            setUser(appUser);
        }
        setIsLoading(false);
    };
    checkInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    return () => {
      subscription?.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const login = async (email: string, pass: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (signInError) throw signInError;
      
      if (data.user) {
        const appUser = mapSupabaseUserToAppUser(data.user);
        setUser(appUser);
        
        // Redirect based on role
        const t = document.documentElement.lang === 'ar' ? (ar:string, en:string)=>ar : (ar:string, en:string)=>en;
        toast({ title: t('تم تسجيل الدخول', 'Login Successful'), description: t(`مرحباً بعودتك، ${appUser.username}`, `Welcome back, ${appUser.username}`) });

        switch (appUser.role) {
            case 'manager':
                router.push('/');
                break;
            case 'chef':
                router.push('/chef');
                break;
            case 'employee': // Assuming 'employee' might be a cashier or have POS access
                router.push('/pos');
                break;
            default:
                router.push('/'); // Default redirect
        }
      } else {
        throw new Error("Login did not return a user session.");
      }

    } catch (err: any) {
      console.error('Login process failed:', err);
      const t = document.documentElement.lang === 'ar' ? (ar:string, en:string)=>ar : (ar:string, en:string)=>en;
      const description = err.message.includes('Invalid login credentials')
        ? t('البيانات التي أدخلتها غير صحيحة. يرجى المحاولة مرة أخرى.', 'The credentials you entered are incorrect. Please try again.')
        : t('حدث خطأ غير متوقع. يرجى التحقق من اتصالك بالإنترنت.', 'An unexpected error occurred. Please check your internet connection.');
      
      setError(description);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  };
  
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, isLoading, error }}
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
