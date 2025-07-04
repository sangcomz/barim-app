'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="btn btn-secondary p-2 min-w-[60px]"
      title={`Switch to ${language === 'ko' ? 'English' : '한국어'}`}
    >
      <span className="text-sm font-medium">
        {language === 'ko' ? 'EN' : '한국어'}
      </span>
    </button>
  );
}
