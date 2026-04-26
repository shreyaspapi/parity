/**
 * Theme Provider
 * Manages app-wide theme (light/dark mode) with persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

type Theme = 'light' | 'dark' | 'auto';

// Define custom themes with blue primary color instead of default purple
const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#007aff',
    onPrimary: '#ffffff',
    primaryContainer: '#d1e4ff',
    onPrimaryContainer: '#001d36',
    secondary: '#535f70',
    onSecondary: '#ffffff',
    secondaryContainer: '#d7e3f7',
    onSecondaryContainer: '#101c2b',
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#0a84ff',
    onPrimary: '#ffffff',
    primaryContainer: '#003258',
    onPrimaryContainer: '#d1e4ff',
    secondary: '#bbc7db',
    onSecondary: '#253140',
    secondaryContainer: '#3b4858',
    onSecondaryContainer: '#d7e3f7',
  },
};
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@anraid:theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<Theme>('auto');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load theme preference from storage
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
        setThemeState(savedTheme as Theme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoaded(true);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Resolve the actual theme based on preference and device setting
  const resolvedTheme: ResolvedTheme = 
    theme === 'auto' 
      ? (deviceColorScheme === 'dark' ? 'dark' : 'light')
      : theme;

  const isDark = resolvedTheme === 'dark';

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  const paperTheme = isDark ? customDarkTheme : customLightTheme;

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, isDark }}>
      <PaperProvider theme={paperTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook that returns just the resolved theme (for compatibility)
export function useAppColorScheme(): ResolvedTheme {
  const { resolvedTheme } = useTheme();
  return resolvedTheme;
}

