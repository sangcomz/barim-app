'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface GitHubAppInstallOverlayProps {
    onClose: () => void;
}

export function GitHubAppInstallOverlay({ onClose }: GitHubAppInstallOverlayProps) {
    const { t } = useLanguage();

    const handleCreateBarimData = () => {
        // GitHub에서 직접 레포지토리 생성 페이지로 이동
        const createRepoUrl = 'https://github.com/new?name=barim-data&description=Personal%20task%20and%20note%20management%20repository%20for%20Barim%20app&visibility=public';
        window.open(createRepoUrl, '_blank');
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
                    <div className="p-4 rounded-lg border-2 border-blue-500">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-blue-500">
                                1
                            </div>
                            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                                {t('createBarimDataRepo')}
                            </h3>
                        </div>
                        
                        <p className="text-sm mb-3" style={{ color: 'var(--secondary)' }}>
                            {t('createBarimDataDescription')}
                        </p>

                        <button
                            onClick={handleCreateBarimData}
                            className="btn btn-primary"
                        >
                            {t('createBarimDataRepo')}
                        </button>
                    </div>

                    {/* 2단계: GitHub App 설치 */}
                    <div className="p-4 rounded-lg border-2 border-blue-500">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-blue-500">
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
                            className="btn btn-primary"
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
