'use client';

import {useState, useEffect, FormEvent, ChangeEvent, useCallback} from 'react';
import {useSession, signIn, signOut} from "next-auth/react";
import {useLanguage} from '@/contexts/LanguageContext';
import {LanguageToggle} from '@/components/LanguageToggle';

// 데이터 타입 정의
interface Label {
    id?: number;
    name: string;
    color?: string;
}

interface Issue {
    id: number;
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    labels: Label[];
}

interface Repo {
    id: number;
    name: string;
}

interface UpdatePayload {
    repo: string;
    labels?: string[];
    state?: string;
    state_reason?: string;
}

// 다크모드 토글 컴포넌트
function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);
    const {t} = useLanguage();

    useEffect(() => {
        // 초기 테마 확인
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

        setIsDark(shouldBeDark);
        document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light');
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        document.documentElement.setAttribute('data-theme', newIsDark ? 'dark' : 'light');
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="btn btn-secondary p-2"
            title={isDark ? t('lightMode') : t('darkMode')}
        >
            {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
            )}
        </button>
    );
}

// 로그인 전 랜딩 페이지 컴포넌트
function LandingPage() {
    const [isScrolled, setIsScrolled] = useState(false);
    const {t} = useLanguage();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen" style={{
            background: 'var(--background)',
            backgroundImage: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
        }}>
            {/* Fixed Controls - only visible when NOT scrolled */}
            <div className={`fixed top-6 right-6 z-50 transition-all duration-300 ${
                isScrolled ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
                <div className="flex gap-3">
                    <LanguageToggle/>
                    <ThemeToggle/>
                </div>
            </div>

            {/* Floating Header - visible when scrolled, includes controls */}
            <header
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
                    isScrolled ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
                }`}
                style={{
                    background: `rgba(var(--card-rgb), 0.9)`,
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--border)'
                }}
            >
                <div className="container mx-auto">
                    <div className="flex justify-between items-center py-4">
                        <h1 className="text-xl font-bold" style={{color: 'var(--foreground)'}}>Barim</h1>
                        <div className="flex gap-3">
                            <LanguageToggle/>
                            <ThemeToggle/>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <div className="min-h-screen flex flex-col justify-center items-center px-6 py-20">
                <div className="text-center mb-16 fade-in max-w-4xl">
                    <h1 className="text-6xl md:text-7xl font-bold" style={{color: 'var(--foreground)'}}>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Barim
            </span>
                    </h1>
                    <p className="text-xl md:text-2xl mb-4 max-w-3xl mx-auto leading-relaxed"
                       style={{color: 'var(--secondary)'}}>
                        {t('tagline')}
                    </p>
                    <div className="mb-12 max-w-2xl mx-auto p-6 rounded-2xl" style={{
                        background: 'rgba(var(--card-rgb), 0.5)',
                        border: '1px solid var(--border)'
                    }}>
                        <p className="text-sm leading-relaxed" style={{color: 'var(--secondary)'}}>
                            {t('barimDescription')}
                        </p>
                        <p className="text-sm leading-relaxed mt-2" style={{color: 'var(--secondary)'}}>
                            {t('barimMeaning')}
                        </p>
                    </div>
                    <button
                        onClick={() => signIn('github')}
                        className="btn btn-primary text-lg px-8 py-4 shadow-lg hover:shadow-xl mx-auto"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd"
                                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                                  clipRule="evenodd"/>
                        </svg>
                        {t('startWithGithub')}
                    </button>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto mb-8 w-full">
                    <div className="card card-hover text-center p-8">
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
                                background: 'var(--primary)',
                                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)'
                            }}>
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M9 17H7a2 2 0 01-2-2V7a2 2 0 012-2h2m0 10h8a2 2 0 002-2V7a2 2 0 00-2-2h-8m0 10v4a2 2 0 002 2h6a2 2 0 002-2v-4M9 7v10"/>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-semibold mb-6">{t('kanbanBoard')}</h3>
                        <p className="text-lg leading-relaxed" style={{color: 'var(--secondary)'}}>
                            {t('kanbanDescription')}
                        </p>
                    </div>

                    <div className="card card-hover text-center p-8">
                        <div className="flex justify-center mb-8">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
                                background: 'var(--warning)',
                                boxShadow: '0 8px 32px rgba(191, 135, 0, 0.3)'
                            }}>
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor"
                                     viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-semibold mb-6">{t('noteFeature')}</h3>
                        <p className="text-lg leading-relaxed" style={{color: 'var(--secondary)'}}>
                            {t('noteDescription')}
                        </p>
                    </div>
                </div>

                {/* Additional Features */}
                <div className="card shadow-xl p-12 max-w-6xl mx-auto w-full mb-8">
                    <h2 className="text-4xl font-bold text-center mb-12">{t('whyBarim')}</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{
                                    background: 'var(--success)',
                                    boxShadow: '0 8px 32px rgba(26, 127, 55, 0.2)'
                                }}>
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                    </svg>
                                </div>
                            </div>
                            <h4 className="text-xl font-semibold mb-4">{t('fastSync')}</h4>
                            <p className="text-lg leading-relaxed" style={{color: 'var(--secondary)'}}>
                                {t('fastSyncDescription')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{
                                    background: 'var(--primary)',
                                    boxShadow: '0 8px 32px rgba(9, 105, 218, 0.2)'
                                }}>
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                                    </svg>
                                </div>
                            </div>
                            <h4 className="text-xl font-semibold mb-4">{t('secureManagement')}</h4>
                            <p className="text-lg leading-relaxed" style={{color: 'var(--secondary)'}}>
                                {t('secureDescription')}
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{
                                    background: 'linear-gradient(135deg, var(--primary), var(--warning))',
                                    boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)'
                                }}>
                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor"
                                         viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                    </svg>
                                </div>
                            </div>
                            <h4 className="text-xl font-semibold mb-4">{t('ideIntegration')}</h4>
                            <p className="text-lg leading-relaxed" style={{color: 'var(--secondary)'}}>
                                {t('ideDescription')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-48" style={{
                background: 'var(--card)'
            }}>
                <div className="container mx-auto px-6 py-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        {/* Left: Logo & Copyright */}
                        <div className="flex items-center gap-4">
                            <h3 className="text-xl font-bold" style={{color: 'var(--foreground)'}}>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Barim
                </span>
                            </h3>
                            <span className="text-sm" style={{color: 'var(--secondary)'}}>
                © 2025
              </span>
                        </div>

                        {/* Right: Links */}
                        <div className="flex items-center gap-6">
                            <a
                                href="https://github.com/sangcomz/barim-app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                style={{color: 'var(--secondary)'}}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd"
                                          d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                                          clipRule="evenodd"/>
                                </svg>
                                GitHub
                            </a>
                            <a
                                href="https://github.com/sangcomz/barim-app/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                style={{color: 'var(--secondary)'}}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                                </svg>
                                {t('reportIssue')}
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// 칸반 카드 컴포넌트
function KanbanCard({issue, onUpdateState, onEdit, isLoading}: {
    issue: Issue;
    onUpdateState: (issue: Issue, newState: 'IN PROGRESS' | 'DONE' | 'PENDING') => void;
    onEdit: (issue: Issue) => void;
    isLoading: boolean;
}) {
    const {t} = useLanguage();
    const labels = issue.labels.map(l => l.name);
    const isTask = labels.includes('Task');
    const isTodo = labels.includes('TODO');
    const isInProgress = labels.includes('IN PROGRESS');
    const isDone = labels.includes('DONE');
    const isPending = labels.includes('PENDING');

    // 상태에 따른 카드 스타일링
    const getCardStyle = () => {
        if (isDone) return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
        if (isPending) return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
        if (isInProgress) return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
        return 'border-l-gray-400 bg-gray-50 dark:bg-gray-900/10';
    };

    return (
        <div
            className={`group relative mb-3 p-4 rounded-xl border-l-4 transition-all duration-200 hover:shadow-lg hover:scale-105 ${getCardStyle()} ${isDone ? 'opacity-75' : ''}`}
            style={{
                background: isDone ? 'var(--card)' : 'var(--card)',
                border: '1px solid var(--border)',
                borderLeftWidth: '4px'
            }}>

            {/* Header with title and action buttons */}
            <div className="flex justify-between items-start mb-3">
                <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-semibold text-sm leading-tight hover:text-blue-600 transition-colors flex-1 ${isDone ? 'line-through' : ''}`}
                    style={{color: isDone ? 'var(--secondary)' : 'var(--foreground)'}}
                >
                    {issue.title}
                </a>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {/* Edit button */}
                    <button
                        onClick={() => onEdit(issue)}
                        disabled={isLoading}
                        className="opacity-60 hover:opacity-100 hover:text-blue-500 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                        style={{color: 'var(--secondary)'}}
                        title={t('edit')}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Body text */}
            {issue.body && (
                <div
                    className="text-xs mb-3 leading-relaxed max-h-16 overflow-y-auto"
                    style={{
                        color: 'var(--secondary)',
                        whiteSpace: 'pre-line',
                        wordWrap: 'break-word'
                    }}
                    dangerouslySetInnerHTML={{
                        __html: issue.body.replace(/\n/g, '<br/>')
                    }}
                />
            )}

            {/* Action buttons */}
            {isTask && !isDone && (
                <div className="flex gap-2 mt-4">
                    {isTodo && (
                        <button
                            onClick={() => onUpdateState(issue, 'IN PROGRESS')}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                            disabled={isLoading}
                        >
                            {t('start')}
                        </button>
                    )}
                    {isInProgress && (
                        <>
                            <button
                                onClick={() => onUpdateState(issue, 'DONE')}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                                disabled={isLoading}
                            >
                                {t('complete')}
                            </button>
                            <button
                                onClick={() => onUpdateState(issue, 'PENDING')}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                                disabled={isLoading}
                            >
                                {t('hold')}
                            </button>
                        </>
                    )}
                    {isPending && (
                        <button
                            onClick={() => onUpdateState(issue, 'IN PROGRESS')}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                            disabled={isLoading}
                        >
                            {t('restart')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// 노트 리스트 컴포넌트
function NotesList({issues, onEdit}: { issues: Issue[], onEdit: (issue: Issue) => void }) {
    const {t} = useLanguage();
    const notes = issues.filter(issue => issue.labels.some(label => label.name === 'Note'));

    return (
        <div className="h-full">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                </svg>
                {t('notes')} ({notes.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
                {notes.map(note => (
                    <div key={note.id} className="group card border-purple-200 rounded-lg p-3 relative" style={{
                        backgroundColor: 'var(--card)',
                        borderColor: '#e9d5ff'
                    }}>
                        {/* Edit button for notes - Always visible */}
                        <button
                            onClick={() => onEdit(note)}
                            className="absolute top-2 right-2 opacity-60 hover:opacity-100 hover:text-blue-500 p-1 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                            style={{color: 'var(--secondary)'}}
                            title={t('edit')}
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>

                        <a
                            href={note.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:text-purple-700 block mb-2 pr-8"
                            style={{color: 'var(--foreground)'}}
                        >
                            {note.title}
                        </a>
                        {note.body && (
                            <div
                                className="text-sm line-clamp-2"
                                style={{
                                    color: 'var(--secondary)',
                                    whiteSpace: 'pre-line',
                                    wordWrap: 'break-word'
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: note.body.replace(/\n/g, '<br/>')
                                }}
                            />
                        )}
                    </div>
                ))}
                {notes.length === 0 && (
                    <div className="text-center py-8" style={{color: 'var(--secondary)'}}>
                        <svg className="w-12 h-12 mx-auto mb-3" style={{color: 'var(--border)'}} fill="none"
                             stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                        <p>{t('noNotes')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// 메인 컴포넌트
export default function HomePage() {
    const {data: session, status} = useSession();
    const {t} = useLanguage();
    const [allRepos, setAllRepos] = useState<Repo[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [issues, setIssues] = useState<Issue[]>([]);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newIssueTitle, setNewIssueTitle] = useState('');
    const [newIssueBody, setNewIssueBody] = useState('');
    const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
    const [pendingIssue, setPendingIssue] = useState<Issue | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createItemType, setCreateItemType] = useState<'Task' | 'Note'>('Task');
    const [newTags, setNewTags] = useState('');
    const [pendingReason, setPendingReason] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Edit modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');

    // API 호출 함수들
    const fetchRepos = async () => {
        try {
            const response = await fetch('/api/repos');
            if (!response.ok) throw new Error('Failed to fetch repositories.');
            const data = await response.json();
            const repos = data.repos || data;
            setAllRepos(repos);

            // 마지막 선택된 레포를 로컬스토리지에서 확인
            const lastRepo = localStorage.getItem('lastSelectedRepo');

            if (lastRepo && repos.some((repo: Repo) => repo.name === lastRepo)) {
                // 로컬스토리지에 저장된 레포가 있으면 사용
                setSelectedRepo(lastRepo);
            } else if (repos.length > 0) {
                // 없으면 가장 최근 업데이트된 레포를 자동 선택 (이미 정렬되어 있음)
                setSelectedRepo(repos[0].name);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        }
    };

    const fetchIssues = useCallback(async (projectName: string, pageNum?: number) => {
        if (!projectName) return;
        setIsLoading(true);
        setError(null);

        const currentPage = pageNum !== undefined ? pageNum : page;

        try {
            // 캐시 무효화를 위한 타임스탬프 추가
            const timestamp = new Date().getTime();
            const response = await fetch(`/api/issues?repo=${projectName}&page=${currentPage}&_t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch issues.');
            const data = await response.json();
            setIssues(data.issues || data);

            // 선택된 레포를 로컬스토리지에 저장
            localStorage.setItem('lastSelectedRepo', projectName);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [page]);

    const handleCreateIssue = async (e: FormEvent) => {
        e.preventDefault();
        if (!newIssueTitle) {
            alert(t('titleRequired'));
            return;
        }
        if (!selectedRepo) {
            alert(t('projectRequired'));
            return;
        }
        setIsLoading(true);
        try {
            // 태그 처리 - Note일 때만 태그를 추가
            let bodyWithTags = newIssueBody;
            if (createItemType === 'Note' && newTags.trim()) {
                const tags = newTags.split(',').map(tag => tag.trim()).filter(tag => tag);
                // body에 태그 정보도 추가
                bodyWithTags = newIssueBody + (newIssueBody ? '\n\n' : '') + `Tags: ${tags.join(', ')}`;
            }

            const response = await fetch('/api/issues', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    title: newIssueTitle,
                    body: bodyWithTags,
                    repo: selectedRepo,
                    issueType: createItemType,
                    tags: createItemType === 'Note' && newTags.trim() ?
                        newTags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
                }),
            });
            if (!response.ok) throw new Error('Failed to create issue.');

            setNewIssueTitle('');
            setNewIssueBody('');
            setNewTags('');
            setIsCreateModalOpen(false);

            console.log('새 항목 생성 완료, 리프레시 시작...');

            // 강제 리렌더링 트리거
            setRefreshTrigger(prev => prev + 1);

            // 강제 리프레시 - 여러 단계로 확실하게 처리
            setPage(1);

            // 즉시 한 번 호출
            console.log('첫 번째 fetchIssues 호출...');
            await fetchIssues(selectedRepo, 1);

            // 추가 보장을 위해 약간의 지연 후 다시 호출
            setTimeout(async () => {
                console.log('두 번째 fetchIssues 호출...');
                await fetchIssues(selectedRepo, 1);
                setRefreshTrigger(prev => prev + 1);
            }, 1000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateState = async (issue: Issue, newState: 'IN PROGRESS' | 'DONE' | 'PENDING') => {
        if (newState === 'PENDING') {
            setPendingIssue(issue);
            setIsPendingModalOpen(true);
            return;
        }

        setIsLoading(true);
        let newLabels = issue.labels.map(l => l.name);
        const updatePayload: UpdatePayload = {repo: 'barim-data'};

        if (newState === 'IN PROGRESS') {
            newLabels = newLabels.filter(name => name !== 'TODO');
            newLabels.push('IN PROGRESS');
            updatePayload.labels = newLabels;
        } else if (newState === 'DONE') {
            newLabels = newLabels.filter(name => name !== 'IN PROGRESS');
            newLabels.push('DONE');
            updatePayload.labels = newLabels;
            updatePayload.state = 'closed';
            updatePayload.state_reason = 'completed';
        }

        try {
            const response = await fetch(`/api/issues/${issue.number}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(updatePayload),
            });
            if (!response.ok) throw new Error('Failed to update issue state.');

            await fetchIssues(selectedRepo);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPending = async (e: FormEvent) => {
        e.preventDefault();
        if (!pendingIssue || !pendingReason) return;

        setIsLoading(true);
        try {
            const newLabels = pendingIssue.labels.map(l => l.name).filter(name =>
                name !== 'IN PROGRESS' && name !== 'TODO'
            );
            newLabels.push('PENDING');
            await fetch(`/api/issues/${pendingIssue.number}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    repo: 'barim-data',
                    labels: newLabels
                }),
            });

            await fetch(`/api/issues/${pendingIssue.number}/comments`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    body: `**PENDING:** ${pendingReason}`,
                    repo: 'barim-data'
                }),
            });

            setIsPendingModalOpen(false);
            setPendingReason('');
            setPendingIssue(null);
            await fetchIssues(selectedRepo);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditIssue = (issue: Issue) => {
        setEditingIssue(issue);
        setEditTitle(issue.title);
        setEditBody(issue.body || '');
        setIsEditModalOpen(true);
    };

    const handleUpdateIssue = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingIssue || !editTitle.trim()) {
            alert(t('titleRequired'));
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/issues/${editingIssue.number}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    repo: 'barim-data',
                    title: editTitle.trim(),
                    body: editBody.trim() || null,
                }),
            });

            if (!response.ok) throw new Error('Failed to update issue.');

            setIsEditModalOpen(false);
            setEditingIssue(null);
            setEditTitle('');
            setEditBody('');

            // 강제 리프레시
            setRefreshTrigger(prev => prev + 1);
            await fetchIssues(selectedRepo, 1);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') fetchRepos();
    }, [status]);

    useEffect(() => {
        if (selectedRepo) {
            setPage(1);
            fetchIssues(selectedRepo);
        } else {
            setIssues([]);
        }
    }, [selectedRepo, fetchIssues]);

    useEffect(() => {
        if (selectedRepo) fetchIssues(selectedRepo);
    }, [page, selectedRepo, fetchIssues]);

    // 강제 리프레시 트리거
    useEffect(() => {
        if (selectedRepo && refreshTrigger > 0) {
            console.log('강제 리프레시 트리거 발동:', refreshTrigger);
            fetchIssues(selectedRepo, 1);
        }
    }, [refreshTrigger, selectedRepo, fetchIssues]);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!session) {
        return <LandingPage/>;
    }

    // 칸반 보드용 이슈들 분류
    const tasks = issues.filter(issue => issue.labels.some(label => label.name === 'Task'));
    const todoTasks = tasks.filter(issue => issue.labels.some(label => label.name === 'TODO'));
    const inProgressTasks = tasks.filter(issue => issue.labels.some(label => label.name === 'IN PROGRESS'));
    const doneTasks = tasks.filter(issue => issue.labels.some(label => label.name === 'DONE'));
    const pendingTasks = tasks.filter(issue => issue.labels.some(label => label.name === 'PENDING'));

    return (
        <div className="min-h-screen" style={{background: 'var(--background)'}}>
            {/* Header */}
            <header className="sticky top-0 z-40 mb-6" style={{
                background: 'var(--card)',
                borderBottom: '1px solid var(--border)'
            }}>
                <div className="container mx-auto">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-6">
                            <h1 className="text-2xl font-bold" style={{color: 'var(--foreground)'}}>Barim</h1>
                            <div className="text-sm" style={{color: 'var(--secondary)'}}>
                                {session.user?.name}{t('greeting')}
                            </div>

                            {/* Project Selector */}
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedRepo}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRepo(e.target.value)}
                                    className="select text-sm"
                                    style={{minWidth: '280px'}}
                                >
                                    <option value="">{t('selectProject')}</option>
                                    {allRepos.map(repo => (
                                        <option key={repo.id} value={repo.name}>{repo.name}</option>
                                    ))}
                                </select>

                                {selectedRepo && (
                                    <div className="text-xs text-center px-2"
                                         style={{color: 'var(--secondary)', width: '100%'}}>
                                        <div className="text-xs">
                                            {tasks.length}{t('tasksAndNotes', {notes: issues.filter(i => i.labels.some(l => l.name === 'Note')).length})}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <LanguageToggle/>
                            <ThemeToggle/>
                            <button onClick={() => signOut()} className="btn btn-secondary">
                                {t('logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Loading Progress Bar */}
            {isLoading && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <div className="h-1 bg-gray-200 dark:bg-gray-700">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 animate-pulse"></div>
                    </div>
                </div>
            )}

            <div className="container mx-auto py-6">
                {selectedRepo && (
                    <>
                        {/* Create New Item Button */}
                        <div className="mb-6">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                </svg>
                                새 항목 생성
                            </button>
                        </div>

                        {error && (
                            <div className="rounded-lg p-4 mb-6" style={{
                                backgroundColor: '#fef2f2',
                                border: '1px solid #fecaca'
                            }}>
                                <p style={{color: '#b91c1c'}}>에러: {error}</p>
                            </div>
                        )}

                        {/* Main Content Area */}
                        <div className="grid grid-cols-4 gap-6">
                            {/* Kanban Board - 3/4 */}
                            <div className="col-span-3">
                                <div className="grid grid-cols-3 gap-4 mb-6 items-stretch">
                                    {/* TODO Column */}
                                    <div className="group flex flex-col">
                                        <div className="card p-4 h-full min-h-[200px] flex flex-col" style={{
                                            background: 'var(--card)',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <h3 className="font-bold mb-4 flex items-center gap-3 text-sm flex-shrink-0">
                                                <div className="w-3 h-3 bg-gray-400 rounded-full shadow-sm"></div>
                                                <span>TODO</span>
                                                <div
                                                    className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center ml-auto">
                          <span className="text-xs font-bold" style={{color: 'var(--secondary)'}}>
                            {todoTasks.length}
                          </span>
                                                </div>
                                            </h3>
                                            <div className="space-y-3 flex-1 overflow-y-auto">
                                                {todoTasks.map(task => (
                                                    <div key={task.id} className="group">
                                                        <KanbanCard
                                                            issue={task}
                                                            onUpdateState={handleUpdateState}
                                                            onEdit={handleEditIssue}
                                                            isLoading={isLoading}
                                                        />
                                                    </div>
                                                ))}
                                                {todoTasks.length === 0 && (
                                                    <div
                                                        className="flex flex-col items-center justify-center text-center py-20 text-xs mb-4"
                                                        style={{color: 'var(--secondary)'}}>
                                                        <div
                                                            className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                            <span className="text-lg">📝</span>
                                                        </div>
                                                        할 일이 없습니다
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* IN PROGRESS Column */}
                                    <div className="group flex flex-col">
                                        <div className="card p-4 h-full min-h-[200px] flex flex-col" style={{
                                            background: 'var(--card)',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <h3 className="font-bold mb-4 flex items-center gap-3 text-sm flex-shrink-0">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                                                <span>IN PROGRESS</span>
                                                <div
                                                    className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center ml-auto">
                          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                            {inProgressTasks.length}
                          </span>
                                                </div>
                                            </h3>
                                            <div className="space-y-3 flex-1 overflow-y-auto">
                                                {inProgressTasks.map(task => (
                                                    <div key={task.id} className="group">
                                                        <KanbanCard
                                                            issue={task}
                                                            onUpdateState={handleUpdateState}
                                                            onEdit={handleEditIssue}
                                                            isLoading={isLoading}
                                                        />
                                                    </div>
                                                ))}
                                                {inProgressTasks.length === 0 && (
                                                    <div
                                                        className="flex flex-col items-center justify-center text-center py-20 text-xs mb-4"
                                                        style={{color: 'var(--secondary)'}}>
                                                        <div
                                                            className="w-12 h-12 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                            <span className="text-lg">🚀</span>
                                                        </div>
                                                        진행 중인 작업이 없습니다
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* DONE Column */}
                                    <div className="group flex flex-col">
                                        <div className="card p-4 h-full min-h-[200px] flex flex-col" style={{
                                            background: 'var(--card)',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <h3 className="font-bold mb-4 flex items-center gap-3 text-sm flex-shrink-0">
                                                <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                                                <span>DONE</span>
                                                <div
                                                    className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center ml-auto">
                          <span className="text-xs font-bold text-green-700 dark:text-green-300">
                            {doneTasks.length}
                          </span>
                                                </div>
                                            </h3>
                                            <div className="space-y-3 flex-1 overflow-y-auto">
                                                {doneTasks.map(task => (
                                                    <div key={task.id} className="group">
                                                        <KanbanCard
                                                            issue={task}
                                                            onUpdateState={handleUpdateState}
                                                            onEdit={handleEditIssue}
                                                            isLoading={isLoading}
                                                        />
                                                    </div>
                                                ))}
                                                {doneTasks.length === 0 && (
                                                    <div
                                                        className="flex flex-col items-center justify-center text-center py-20 text-xs mb-4"
                                                        style={{color: 'var(--secondary)'}}>
                                                        <div
                                                            className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <span className="text-lg">✅</span>
                                                        </div>
                                                        완료된 작업이 없습니다
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Row: PENDING (Full Width) */}
                                <div className="w-full">
                                    <div className="group">
                                        <div className="card p-4 h-fit min-h-[200px]" style={{
                                            background: 'var(--card)',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <h3 className="font-bold mb-4 flex items-center gap-3 text-sm">
                                                <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm"></div>
                                                <span>PENDING</span>
                                                <div
                                                    className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center ml-auto">
                          <span className="text-xs font-bold text-yellow-700 dark:text-yellow-300">
                            {pendingTasks.length}
                          </span>
                                                </div>
                                            </h3>
                                            <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                                                {pendingTasks.map(task => (
                                                    <div key={task.id} className="group">
                                                        <KanbanCard
                                                            issue={task}
                                                            onUpdateState={handleUpdateState}
                                                            onEdit={handleEditIssue}
                                                            isLoading={isLoading}
                                                        />
                                                    </div>
                                                ))}
                                                {pendingTasks.length === 0 && (
                                                    <div
                                                        className="col-span-4 flex flex-col items-center justify-center text-center py-12 text-xs"
                                                        style={{color: 'var(--secondary)'}}>
                                                        <div
                                                            className="w-12 h-12 mx-auto mb-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                                            <span className="text-lg">⏸️</span>
                                                        </div>
                                                        보류된 작업이 없습니다
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section - 1/4 */}
                            <div className="col-span-1">
                                <div className="card p-4">
                                    <NotesList issues={issues} onEdit={handleEditIssue}/>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Create Item Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-md mx-4" style={{maxHeight: '80vh', overflowY: 'auto'}}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">새 항목 생성</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="hover:text-red-500 p-1"
                                style={{color: 'var(--secondary)'}}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateIssue} className="space-y-3">
                            {/* Type Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>타입</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="itemType"
                                            value="Task"
                                            checked={createItemType === 'Task'}
                                            onChange={(e) => setCreateItemType(e.target.value as 'Task' | 'Note')}
                                            className="radio"
                                        />
                                        <span className="text-sm">📋 Task</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="itemType"
                                            value="Note"
                                            checked={createItemType === 'Note'}
                                            onChange={(e) => setCreateItemType(e.target.value as 'Task' | 'Note')}
                                            className="radio"
                                        />
                                        <span className="text-sm">📝 Note</span>
                                    </label>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>제목</label>
                                <input
                                    type="text"
                                    value={newIssueTitle}
                                    onChange={(e) => setNewIssueTitle(e.target.value)}
                                    placeholder="제목을 입력하세요"
                                    className="input"
                                    required
                                />
                            </div>

                            {/* Body */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>상세
                                    내용</label>
                                <textarea
                                    value={newIssueBody}
                                    onChange={(e) => setNewIssueBody(e.target.value)}
                                    placeholder="상세 내용 (선택사항)"
                                    className="textarea"
                                    rows={3}
                                />
                            </div>

                            {/* Tags - Only for Note */}
                            {createItemType === 'Note' && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium"
                                           style={{color: 'var(--foreground)'}}>태그</label>
                                    <input
                                        type="text"
                                        value={newTags}
                                        onChange={(e) => setNewTags(e.target.value)}
                                        placeholder="태그를 쉼표로 구분하여 입력하세요"
                                        className="input"
                                    />
                                    <p className="text-xs" style={{color: 'var(--secondary)'}}>
                                        tag:태그명 형태의 라벨로 추가됩니다.
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="btn btn-secondary text-sm px-3 py-2"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`btn btn-primary text-sm px-3 py-2 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            생성 중...
                                        </div>
                                    ) : (
                                        `${createItemType === 'Task' ? '📋' : '📝'} 생성`
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Pending Modal */}
            {isPendingModalOpen && pendingIssue && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {pendingIssue.title} 보류 사유
                        </h3>
                        <form onSubmit={handleConfirmPending}>
              <textarea
                  value={pendingReason}
                  onChange={(e) => setPendingReason(e.target.value)}
                  placeholder="보류하는 이유를 입력하세요..."
                  className="textarea mb-4"
                  required
              />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPendingModalOpen(false)}
                                    className="btn btn-secondary"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`btn btn-warning ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            처리 중...
                                        </div>
                                    ) : (
                                        '확인'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Issue Modal */}
            {isEditModalOpen && editingIssue && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-md mx-4" style={{maxHeight: '80vh', overflowY: 'auto'}}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">카드 편집</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="hover:text-red-500 p-1"
                                style={{color: 'var(--secondary)'}}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateIssue} className="space-y-3">
                            {/* Title */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>제목</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder="제목을 입력하세요"
                                    className="input"
                                    required
                                />
                            </div>

                            {/* Body */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>상세
                                    내용</label>
                                <textarea
                                    value={editBody}
                                    onChange={(e) => setEditBody(e.target.value)}
                                    placeholder="상세 내용"
                                    className="textarea"
                                    rows={4}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="btn btn-secondary text-sm px-3 py-2"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`btn btn-primary text-sm px-3 py-2 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            수정 중...
                                        </div>
                                    ) : (
                                        '저장'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
