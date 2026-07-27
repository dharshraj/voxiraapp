import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { lightColors, darkColors, AppColors } from './colors';

const STORAGE_KEY = 'voxira_theme';

function readTheme(): boolean {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'dark';
    }
  } catch {}
  return false;
}

function writeTheme(isDark: boolean) {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
      return;
    }
    // Native: use expo-secure-store dynamically so web bundle doesn't break
    const SecureStore = require('expo-secure-store');
    SecureStore.setItemAsync(STORAGE_KEY, isDark ? 'dark' : 'light').catch(() => {});
  } catch {}
}

async function readThemeAsync(): Promise<boolean> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) === 'dark';
    }
    const SecureStore = require('expo-secure-store');
    const v = await SecureStore.getItemAsync(STORAGE_KEY);
    return v === 'dark';
  } catch {
    return false;
  }
}

interface ThemeCtx {
  colors: AppColors;
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeCtx>({
  colors: lightColors,
  isDark: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(readTheme);

  useEffect(() => {
    readThemeAsync().then(setIsDark).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      writeTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ colors: isDark ? darkColors : lightColors, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
