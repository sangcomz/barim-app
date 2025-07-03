import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

// PATCH: 특정 이슈의 상태 및 라벨을 업데이트
export async function PATCH(
    request: Request,
    { params }: { params: { issue_number: string } }
) {
    const auth = await requireAuth(request);
    if (!auth) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session or Authorization header." 
        }, { status: 401 });
    }

    const octokit = new Octokit({ auth: auth.token });
    const issue_number = parseInt(params.issue_number, 10);

    // body에서 업데이트할 정보들을 받음 (state, state_reason, labels, repo 등)
    const updateData = await request.json();
    const { repo, ...issueUpdateData } = updateData;

    // repo가 제공되지 않은 경우 기본값 사용
    const repositoryName = repo || "barim-data";

    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        const { data: updatedIssue } = await octokit.rest.issues.update({
            owner,
            repo: repositoryName,
            issue_number,
            ...issueUpdateData, // 받은 데이터를 그대로 전달하여 업데이트
        });

        return NextResponse.json({
            issue: updatedIssue,
            meta: {
                authSource: auth.fromSession ? "session" : "header",
                updatedBy: owner,
                repository: repositoryName
            }
        });
    } catch (error) {
        console.error("Error updating issue:", error);
        return NextResponse.json(
            { message: "Error updating issue" },
            { status: 500 }
        );
    }
}