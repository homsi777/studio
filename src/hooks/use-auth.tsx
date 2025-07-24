// This is a new file
"use client"

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { useToast } from './use-toast';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (user: string, pass: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'alamiyah_auth_token';
const TRIAL_START_DATE_KEY = 'alamiyah_trial_start_date';
const TRIAL_DURATION_DAYS = 4;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        try {
            const storedToken = sessionStorage.getItem(AUTH_STORAGE_KEY);
            if (storedToken) {
                setIsAuthenticated(true);
            }
        } catch (error) {
            console.error("Could not access sessionStorage:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = async (username: string, pass: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            // Check for trial period expiration for the default admin account
            if (username === 'admin' && pass === '123456') {
                const trialStartDateStr = localStorage.getItem(TRIAL_START_DATE_KEY);
                if (trialStartDateStr) {
                    const trialStartDate = new Date(trialStartDateStr);
                    const now = new Date();
                    const trialEndDate = new Date(trialStartDate.getTime() + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000);

                    if (now > trialEndDate) {
                        toast({
                            variant: "destructive",
                            title: "انتهت الفترة التجريبية",
                            description: "صلاحية كلمة المرور الافتراضية قد انتهت. يرجى التواصل للحصول على النسخة الكاملة.",
                        });
                        setIsLoading(false);
                        return false;
                    }
                }
            }


            // In a real production app, never fetch all users to the client.
            // This should be an API endpoint that takes username/password and returns a token.
            // For this project's scope, we validate against the fetched user list.
            const response = await fetch('/api/v1/users');
            if (!response.ok) {
                throw new Error('Failed to fetch users for authentication.');
            }
            const users: User[] = await response.json();
            
            // WARNING: Storing and comparing plain text passwords is a major security risk.
            // This is for demonstration purposes only. In a real application,
            // passwords must be hashed on the server.
            const foundUser = users.find(u => u.username === username && (u as any).password === pass);

            if (foundUser) {
                 try {
                    // If it's the first successful login with default credentials, set the trial start date.
                    if (username === 'admin' && pass === '123456' && !localStorage.getItem(TRIAL_START_DATE_KEY)) {
                        localStorage.setItem(TRIAL_START_DATE_KEY, new Date().toISOString());
                        toast({
                            title: "أهلاً بك في الفترة التجريبية!",
                            description: `يمكنك استخدام كلمة المرور الافتراضية لمدة ${TRIAL_DURATION_DAYS} أيام.`,
                        });
                    }

                    sessionStorage.setItem(AUTH_STORAGE_KEY, 'mock_jwt_token_for_' + foundUser.id);
                    setIsAuthenticated(true);
                    router.push('/');
                    return true;
                } catch (error) {
                     console.error("Could not access sessionStorage:", error);
                     return false;
                }
            } else {
                return false;
            }

        } catch (error) {
            console.error("Login process failed:", error);
            toast({
                variant: "destructive",
                title: "Login Error",
                description: "Could not connect to the authentication service.",
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
            console.error("Could not access sessionStorage:", error);
        } finally {
            setIsAuthenticated(false);
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
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
