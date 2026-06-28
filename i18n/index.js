// i18n/index.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { ref, set, get } from 'firebase/database';
import fr from './fr';
import en from './en';

const TRANSLATIONS = { fr, en };
const SUPPORTED    = ['fr', 'en'];
const DEFAULT_LANG = 'fr';
const STORAGE_KEY  = '@luminos_lang';

function detectSystemLanguage() {
  try {
    let locale = 'fr';
    if (Platform.OS === 'web') {
      locale = navigator.language || navigator.userLanguage || 'fr';
    } else {
      const deviceLang =
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        NativeModules.I18nManager?.localeIdentifier ||
        'fr';
      locale = deviceLang;
    }
    const lang = locale.substring(0, 2).toLowerCase();
    return SUPPORTED.includes(lang) ? lang : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}

const I18nContext = createContext({ t: fr, lang: 'fr', setLang: () => {} });

export function I18nProvider({ children, uid }) {
  const [lang, setLangState] = useState(DEFAULT_LANG);
  const [loaded, setLoaded]  = useState(false);

  // 1. Charge depuis AsyncStorage en premier (rapide, persiste sans uid)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (saved && SUPPORTED.includes(saved)) {
        setLangState(saved);
      } else {
        setLangState(detectSystemLanguage());
      }
      setLoaded(true);
    }).catch(() => {
      setLangState(detectSystemLanguage());
      setLoaded(true);
    });
  }, []);

  // 2. Synchronise avec Firebase quand uid disponible
  useEffect(() => {
    if (!uid || !loaded) return;
    get(ref(db, `settings/${uid}/lang`)).then(snap => {
      if (snap.exists() && SUPPORTED.includes(snap.val())) {
        setLangState(snap.val());
        AsyncStorage.setItem(STORAGE_KEY, snap.val()).catch(()=>{});
      }
    }).catch(() => {});
  }, [uid, loaded]);

  async function setLang(newLang) {
    if (!SUPPORTED.includes(newLang)) return;
    setLangState(newLang);
    // Sauvegarde locale immédiate
    await AsyncStorage.setItem(STORAGE_KEY, newLang).catch(()=>{});
    // Sauvegarde Firebase si connecté
    if (uid) {
      await set(ref(db, `settings/${uid}/lang`), newLang).catch(() => {});
    }
  }

  const t = TRANSLATIONS[lang] || fr;

  return (
    <I18nContext.Provider value={{ t, lang, setLang, supportedLangs: SUPPORTED }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

export const LANG_LABELS = {
  fr: '🇫🇷 Français',
  en: '🇬🇧 English',
};