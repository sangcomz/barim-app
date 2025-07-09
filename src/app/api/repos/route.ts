import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

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
    const auth = await requireAuth(request);
    if (!auth) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session or Authorization header." 
        }, { status: 401 });
    }

    const octokit = new Octokit({ auth: auth.token });

    try {
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
                authSource: auth.fromSession ? "session" : "header",
                totalCount: filteredRepos.length,
                note: "GitHub repositories (excluding barim-data)"
            }
        });
    } catch (error) {
        console.error("Error fetching repositories:", error);
        return NextResponse.json({ message: "Error fetching repositories" }, { status: 500 });
    }
}
