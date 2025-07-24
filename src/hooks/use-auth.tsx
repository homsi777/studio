'use server';
// This is a new file
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
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Could not access sessionStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Trial period check for default admin account
      if (username === 'admin') {
        const trialStartDateStr = localStorage.getItem(TRIAL_START_DATE_KEY);
        if (trialStartDateStr) {
          const trialStartDate = new Date(trialStartDateStr);
          const now = new Date();
          const trialEndDate = new Date(
            trialStartDate.getTime() +
              TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000
          );

          if (now > trialEndDate) {
            toast({
              variant: 'destructive',
              title: 'انتهت الفترة التجريبية',
              description:
                'صلاحية كلمة المرور الافتراضية قد انتهت. يرجى التواصل للحصول على النسخة الكاملة.',
            });
            setIsLoading(false);
            return false;
          }
        }
      }

      // API endpoint handles password verification now
      const response = await fetch('/api/v1/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username, password: pass}),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        try {
          if (
            username === 'admin' &&
            !localStorage.getItem(TRIAL_START_DATE_KEY)
          ) {
            localStorage.setItem(TRIAL_START_DATE_KEY, new Date().toISOString());
            toast({
              title: 'أهلاً بك في الفترة التجريبية!',
              description: `يمكنك استخدام كلمة المرور الافتراضية لمدة ${TRIAL_DURATION_DAYS} أيام.`,
            });
          }

          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
          setUser(data.user);
          setIsAuthenticated(true);
          router.push('/');
          return true;
        } catch (error) {
          console.error('Could not access sessionStorage:', error);
          return false;
        }
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login process failed:', error);
      toast({
        variant: 'destructive',
        title: 'Login Error',
        description: 'Could not connect to the authentication service.',
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
