import { useState, useEffect, ReactNode } from 'react';
import { LanguageContext } from './language-context';

type Language = 'en' | 'ar';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Keep the document direction + lang in sync with the active language so
  // every screen (auth, dashboard) inherits RTL, not just sections that set
  // `dir` on themselves. Landing sections already set their own dir; this makes
  // the behaviour global and consistent.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', language);
    root.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

