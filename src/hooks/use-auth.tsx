// This is a new file
"use client"

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    isAuthenticated: boolean;
    login: (user: string, pass: string) => Promise<boolean>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'alamiyah_auth_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter();

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
        // This is a mock login function.
        // In a real app, you would make an API call to your backend.
        return new Promise(resolve => {
            setTimeout(() => {
                if (username === 'admin' && pass === 'password') {
                    try {
                        sessionStorage.setItem(AUTH_STORAGE_KEY, 'mock_jwt_token');
                        setIsAuthenticated(true);
                        router.push('/');
                        resolve(true);
                    } catch (error) {
                         console.error("Could not access sessionStorage:", error);
                         resolve(false);
                    }
                } else {
                    resolve(false);
                }
            }, 500); // Simulate network delay
        });
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
