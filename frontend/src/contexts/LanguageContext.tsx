import { useState, useEffect, ReactNode } from 'react';
import { LanguageContext } from './language-context';

type Language = 'en' | 'ar';

const LANGUAGE_STORAGE_KEY = 'tryfann_lang';

function initialLanguage(): Language {
  // MOB-2 (plan): persist the EN/AR choice so Arabic-first users don't fall
  // back to English on every visit or after login.
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {
    /* storage unavailable (private mode) — default */
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  // Keep the document direction + lang in sync with the active language so
  // every screen (auth, dashboard) inherits RTL, not just sections that set
  // `dir` on themselves. Landing sections already set their own dir; this makes
  // the behaviour global and consistent.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      /* best-effort persistence */
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
