'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { signOut, useSession } from 'next-auth/react';

export function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { data: session } = useSession();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 컴포넌트가 마운트된 후에만 테마 상태 확인
  useEffect(() => {
    setMounted(true);
    
    const updateDarkMode = () => {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark');
    };

    // 초기 상태 설정
    updateDarkMode();

    // data-theme 속성 변경 감지
    const observer = new MutationObserver(() => {
      updateDarkMode();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // 드롭다운이 열릴 때마다 다크모드 상태 확인
  useEffect(() => {
    if (isOpen) {
      const theme = document.documentElement.getAttribute('data-theme');
      setIsDark(theme === 'dark');
    }
  }, [isOpen]);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    if (!mounted) return;
    
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.setAttribute('data-theme', newIsDark ? 'dark' : 'light');
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    setIsOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
    setIsOpen(false);
  };

  const handleLogout = () => {
    signOut();
    setIsOpen(false);
  };

  const clickPluginLink = () => {
    const pluginUrl = language === 'ko' 
      ? 'https://github.com/sangcomz/barim-app/blob/main/PLUGINS_KO.md'
      : 'https://github.com/sangcomz/barim-app/blob/main/PLUGINS.md';
    window.open(pluginUrl, '_blank');
    setIsOpen(false);
  }

  // 마운트되지 않았으면 로딩 상태 표시
  if (!mounted) {
    return (
      <div className="relative">
        <button
          className="btn btn-secondary p-2 relative"
          title="설정"
          disabled
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 설정 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary p-2 relative"
        title="설정"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-40 py-3 rounded-lg z-50 shadow-2xl `}
        >
          {/* 언어 설정 */}
          <button
            onClick={toggleLanguage}
            className={`w-full px-4 py-4 text-center mb-1 ${
              isDark ? 'bg-black text-white' : 'bg-white text-black'
            }`}
            style={{
              whiteSpace: 'nowrap',
              border: 'none'
            }}
          >
            <span>
              {language === 'ko' ? 'English' : '한국어'}
            </span>
          </button>

          {/* 다크모드 토글 */}
          <button
            onClick={toggleTheme}
            className={`w-full px-4 py-4 text-center mb-1  ${
                isDark ? 'bg-black text-white' : 'bg-white text-black'
            }`}
            style={{
              whiteSpace: 'nowrap',
              border: 'none'
            }}
          >
            <span>
              {isDark ? t('lightModeShort') : t('darkModeShort')}
            </span>
          </button>

          {/* 플러그인 링크 */}
          <button
              onClick={clickPluginLink}
              className={`w-full px-4 py-4 text-center ${
                  isDark ? 'bg-black text-white' : 'bg-white text-black'
              }`}
              style={{
                whiteSpace: 'nowrap',
                border: 'none'
              }}
          >
            <span>{t('plugins')}</span>
          </button>

          {/* 구분선 - 로그인된 경우에만 표시 */}
          {session && (
            <div
              className={`border-t my-3 ${
                isDark ? 'border-gray-600' : 'border-gray-300'
              }`}
            ></div>
          )}

          {/* 로그아웃 - 로그인된 경우에만 표시 */}
          {session && (
            <button
              onClick={handleLogout}
              className={`w-full px-4 py-4 text-center ${
                  isDark ? 'bg-black text-white' : 'bg-white text-black'
              }`}
              style={{
                whiteSpace: 'nowrap',
                border: 'none'
              }}
            >
              <span>{t('logout')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
