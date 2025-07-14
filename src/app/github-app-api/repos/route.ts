import { NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGitHubAppOctokit } from '@/lib/github-app-auth';

// 고정 레포지토리 이름 (물리적 저장소)
const PHYSICAL_REPO = "barim-data";

// GitHub 레포지토리 타입 정의
interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    description?: string | null;
    updated_at: string;
}

// GET: 사용자의 모든 GitHub 레포지토리 목록 가져오기
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session." 
        }, { status: 401 });
    }

    try {
        // GitHub App Installation Token을 사용하여 Octokit 인스턴스 생성
        const octokit = await getGitHubAppOctokit();

        const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
            type: "owner", // 내가 소유한 레포지토리만
            sort: "updated",
            per_page: 100, // 최대 100개까지
        });

        // barim-data 레포는 제외하고 반환
        const filteredRepos = (repos as GitHubRepository[]).filter(repo => repo.name !== PHYSICAL_REPO);
        
        return NextResponse.json({
            repositories: filteredRepos,
            meta: {
                authSource: "github-app",
                totalCount: filteredRepos.length,
                note: "GitHub repositories (excluding barim-data) via GitHub App"
            }
        });
    } catch (error) {
        console.error("Error fetching repositories:", error);
        return NextResponse.json({ 
            message: "Error fetching repositories", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
