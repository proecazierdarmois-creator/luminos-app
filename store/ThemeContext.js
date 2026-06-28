// store/ThemeContext.js — Système de thème global
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// ─── Thèmes ───────────────────────────────────────────────────────
export const THEMES = {
  dark: {
    id: 'dark',
    label: 'Sombre',
    emoji: '🌑',
    bg:           '#04060d',
    bgSecondary:  '#07090f',
    bgTertiary:   '#0d1220',
    bgCard:       '#0d1220',
    border:       '#1e2d4a',
    text:         '#ffffff',
    textSecondary:'#c8daf0',
    textMuted:    '#4a6080',
    accent:       '#00e5ff',
    tabBar:       '#07090f',
    tabBorder:    '#1e2d4a',
    gradient:     ['#04060d','#07090f','#0a0d18'],
  },
  light: {
    id: 'light',
    label: 'Clair',
    emoji: '☀️',
    bg:           '#f0f4ff',
    bgSecondary:  '#e8eeff',
    bgTertiary:   '#ffffff',
    bgCard:       '#ffffff',
    border:       '#c8d4f0',
    text:         '#0a0f1a',
    textSecondary:'#1a2a4a',
    textMuted:    '#6a84a0',
    accent:       '#0066cc',
    tabBar:       '#ffffff',
    tabBorder:    '#c8d4f0',
    gradient:     ['#f0f4ff','#e8eeff','#f0f4ff'],
  },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState('auto'); // dark | light | auto

  useEffect(() => {
    AsyncStorage.getItem('@luminos_theme').then(saved => {
      if (saved) setMode(saved);
    });
  }, []);

  async function setTheme(newMode) {
    setMode(newMode);
    await AsyncStorage.setItem('@luminos_theme', newMode);
  }

  const activeTheme = mode === 'auto'
    ? (systemScheme === 'light' ? THEMES.light : THEMES.dark)
    : (THEMES[mode] || THEMES.dark);

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, mode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext) || { theme: THEMES.dark, mode: 'dark', setTheme: ()=>{} };
}