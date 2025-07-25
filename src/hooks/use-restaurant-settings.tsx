
"use client"

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface RestaurantSettings {
    restaurantName: string;
    address: string;
    phone: string;
    email: string;
}

interface RestaurantSettingsContextType {
    settings: RestaurantSettings;
    setSettings: React.Dispatch<React.SetStateAction<RestaurantSettings>>;
}

const RestaurantSettingsContext = createContext<RestaurantSettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'alamiyah_restaurant_settings';

const defaultSettings: RestaurantSettings = {
    restaurantName: 'العالمية جروب',
    address: 'دمشق، سوريا',
    phone: '+963 912 345 678',
    email: 'info@alamiyah.com',
};

export const RestaurantSettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load settings from localStorage on initial client-side load
    useEffect(() => {
        try {
            const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
            if (storedSettings) {
                // Merge stored settings with defaults to avoid missing properties on update
                const parsedSettings = JSON.parse(storedSettings);
                setSettings(prev => ({ ...prev, ...parsedSettings }));
            }
        } catch (error) {
            console.error("Could not access localStorage:", error);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
            } catch (error) {
                console.error("Could not access localStorage:", error);
            }
        }
    }, [settings, isLoaded]);

    return (
        <RestaurantSettingsContext.Provider value={{ settings, setSettings }}>
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
