'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '@/lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState<Language>('ko'); // 기본값을 ko로 설정
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 클라이언트에서만 실행
    try {
      const savedLanguage = localStorage.getItem('language') as Language;
      if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
        setLanguage(savedLanguage);
      } else {
        // 브라우저 언어 감지
        const browserLanguage = navigator.language.startsWith('ko') ? 'ko' : 'en';
        setLanguage(browserLanguage);
        localStorage.setItem('language', browserLanguage);
      }
    } catch (error) {
      // localStorage가 없는 환경에서는 기본값 사용
      console.warn('localStorage not available, using default language');
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    if (mounted) {
      try {
        localStorage.setItem('language', lang);
      } catch (error) {
        console.warn('Could not save language to localStorage');
      }
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations.ko[key] || key;
    
    // 파라미터 치환
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
