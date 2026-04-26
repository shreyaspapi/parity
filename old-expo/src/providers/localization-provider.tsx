/**
 * Localization Provider
 * Provides i18n functionality throughout the app
 */

import { LocaleCode, localeNames, translations } from '@/src/locales';
import { storageService } from '@/src/services/storage.service';
import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface LocalizationContextType {
  t: (key: string, params?: Record<string, any>) => string;
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => Promise<void>;
  availableLocales: Record<LocaleCode, string>;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

// Initialize i18n
const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Helper to get the best matching locale
const getBestMatchingLocale = (preferredLocales: string[]): LocaleCode => {
  const supportedLocales = Object.keys(translations) as LocaleCode[];
  
  for (const preferredLocale of preferredLocales) {
    // Exact match
    if (supportedLocales.includes(preferredLocale as LocaleCode)) {
      return preferredLocale as LocaleCode;
    }
    
    // Language code match (e.g., 'en-US' -> 'en')
    const languageCode = preferredLocale.split('-')[0];
    if (supportedLocales.includes(languageCode as LocaleCode)) {
      return languageCode as LocaleCode;
    }
  }
  
  return 'en'; // Default fallback
};

export function LocalizationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>('en');
  const [isReady, setIsReady] = useState(false);

  // Initialize locale on mount
  useEffect(() => {
    const initLocale = async () => {
      try {
        // Try to get saved locale from storage
        const savedLocale = await storageService.getLocale();
        
        if (savedLocale && translations[savedLocale as LocaleCode]) {
          i18n.locale = savedLocale;
          setLocaleState(savedLocale as LocaleCode);
        } else {
          // Use device locale
          const deviceLocales = Localization.getLocales().map(l => l.languageCode || l.languageTag);
          const bestLocale = getBestMatchingLocale(deviceLocales);
          i18n.locale = bestLocale;
          setLocaleState(bestLocale);
          // Save the detected locale
          await storageService.setLocale(bestLocale);
        }
      } catch (error) {
        console.error('Failed to initialize locale:', error);
        i18n.locale = 'en';
        setLocaleState('en');
      } finally {
        setIsReady(true);
      }
    };

    initLocale();
  }, []);

  const setLocale = useCallback(async (newLocale: LocaleCode) => {
    try {
      i18n.locale = newLocale;
      setLocaleState(newLocale);
      await storageService.setLocale(newLocale);
    } catch (error) {
      console.error('Failed to set locale:', error);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, any>) => {
    return i18n.t(key, params);
  }, [locale]); // Re-create when locale changes

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <LocalizationContext.Provider
      value={{
        t,
        locale,
        setLocale,
        availableLocales: localeNames,
      }}
    >
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
}
