'use client';

import {useState, useEffect, FormEvent, ChangeEvent, useCallback} from 'react';
import {useSession, signIn, signOut} from "next-auth/react";
import {useLanguage} from '@/contexts/LanguageContext';
import {SettingsDropdown} from '@/components/SettingsDropdown';
import {GitHubAppInstallOverlay} from '@/components/GitHubAppInstallOverlay';
import {barimApi} from '@/lib/api-config';
import {checkGitHubAppInstallation} from '@/lib/github-utils';

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

interface Project {
    name: string;
    label: string;
    color: string;
    description?: string;
    issueCount: number;
}

interface Repository {
    id: number;
    name: string;
    full_name: string;
    description?: string | null;
    updated_at: string;
}

interface UpdatePayload {
    repo: string;
    labels?: string[];
    state?: string;
    state_reason?: string;
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
                <SettingsDropdown/>
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
                        <SettingsDropdown/>
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
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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

    // tag: 접두사가 있는 라벨들을 추출하고 정리
    const tagLabels = labels
        .filter(label => label.startsWith('tag:'))
        .map(label => label.replace('tag:', ''));

    // 상태에 따른 카드 스타일링
    const getCardStyle = () => {
        if (isDone) return 'bg-green-50 dark:bg-green-900/10';
        if (isPending) return 'bg-orange-50 dark:bg-orange-900/10';
        if (isInProgress) return 'bg-blue-50 dark:bg-blue-900/10';
        return 'bg-slate-50 dark:bg-slate-900/10';
    };

