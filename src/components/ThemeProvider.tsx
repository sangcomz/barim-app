'use client';

import { useEffect } from 'react';

export function ThemeProvider() {
  useEffect(() => {
    // 가능한 빠르게 실행되도록 즉시 실행 함수 사용
    const initializeTheme = () => {
      try {
        const savedTheme = localStorage.getItem('theme');
        let shouldBeDark = false;
        
        if (savedTheme) {
          shouldBeDark = savedTheme === 'dark';
        } else {
          // 시스템 다크모드 감지
          shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          // 처음 방문이라면 현재 설정을 저장
          localStorage.setItem('theme', shouldBeDark ? 'dark' : 'light');
        }
        
        // 테마 즉시 적용
        document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
        
        // 시스템 다크모드 변경 감지
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
          // 사용자가 수동으로 설정하지 않은 경우에만 시스템 설정 따라가기
          const currentSavedTheme = localStorage.getItem('theme');
          if (!currentSavedTheme) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
          }
        };
        
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        
        return () => {
          mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
      } catch (error) {
        console.warn('Could not initialize theme:', error);
        // 에러가 발생하면 기본값 사용
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    // DOM이 완전히 로드되기 전에도 실행
    const cleanup = initializeTheme();
    
    return cleanup;
  }, []);

  return null;
}
