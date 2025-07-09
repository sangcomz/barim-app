'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface GitHubAppsStatusData {
    isGitHubApp: boolean;
    provider: string;
    authMethod: string;
    installationAccess: boolean;
    repositories: number;
    permissions: string[];
}

export function GitHubAppsStatus() {
    const { data: session } = useSession();
    const [status, setStatus] = useState<GitHubAppsStatusData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkGitHubAppsStatus = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // 현재 인증 상태 확인
            const authResponse = await fetch('/api/github-app/repos');
            const authData = await authResponse.json();
            
            if (!authResponse.ok) {
                throw new Error(authData.message || 'Failed to check authentication status');
            }

            setStatus({
                isGitHubApp: authData.meta?.authMethod === "GitHub Apps",
                provider: session?.provider || 'unknown',
                authMethod: authData.meta?.authMethod || 'Unknown',
                installationAccess: authResponse.ok,
                repositories: authData.repositories?.length || 0,
                permissions: ['repo', 'user', 'read:org'] // GitHub Apps의 기본 권한
            });
        } catch (err) {
            console.error('Error checking GitHub Apps status:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            
            // fallback으로 session 정보 사용
            setStatus({
                isGitHubApp: false,
                provider: session?.provider || 'unknown',
                authMethod: 'OAuth Apps (fallback)',
                installationAccess: false,
                repositories: 0,
                permissions: []
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            checkGitHubAppsStatus();
        }
    }, [session]);

    if (!session) {
        return null;
    }

    if (loading) {
        return (
            <div className="card p-4 mb-4 border-blue-200">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">GitHub Apps 상태 확인 중...</span>
                </div>
            </div>
        );
    }

    if (!status) {
        return null;
    }

    const getStatusColor = () => {
        if (status.isGitHubApp && status.installationAccess) return 'green';
        if (status.isGitHubApp) return 'yellow';
        return 'red';
    };

    const getStatusIcon = () => {
        const color = getStatusColor();
        if (color === 'green') return '✅';
        if (color === 'yellow') return '⚠️';
        return '❌';
    };

    const getStatusMessage = () => {
        if (status.isGitHubApp && status.installationAccess) {
            return '정상적으로 GitHub Apps로 연결되었습니다.';
        }
        if (status.isGitHubApp) {
            return 'GitHub Apps로 로그인했지만 Installation 액세스에 문제가 있습니다.';
        }
        return 'OAuth Apps 방식으로 연결되어 있습니다. GitHub Apps로 업그레이드하세요.';
    };

    return (
        <div className={`card p-4 mb-4 border-2 ${
            getStatusColor() === 'green' ? 'border-green-200 bg-green-50' :
            getStatusColor() === 'yellow' ? 'border-yellow-200 bg-yellow-50' :
            'border-red-200 bg-red-50'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getStatusIcon()}</span>
                        <h3 className="font-semibold">GitHub 인증 상태</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                            status.isGitHubApp ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                            {status.authMethod}
                        </span>
                    </div>
                    
                    <p className="text-sm mb-3 text-gray-700">
                        {getStatusMessage()}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="font-medium">인증 방식:</span>
                            <span className="ml-1">{status.authMethod}</span>
                        </div>
                        <div>
                            <span className="font-medium">접근 가능한 저장소:</span>
                            <span className="ml-1">{status.repositories}개</span>
                        </div>
                        <div>
                            <span className="font-medium">Installation 액세스:</span>
                            <span className="ml-1">{status.installationAccess ? '활성' : '비활성'}</span>
                        </div>
                        <div>
                            <span className="font-medium">권한:</span>
                            <span className="ml-1">{status.permissions.join(', ')}</span>
                        </div>
                    </div>
                </div>
                
                <button
                    onClick={checkGitHubAppsStatus}
                    className="text-blue-600 hover:text-blue-800 text-sm ml-4"
                    disabled={loading}
                >
                    새로고침
                </button>
            </div>
            
            {error && (
                <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-700">
                    <strong>오류:</strong> {error}
                </div>
            )}
            
            {!status.isGitHubApp && (
                <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded">
                    <p className="text-sm text-blue-800 mb-2">
                        <strong>GitHub Apps 로그인의 장점:</strong>
                    </p>
                    <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                        <li>더 세밀한 권한 제어</li>
                        <li>개별 리포지토리별 액세스 관리</li>
                        <li>향상된 보안</li>
                        <li>더 높은 API 제한</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
