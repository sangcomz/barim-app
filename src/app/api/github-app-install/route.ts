import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // GitHub App 설치 상태 확인
        const response = await fetch('https://api.github.com/user/installations', {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch installations');
        }

        const data = await response.json();
        
        // Barim App이 설치되어 있는지 확인
        const barimAppId = process.env.GITHUB_APP_ID;
        const isInstalled = data.installations?.some((installation: any) => 
            installation.app_id === parseInt(barimAppId || '0')
        );

        // 사용자 정보 가져오기
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!userResponse.ok) {
            throw new Error('Failed to get user info');
        }

        const user = await userResponse.json();
        
        // barim-data 레포지토리 존재 확인
        const repoResponse = await fetch(`https://api.github.com/repos/${user.login}/barim-data`, {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        const hasBarimDataRepo = repoResponse.ok;

        const result = {
            isAppInstalled: isInstalled,
            hasBarimDataRepo: hasBarimDataRepo,
            installations: data.installations || [],
        };
        
        console.log('GitHub App 설치 상태:', result);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Error checking GitHub App installation:', error);
        return NextResponse.json({ 
            error: 'Failed to check installation status',
            isAppInstalled: false,
            hasBarimDataRepo: false,
        }, { status: 500 });
    }
}
