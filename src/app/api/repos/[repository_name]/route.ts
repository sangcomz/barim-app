import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

// GitHub 레포지토리 타입 정의
interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    description?: string | null;
    updated_at: string;
}

// GET: 특정 이름의 GitHub 레포지토리 정보 가져오기
export async function GET(request: Request, { params }: { params: Promise<{ repository_name: string }> }) {
    const auth = await requireAuth(request);
    if (!auth) {
        return NextResponse.json({
            message: "Not authenticated. Please provide a valid session or Authorization header."
        }, { status: 401 });
    }

    const { repository_name } = await params;
    if (!repository_name) {
        return NextResponse.json({ message: "Repository name is required." }, { status: 400 });
    }

    const octokit = new Octokit({ auth: auth.token });

    try {
        // 사용자가 소유한 모든 레포지토리 목록을 가져옵니다.
        const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
            type: "owner",
            sort: "updated",
            per_page: 100,
        });

        // 이름이 일치하는 레포지토리를 찾습니다.
        const targetRepo = (repos as GitHubRepository[]).find(repo => repo.name === repository_name);

        // 일치하는 레포지토리가 없는 경우 404 에러를 반환합니다.
        if (!targetRepo) {
            return NextResponse.json({ message: `Repository '${repository_name}' not found.` }, { status: 404 });
        }

        // 찾은 레포지토리 정보를 반환합니다.
        return NextResponse.json({
            repository: targetRepo,
            meta: {
                authSource: auth.fromSession ? "session" : "header",
            }
        });

    } catch (error) {
        console.error("Error fetching repository:", error);
        return NextResponse.json({ message: "Error fetching repository" }, { status: 500 });
    }
}