    return (
        <div
            className={`group relative mb-3 p-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-105 ${getCardStyle()} ${isDone ? 'opacity-75' : ''}`}
            style={{
                background: isDone ? 'var(--card)' : 'var(--card)',
                border: '1px solid var(--border)',
                borderLeftWidth: '8px',
                borderLeftColor: isDone ? '#22C55E' : isInProgress ? '#3B82F6' : isPending ? '#EAB308' : '#94A3B8',
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
                        className="opacity-60"
                        style={{
                            color: 'var(--secondary)',
                            border: 'none',
                            background: 'transparent',
                        }}
                        title={t('edit')}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
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

            {/* Tags Display */}
            {tagLabels.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {tagLabels.map((tag, index) => (
                        <span
                            key={index}
                            className="inline-block px-3 py-1.5 text-xs rounded-full"
                            style={{
                                backgroundColor: 'var(--primary)',
                                color: 'white',
                                fontSize: '0.65rem',
                                fontWeight: '500'
                            }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Action buttons */}
            {isTask && !isDone && (
                <div className="flex gap-2 mt-4">
                    {isTodo && (
                        <button
                            onClick={() => onUpdateState(issue, 'IN PROGRESS')}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-4 rounded-lg font-semibold transition-colors duration-200"
                            disabled={isLoading}
                            style={{border: 'none'}}
                        >
                            {t('start')}

                        </button>
                    )}
                    {isInProgress && (
                        <>
                            <button
                                onClick={() => onUpdateState(issue, 'DONE')}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs px-4 py-4 rounded-lg font-semibold transition-colors duration-200"
                                disabled={isLoading}
                                style={{border: 'none'}}
                            >
                                {t('complete')}
                            </button>
                            <button
                                onClick={() => onUpdateState(issue, 'PENDING')}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-4 py-4 rounded-lg font-semibold transition-colors duration-200"
                                disabled={isLoading}
                                style={{border: 'none'}}
                            >
                                {t('hold')}
                            </button>
                        </>
                    )}
                    {isPending && (
                        <button
                            onClick={() => onUpdateState(issue, 'IN PROGRESS')}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-xs px-4 py-4 rounded-lg font-semibold transition-colors duration-200"
                            disabled={isLoading}
                            style={{border: 'none'}}
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
                {notes.map(note => {
                    // tag: 접두사가 있는 라벨들을 추출하고 정리
                    const tagLabels = note.labels
                        .map(l => l.name)
                        .filter(label => label.startsWith('tag:'))
                        .map(label => label.replace('tag:', ''));

                    return (
                        <div key={note.id} className="group card border-purple-200 rounded-lg p-3 relative" style={{
                            backgroundColor: 'var(--card)',
                            borderColor: '#e9d5ff'
                        }}>
                            <div className="flex justify-between items-start mb-2">
                                <a
                                    href={note.html_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:text-purple-700 flex-1"
                                    style={{color: 'var(--foreground)'}}
                                >
                                    {note.title}
                                </a>
                                {/* Edit button for notes */}
                                <button
                                    onClick={() => onEdit(note)}
                                    className="opacity-60 hover:opacity-100 hover:text-blue-500 p-1 transition-all duration-200 ml-2 flex-shrink-0"
                                    style={{
                                        color: 'var(--secondary)',
                                        border: 'none',
                                        background: 'transparent'
                                    }}
                                    title={t('edit')}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                </button>
                            </div>

                            {note.body && (
                                <div
                                    className="text-sm mb-2"
                                    style={{
                                        color: 'var(--secondary)',
                                        whiteSpace: 'pre-line',
                                        wordWrap: 'break-word',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 5,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        lineHeight: '1.4em',
                                        maxHeight: '7em' // 5줄 * 1.4em line-height
                                    }}
                                    dangerouslySetInnerHTML={{
                                        __html: note.body.replace(/\n/g, '<br/>')
                                    }}
                                />
                            )}

                            {/* Tags Display for Notes */}
                            {tagLabels.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tagLabels.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="inline-block px-4 py-2 text-xs rounded-full"
                                            style={{
                                                backgroundColor: '#e9d5ff',
                                                color: '#7c3aed',
                                                fontSize: '0.65rem',
                                                fontWeight: '500'
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
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
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [issues, setIssues] = useState<Issue[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
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

    // GitHub App Install states
    const [showInstallOverlay, setShowInstallOverlay] = useState(false);
    const [isCheckingInstall, setIsCheckingInstall] = useState(false);
    const [isGitHubAppInstalled, setIsGitHubAppInstalled] = useState(false);

    // Add Project modal states
    const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
    const [availableRepos, setAvailableRepos] = useState<Repository[]>([]);
    const [selectedRepoForProject, setSelectedRepoForProject] = useState<string>('');
    const [customProjectName, setCustomProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [addProjectMode, setAddProjectMode] = useState<'repo' | 'custom'>('repo');

    // Edit modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editBody, setEditBody] = useState('');

    // API 호출 함수들
    const checkGitHubAppInstall = useCallback(async () => {
        if (!session?.accessToken) {
            return;
        }
        
        setIsCheckingInstall(true);
        
        try {
            const data = await checkGitHubAppInstallation(session.accessToken);
            console.log('GitHub App 설치 상태:', data);
            
            // 실제 GitHub 앱 설치 상태 업데이트
            const appInstalled = data.isAppInstalled && data.hasBarimDataRepo;
            setIsGitHubAppInstalled(appInstalled);
            
            // 앱이 설치되지 않았거나 barim-data 레포지토리가 없으면 오버레이 표시
            if (!appInstalled) {
                console.log('오버레이 표시 - 앱 설치됨:', data.isAppInstalled, 'barim-data 존재:', data.hasBarimDataRepo);
                setShowInstallOverlay(true);
            } else {
                setShowInstallOverlay(false);
            }
        } catch (error) {
            console.error('Error checking GitHub App installation:', error);
            setIsGitHubAppInstalled(false);
            setShowInstallOverlay(true);
        } finally {
            setIsCheckingInstall(false);
        }
    }, [session?.accessToken]);

    const fetchProjects = useCallback(async () => {
        try {
            if (!session?.accessToken) throw new Error('No access token available');
            const data = await barimApi.getProjects(session.accessToken);
            const projects = data.projects || [];
            setAllProjects(projects);

            // 마지막 선택된 프로젝트를 로컬스토리지에서 확인
            const lastProject = localStorage.getItem('lastSelectedProject');

            if (lastProject && projects.some((project: Project) => project.name === lastProject)) {
                // 로컬스토리지에 저장된 프로젝트가 있으면 사용
                setSelectedProject(lastProject);
            } else if (projects.length > 0) {
                // 없으면 첫 번째 프로젝트를 자동 선택
                setSelectedProject(projects[0].name);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        }
    }, [session?.accessToken]);

    const fetchAvailableRepos = async () => {
        try {
            if (!session?.accessToken) throw new Error('No access token available');
            const data = await barimApi.getRepos(session.accessToken);
            setAvailableRepos(data.repositories || []);
        } catch (err) {
            console.error('Error fetching repositories:', err);
            setAvailableRepos([]);
        }
    };

    const handleAddProject = async (e: FormEvent) => {
        e.preventDefault();
        
        let projectName = '';
        if (addProjectMode === 'repo' && selectedRepoForProject) {
            projectName = selectedRepoForProject;
        } else if (addProjectMode === 'custom' && customProjectName.trim()) {
            projectName = customProjectName.trim();
        }

        if (!projectName) {
            alert(t('projectNameRequired'));
            return;
        }

        setIsLoading(true);
        try {
            if (!session?.accessToken) throw new Error('No access token available');
            await barimApi.createProject(session.accessToken, {
                projectName,
                description: projectDescription.trim() || undefined,
            });

            // 모달 닫기 및 상태 초기화
            setIsAddProjectModalOpen(false);
            setSelectedRepoForProject('');
            setCustomProjectName('');
            setProjectDescription('');
            setAddProjectMode('repo');

            // 프로젝트 목록 새로고침
            await fetchProjects();
            
            // 새로 추가된 프로젝트 자동 선택
            setSelectedProject(projectName);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchIssues = useCallback(async (projectName: string, pageNum?: number, appendMode: boolean = false) => {
        if (!projectName) return;
        
        if (appendMode) {
            setIsLoadingMore(true);
        } else {
            setIsLoading(true);
        }
        
        setError(null);

        const targetPage = pageNum !== undefined ? pageNum : (appendMode ? currentPage + 1 : 1);

        try {
            if (!session?.accessToken) throw new Error('No access token available');
            // 캐시 무효화를 위한 타임스탬프 추가
            const timestamp = new Date().getTime();
            const params = new URLSearchParams({
                repo: projectName,
                page: targetPage.toString(),
                _t: timestamp.toString()
            });
            const data = await barimApi.getIssues(session.accessToken, params);
            
            const newIssues = data.issues || data;
            
            if (appendMode) {
                // 기존 이슈에 새 이슈들 추가
                setIssues(prevIssues => [...prevIssues, ...newIssues]);
                setCurrentPage(targetPage);
            } else {
                // 기존 이슈들 교체
                setIssues(newIssues);
                setCurrentPage(targetPage);
            }
            
            // 다음 페이지 존재 여부 설정
            setHasNextPage(data.meta?.hasNextPage || false);

            // 선택된 레포를 로컬스토리지에 저장 (새로운 프로젝트 선택시에만)
            if (!appendMode) {
                localStorage.setItem('lastSelectedRepo', projectName);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            if (appendMode) {
                setIsLoadingMore(false);
            } else {
                setIsLoading(false);
            }
        }
    }, [currentPage, session?.accessToken]);

    const handleCreateIssue = async (e: FormEvent) => {
        e.preventDefault();
        if (!newIssueTitle) {
            alert(t('titleRequired'));
            return;
        }
        if (!selectedProject) {
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

            if (!session?.accessToken) throw new Error('No access token available');
            await barimApi.createIssue(session.accessToken, {
                title: newIssueTitle,
                body: bodyWithTags,
                repo: selectedProject,
                issueType: createItemType,
                tags: createItemType === 'Note' && newTags.trim() ?
                    newTags.split(',').map(tag => tag.trim()).filter(tag => tag) : []
            });

            setNewIssueTitle('');
            setNewIssueBody('');
            setNewTags('');
            setIsCreateModalOpen(false);

            // 강제 리렌더링 트리거
            setRefreshTrigger(prev => prev + 1);

            // 강제 리프레시 - 여러 단계로 확실하게 처리
            setCurrentPage(1);
            setHasNextPage(false);

            // 즉시 한 번 호출
            console.log('첫 번째 fetchIssues 호출...');
            await fetchIssues(selectedProject, 1, false);

            // 추가 보장을 위해 약간의 지연 후 다시 호출
            setTimeout(async () => {
                console.log('두 번째 fetchIssues 호출...');
                await fetchIssues(selectedProject, 1, false);
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
            if (!session?.accessToken) throw new Error('No access token available');
            await barimApi.updateIssue(session.accessToken, issue.number, updatePayload);

            await fetchIssues(selectedProject, 1, false);
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
            if (!session?.accessToken) throw new Error('No access token available');
            await barimApi.updateIssue(session.accessToken, pendingIssue.number, {
                repo: 'barim-data',
                labels: newLabels
            });

            await barimApi.addComment(session.accessToken, pendingIssue.number, {
                body: `**PENDING:** ${pendingReason}`
            });

            setIsPendingModalOpen(false);
            setPendingReason('');
            setPendingIssue(null);
            await fetchIssues(selectedProject, 1, false);
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
            if (!session?.accessToken) throw new Error('No access token available');
            await barimApi.updateIssue(session.accessToken, editingIssue.number, {
                repo: 'barim-data',
                title: editTitle.trim(),
                body: editBody.trim() || null,
            });

            setIsEditModalOpen(false);
            setEditingIssue(null);
            setEditTitle('');
            setEditBody('');

            // 강제 리프레시
            setRefreshTrigger(prev => prev + 1);
            setCurrentPage(1);
            setHasNextPage(false);
            await fetchIssues(selectedProject, 1, false);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (selectedProject && hasNextPage && !isLoadingMore) {
            fetchIssues(selectedProject, undefined, true);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            // 세션 에러 체크 (토큰 리프레시 실패)
            if (session?.error === 'RefreshAccessTokenError') {
                console.log('Token refresh failed, signing out...');
                signOut({ callbackUrl: '/' });
                return;
            }
            
            checkGitHubAppInstall();
            fetchProjects();
        }
    }, [status, session?.error, checkGitHubAppInstall, fetchProjects]);

    useEffect(() => {
        if (selectedProject) {
            setCurrentPage(1);
            setHasNextPage(false);
            fetchIssues(selectedProject, 1, false);
        } else {
            setIssues([]);
            setCurrentPage(1);
            setHasNextPage(false);
        }
    }, [selectedProject, fetchIssues]);

    // 강제 리프레시 트리거
    useEffect(() => {
        if (selectedProject && refreshTrigger > 0) {
            console.log('강제 리프레시 트리거 발동:', refreshTrigger);
            setCurrentPage(1);
            setHasNextPage(false);
            fetchIssues(selectedProject, 1, false);
        }
    }, [refreshTrigger, selectedProject, fetchIssues]);

    if (status === "loading" || isCheckingInstall) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--background)' }}>
                <div className="spinner mb-4"></div>
                <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                    {isCheckingInstall ? 'GitHub App 설치 상태 확인 중...' : '로딩 중...'}
                </p>
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
        <div className="min-h-screen flex flex-col" style={{background: 'var(--background)'}}>
            {/* Header */}
            <header className="sticky top-0 z-40 mb-6" style={{
                background: 'var(--card)',
                borderBottom: '1px solid var(--border)'
            }}>
                <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                            <h1 className="text-xl sm:text-2xl font-bold" style={{color: 'var(--foreground)'}}>Barim</h1>
                            <div className="text-sm" style={{color: 'var(--secondary)'}}>
                                {session.user?.name}{t('greeting')}
                            </div>

                            {/* Project Selector */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <select
                                    value={selectedProject}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProject(e.target.value)}
                                    className="select text-sm w-full sm:w-auto"
                                    style={{minWidth: '200px'}}
                                    disabled={!isGitHubAppInstalled}
                                >
                                    <option value="">{t('selectProject')}</option>
                                    {allProjects.map(project => (
                                        <option key={project.name} value={project.name}>
                                            {project.name} ({project.issueCount})
                                        </option>
                                    ))}
                                </select>

                                {selectedProject && (
                                    <div className="text-xs text-center px-2"
                                         style={{color: 'var(--secondary)', width: '100%'}}>
                                        <div className="text-xs">
                                            {tasks.length}{t('tasksAndNotes', {notes: issues.filter(i => i.labels.some(l => l.name === 'Note')).length})}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            {/* Add Project Button or GitHub Setup Button */}
                            {isGitHubAppInstalled ? (
                                <button
                                    onClick={() => {
                                        setIsAddProjectModalOpen(true);
                                        fetchAvailableRepos();
                                    }}
                                    className="btn btn-secondary text-sm flex items-center justify-center gap-2 py-3"
                                    title={t('addProject')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                                    </svg>
                                    <span className="hidden sm:inline">{t('addProject')}</span>
                                    <span className="sm:hidden">프로젝트 추가</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => setShowInstallOverlay(true)}
                                    className="btn btn-primary text-sm flex items-center justify-center gap-2 py-3"
                                    title={t('setupGitHub')}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                                    </svg>
                                    <span className="hidden sm:inline">{t('setupGitHub')}</span>
                                    <span className="sm:hidden">GitHub 설정</span>
                                </button>
                            )}
                            <SettingsDropdown/>
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

            <div className="w-full px-4 sm:px-6 py-4 sm:py-6 flex-1">
                {/* Create New Item Button */}
                {selectedProject && (
                    <div className="mb-6">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="btn btn-primary flex items-center justify-center gap-2 w-full sm:w-auto py-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                            {t('createNewItem')}
                        </button>
                    </div>
                )}

                {error && isGitHubAppInstalled && (
                    <div className="rounded-lg p-4 mb-6" style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca'
                    }}>
                        <p style={{color: '#b91c1c'}}>{t('error')}: {error}</p>
                    </div>
                )}

                {/* Project Selection Message */}
                {!selectedProject && (
                    <div className="mb-6 p-4 rounded-lg text-center" style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)'
                    }}>
                        <p style={{color: 'var(--secondary)'}}>{t('selectProjectToStart')}</p>
                    </div>
                )}

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Kanban Board - 3/4 on desktop, full width on mobile */}
                            <div className="lg:col-span-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 items-stretch">
                                    {/* TODO Column */}
                                    <div className="group flex flex-col">
                                        <div className="card p-4 h-full min-h-[400px] flex flex-col w-full" style={{
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
                                            <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
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
                                                        className="flex flex-col items-center justify-center text-center h-full min-h-[350px]"
                                                        style={{color: 'var(--secondary)'}}>
                                                        <div
                                                            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                            <span className="text-2xl">📝</span>
                                                        </div>
                                                        <p className="text-sm">{t('noTasks')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* IN PROGRESS Column */}
                                    <div className="group flex flex-col">
                                        <div className="card p-4 h-full min-h-[400px] flex flex-col w-full" style={{
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
                                            <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
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
                                                        className="flex flex-col items-center justify-center text-center h-full min-h-[350px]"
                                                        style={{color: 'var(--secondary)'}}>
                                                        <div
                                                            className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                            <span className="text-2xl">🚀</span>
                                                        </div>
                                                        <p className="text-sm">{t('noInProgress')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* DONE Column */}
                                    <div className="group flex flex-col">
                                        <div className="card p-4 h-full min-h-[400px] flex flex-col w-full" style={{
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
                                            <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
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
                                                        className="flex flex-col items-center justify-center text-center h-full min-h-[350px]"
                                                        style={{color: 'var(--secondary)'}}>
                                                        <div
                                                            className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                            <span className="text-2xl">✅</span>
                                                        </div>
                                                        <p className="text-sm">{t('noDone')}</p>
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
                                            <div
                                                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto min-h-[300px]">
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
                                                        className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 flex flex-col items-center justify-center text-center h-full min-h-[350px]"
                                                        style={{color: 'var(--secondary)'}}>
                                                        <div
                                                            className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                                            <span className="text-2xl">⏸️</span>
                                                        </div>
                                                        <p className="text-sm">{t('noPending')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section - 1/4 on desktop, full width on mobile */}
                            <div className="lg:col-span-1">
                                <div className="card p-4">
                                    <NotesList issues={selectedProject ? issues : []} onEdit={handleEditIssue}/>
                                </div>
                            </div>
                        </div>

                {/* 더 보기 버튼 */}
                {selectedProject && hasNextPage && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleLoadMore}
                            disabled={isLoadingMore}
                            className={`btn btn-secondary ${isLoadingMore ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {isLoadingMore ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    {t('loading')}...
                                </div>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    {t('loadMore')}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* GitHub App Install Overlay */}
            {showInstallOverlay && (
                <GitHubAppInstallOverlay 
                    onClose={() => setShowInstallOverlay(false)} 
                />
            )}

            {/* Footer */}
            <footer style={{
                background: 'var(--card)',
                borderTop: '1px solid var(--border)',
                marginTop: '24px'
            }}>
                <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
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
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
                                {t('reportIssue')}
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Create Item Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-md mx-4" style={{maxHeight: '80vh', overflowY: 'auto'}}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{t('createNewItem')}</h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="hover:text-red-500 p-1 text-2xl"
                                style={{
                                    color: 'var(--secondary)',
                                    background: 'transparent', border: 'none'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateIssue} className="space-y-3">
                            {/* Type Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>{t('type')}</label>
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
                                        <span className="text-sm">{t('task')}</span>
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
                                        <span className="text-sm">{t('note')}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Title */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>{t('title')}</label>
                                <input
                                    type="text"
                                    value={newIssueTitle}
                                    onChange={(e) => setNewIssueTitle(e.target.value)}
                                    placeholder={t('titlePlaceholder')}
                                    className="input"
                                    required
                                />
                            </div>

                            {/* Body */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>{t('content')}</label>
                                <textarea
                                    value={newIssueBody}
                                    onChange={(e) => setNewIssueBody(e.target.value)}
                                    placeholder={t('contentPlaceholder')}
                                    className="textarea"
                                    rows={3}
                                />
                            </div>

                            {/* Tags - Only for Note */}
                            {createItemType === 'Note' && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium"
                                           style={{color: 'var(--foreground)'}}>{t('tags')}</label>
                                    <input
                                        type="text"
                                        value={newTags}
                                        onChange={(e) => setNewTags(e.target.value)}
                                        placeholder={t('tagsPlaceholder')}
                                        className="input"
                                    />
                                    <p className="text-xs" style={{color: 'var(--secondary)'}}>
                                        {t('tagsHelp')}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="btn btn-secondary text-sm px-3 py-2"
                                >
                                    {t('cancel')}
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
                                            {t('creating')}
                                        </div>
                                    ) : (
                                        t(createItemType === 'Task' ? 'createTask' : 'createNote')
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
                            {pendingIssue.title} {t('pendingReason')}
                        </h3>
                        <form onSubmit={handleConfirmPending}>
              <textarea
                  value={pendingReason}
                  onChange={(e) => setPendingReason(e.target.value)}
                  placeholder={t('pendingReasonPlaceholder')}
                  className="textarea mb-4"
                  required
              />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsPendingModalOpen(false)}
                                    className="btn btn-secondary"
                                >
                                    {t('cancel')}
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
                                            {t('processing')}
                                        </div>
                                    ) : (
                                        t('confirm')
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
                            <h3 className="text-lg font-semibold">{t('editCard')}</h3>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="hover:text-red-500 p-1 text-2xl"
                                style={{color: 'var(--secondary)', border: 'none', background: 'transparent'}}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleUpdateIssue} className="space-y-3">
                            {/* Title */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>{t('title')}</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    placeholder={t('titlePlaceholder')}
                                    className="input"
                                    required
                                />
                            </div>

                            {/* Body */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>{t('content')}</label>
                                <textarea
                                    value={editBody}
                                    onChange={(e) => setEditBody(e.target.value)}
                                    placeholder={t('contentRequired')}
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
                                    {t('cancel')}
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
                                            {t('updating')}
                                        </div>
                                    ) : (
                                        t('save')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Project Modal */}
            {isAddProjectModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card w-full max-w-md mx-4" style={{maxHeight: '80vh', overflowY: 'auto'}}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{t('addProject')}</h3>
                            <button
                                onClick={() => setIsAddProjectModalOpen(false)}
                                className="hover:text-red-500 p-1 text-2xl"
                                style={{color: 'var(--secondary)', border: 'none', background: 'transparent'}}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAddProject} className="space-y-4">
                            {/* Mode Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>{t('projectSource')}</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="addProjectMode"
                                            value="repo"
                                            checked={addProjectMode === 'repo'}
                                            onChange={(e) => setAddProjectMode(e.target.value as 'repo' | 'custom')}
                                            className="radio"
                                        />
                                        <span className="text-sm">{t('fromRepository')}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="addProjectMode"
                                            value="custom"
                                            checked={addProjectMode === 'custom'}
                                            onChange={(e) => setAddProjectMode(e.target.value as 'repo' | 'custom')}
                                            className="radio"
                                        />
                                        <span className="text-sm">{t('customName')}</span>
                                    </label>
                                </div>
                            </div>

                            {/* Repository Selection */}
                            {addProjectMode === 'repo' && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>{t('selectRepository')}</label>
                                    <select
                                        value={selectedRepoForProject}
                                        onChange={(e) => setSelectedRepoForProject(e.target.value)}
                                        className="select"
                                        required={addProjectMode === 'repo'}
                                    >
                                        <option value="">{t('selectRepository')}</option>
                                        {availableRepos.map(repo => (
                                            <option key={repo.id} value={repo.name}>
                                                {repo.name}
                                                {repo.description && ` - ${repo.description.substring(0, 50)}${repo.description.length > 50 ? '...' : ''}`}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs" style={{color: 'var(--secondary)'}}>
                                        {t('repositoryHelp')}
                                    </p>
                                </div>
                            )}

                            {/* Custom Project Name */}
                            {addProjectMode === 'custom' && (
                                <div className="space-y-1">
                                    <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>{t('projectName')}</label>
                                    <input
                                        type="text"
                                        value={customProjectName}
                                        onChange={(e) => setCustomProjectName(e.target.value)}
                                        placeholder={t('projectNamePlaceholder')}
                                        className="input"
                                        required={addProjectMode === 'custom'}
                                    />
                                    <p className="text-xs" style={{color: 'var(--secondary)'}}>
                                        {t('projectNameHelp')}
                                    </p>
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium" style={{color: 'var(--foreground)'}}>{t('description')} ({t('optional')})</label>
                                <textarea
                                    value={projectDescription}
                                    onChange={(e) => setProjectDescription(e.target.value)}
                                    placeholder={t('projectDescriptionPlaceholder')}
                                    className="textarea"
                                    rows={2}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddProjectModalOpen(false)}
                                    className="btn btn-secondary text-sm px-3 py-2"
                                >
                                    {t('cancel')}
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
                                            {t('creating')}
                                        </div>
                                    ) : (
                                        t('addProject')
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
