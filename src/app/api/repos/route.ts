import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

// 주의: 이 API는 외부 호출 또는 관리 목적으로만 사용됩니다.
// 실제 앱에서는 barim-data 레포지토리만 사용합니다.
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
        
        // 응답에 인증 방식 정보 추가 (디버깅용)
        return NextResponse.json({
            repos,
            meta: {
                authSource: auth.fromSession ? "session" : "header",
                totalCount: repos.length
            }
        });
    } catch (error) {
        console.error("Error fetching repositories:", error);
        return NextResponse.json({ message: "Error fetching repositories" }, { status: 500 });
    }
}