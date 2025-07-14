import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGitHubAppOctokit } from '@/lib/github-app-auth';

const PHYSICAL_REPO = "barim-data";

export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        console.error('GitHub App 설치 상태 확인: 세션이 없거나 액세스 토큰이 없음');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('GitHub App 설치 상태 확인 시작');
        
        // GitHub App Installation Token을 사용하여 Octokit 인스턴스 생성
        const octokit = await getGitHubAppOctokit();

        const { data: { repositories } } = await octokit.rest.apps.listReposAccessibleToInstallation();

        // barim-data 레포지토리 존재 확인
        const hasBarimDataRepo = repositories.filter(repo => repo.name === PHYSICAL_REPO);

        // GitHub App이 설치되어 있다면 installation token을 성공적으로 얻었다는 뜻
        const result = {
            isAppInstalled: true, // installation token을 성공적으로 얻었으므로 true
            hasBarimDataRepo: hasBarimDataRepo,
            installations: [],
        };
        
        console.log('GitHub App 설치 상태 확인 완료:', result);
        return NextResponse.json(result);
        
    } catch (error) {
        console.error('GitHub App 설치 상태 확인 에러:', error);
        
        // GitHub App이 설치되지 않았거나 권한이 없으면 installation token 생성 실패
        const result = {
            isAppInstalled: false,
            hasBarimDataRepo: false,
            installations: [],
        };
        
        return NextResponse.json(result);
    }
}
