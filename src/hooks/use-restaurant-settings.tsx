
"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

export interface RestaurantSettings {
    restaurantName: string;
    address: string;
    phone: string;
    email: string;
    currency: string;
    currencyExchangeRate: number | null;
    lastExchangeRateUpdate: string | null;
}

interface RestaurantSettingsContextType {
    settings: RestaurantSettings;
    setSettings: React.Dispatch<React.SetStateAction<RestaurantSettings>>;
    saveSettings: () => void;
}

const defaultSettings: RestaurantSettings = {
    restaurantName: "مطعم المائدة",
    address: "دمشق، سوريا",
    phone: "+963 912 345 678",
    email: "info@almaida.com",
    currency: "SYP",
    currencyExchangeRate: null,
    lastExchangeRateUpdate: null,
};

const RestaurantSettingsContext = createContext<RestaurantSettingsContextType | undefined>(undefined);

export const RestaurantSettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<RestaurantSettings>(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedSettings = localStorage.getItem('restaurantSettings');
                return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
            } catch (error) {
                console.error("Failed to parse settings from localStorage", error);
                return defaultSettings;
            }
        }
        return defaultSettings;
    });

    const saveSettings = useCallback(() => {
        try {
            localStorage.setItem('restaurantSettings', JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [settings]);

    useEffect(() => {
        saveSettings();
    }, [settings, saveSettings]);
    

    return (
        <RestaurantSettingsContext.Provider value={{ settings, setSettings, saveSettings }}>
            {children}
        </RestaurantSettingsContext.Provider>
    );
};

export const useRestaurantSettings = () => {
    const context = useContext(RestaurantSettingsContext);
    if (context === undefined) {
        throw new Error('useRestaurantSettings must be used within a RestaurantSettingsProvider');
    }
    return context;
};
