'use client';

import { useState, useCallback } from 'react';

type Language = 'en' | 'hi' | 'mr';

function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  return (localStorage.getItem('db_language') as Language) || 'en';
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('db_language', lang);
  }, []);

  return { language, setLanguage };
}
