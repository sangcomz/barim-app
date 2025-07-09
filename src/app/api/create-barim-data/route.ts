import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // barim-data 레포지토리 생성
        const response = await fetch('https://api.github.com/user/repos', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'barim-data',
                description: 'Personal workspace for Barim - Task and Note Management',
                private: true,
                auto_init: true,
                gitignore_template: 'Node',
                license_template: 'mit',
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            
            // 이미 존재하는 레포지토리인 경우
            if (response.status === 422 && errorData.errors?.some((e: any) => e.message.includes('already exists'))) {
                return NextResponse.json({ 
                    success: true, 
                    message: 'Repository already exists',
                    repository: { name: 'barim-data' }
                });
            }
            
            throw new Error(errorData.message || 'Failed to create repository');
        }

        const repository = await response.json();

        // 초기 이슈 생성 (환영 메시지)
        await fetch(`https://api.github.com/repos/${repository.full_name}/issues`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: '🎉 Barim에 오신 것을 환영합니다!',
                body: `# Barim 사용을 시작하세요!

이 레포지토리는 Barim 앱에서 사용할 개인 작업 공간입니다.

## 다음 단계
1. GitHub App을 설치하여 Barim이 이 레포지토리에 접근할 수 있도록 허용
2. Barim 앱에서 작업과 노트를 관리하기 시작

## 보안
- 이 레포지토리는 private으로 설정되어 있습니다
- Barim은 이슈 읽기/쓰기 권한만 요청합니다
- 코드나 기타 데이터에는 접근하지 않습니다

행복한 작업 관리 되세요! 🚀`,
                labels: ['welcome', 'Note']
            }),
        });

        return NextResponse.json({ 
            success: true, 
            repository: repository 
        });
    } catch (error) {
        console.error('Error creating barim-data repository:', error);
        return NextResponse.json({ 
            error: 'Failed to create repository',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
