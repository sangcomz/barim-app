'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface GitHubAppInstallOverlayProps {
    onClose: () => void;
}

export function GitHubAppInstallOverlay({ onClose }: GitHubAppInstallOverlayProps) {
    const { t } = useLanguage();
    const [currentStep, setCurrentStep] = useState(1);
    const [isCreatingRepo, setIsCreatingRepo] = useState(false);
    const [repoCreated, setRepoCreated] = useState(false);

    const handleCreateBarimData = async () => {
        setIsCreatingRepo(true);
        try {
            const response = await fetch('/api/create-barim-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                setRepoCreated(true);
                setCurrentStep(2);
            } else {
                const errorData = await response.json();
                console.error('barim-data 생성 실패:', errorData);
                throw new Error('Failed to create repository');
            }
        } catch (error) {
            console.error('Error creating barim-data repository:', error);
            alert(t('repoCreationFailed'));
        } finally {
            setIsCreatingRepo(false);
        }
    };

    const handleInstallApp = () => {
        const githubAppName = process.env.NEXT_PUBLIC_GITHUB_APP_NAME || 'barim-app-local';
        const installUrl = `https://github.com/apps/${githubAppName}/installations/new`;
        window.open(installUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
            <div className="card w-full max-w-2xl mx-4" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                        {t('githubAppInstallRequired')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="hover:text-red-500 p-1 text-2xl"
                        style={{ color: 'var(--secondary)', border: 'none', background: 'transparent' }}
                    >
                        ×
                    </button>
                </div>

                {/* 설치 필요 이유 */}
                <div className="mb-6 p-4 rounded-lg" style={{ background: 'var(--muted)' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
                        {t('whyGithubAppInstall')}
                    </h3>
                    <ul className="space-y-2 text-sm" style={{ color: 'var(--secondary)' }}>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{t('reasonSafeManagement')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{t('reasonMinimalPermissions')}</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-500">✓</span>
                            <span>{t('reasonStableAccess')}</span>
                        </li>
                    </ul>
                </div>

                {/* 단계별 안내 */}
                <div className="space-y-4">
                    {/* 1단계: barim-data 생성 */}
                    <div className={`p-4 rounded-lg border-2 ${currentStep === 1 ? 'border-blue-500' : repoCreated ? 'border-green-500' : 'border-gray-300'}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                repoCreated ? 'bg-green-500' : currentStep === 1 ? 'bg-blue-500' : 'bg-gray-400'
                            }`}>
                                {repoCreated ? '✓' : '1'}
                            </div>
                            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                {t('createBarimDataRepo')}
                            </h3>
                        </div>
                        
                        <p className="text-sm mb-3" style={{ color: 'var(--secondary)' }}>
                            {t('createBarimDataDescription')}
                        </p>

                        {!repoCreated && (
                            <button
                                onClick={handleCreateBarimData}
                                disabled={isCreatingRepo}
                                className={`btn btn-primary ${isCreatingRepo ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {isCreatingRepo ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {t('creatingRepo')}
                                    </div>
                                ) : (
                                    t('createBarimDataRepo')
                                )}
                            </button>
                        )}

                        {repoCreated && (
                            <div className="flex items-center gap-2 text-green-600">
                                <span className="text-green-500">✓</span>
                                <span className="text-sm">{t('repoCreated')}</span>
                            </div>
                        )}
                    </div>

                    {/* 2단계: GitHub App 설치 */}
                    <div className={`p-4 rounded-lg border-2 ${currentStep === 2 ? 'border-blue-500' : !repoCreated ? 'border-gray-300' : 'border-gray-300'}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                                currentStep === 2 ? 'bg-blue-500' : !repoCreated ? 'bg-gray-400' : 'bg-gray-400'
                            }`}>
                                2
                            </div>
                            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                {t('installGithubApp')}
                            </h3>
                        </div>
                        
                        <p className="text-sm mb-3" style={{ color: 'var(--secondary)' }}>
                            {t('installGithubAppDescription')}
                        </p>

                        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
                            <h4 className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                                {t('minimalPermissionsTitle')}
                            </h4>
                            <ul className="text-sm space-y-1" style={{ color: 'var(--secondary)' }}>
                                <li>• {t('issueReadPermission')}</li>
                                <li>• {t('issueWritePermission')}</li>
                                <li>• {t('noCodeAccess')}</li>
                            </ul>
                        </div>

                        <button
                            onClick={handleInstallApp}
                            disabled={!repoCreated}
                            className={`btn btn-primary ${!repoCreated ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {t('installGithubApp')}
                        </button>
                    </div>
                </div>

                {/* 하단 안내 */}
                <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--muted)' }}>
                    <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                        💡 {t('refreshAfterInstall')}
                    </p>
                </div>

                {/* 닫기 버튼 */}
                <div className="flex justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary"
                    >
                        {t('installLater')}
                    </button>
                </div>
            </div>
        </div>
    );
}
