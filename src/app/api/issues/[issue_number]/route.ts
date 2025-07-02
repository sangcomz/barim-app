import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { CustomSession, IssueParams } from "@/types/api";

// PATCH: 특정 이슈의 상태 및 라벨을 업데이트
export async function PATCH(
    request: Request,
    { params }: { params: Promise<IssueParams> }
) {
    const session: CustomSession | null = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const octokit = new Octokit({ auth: session.accessToken });
    const { issue_number } = await params;
    const issue_number_int = parseInt(issue_number, 10);

    // body에서 업데이트할 정보들을 받음 (state, state_reason, labels 등)
    const updateData = await request.json();

    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        const { data: updatedIssue } = await octokit.rest.issues.update({
            owner,
            repo: "barim-data", // 실제로는 이 부분도 동적으로 받아오는 것이 좋습니다.
            issue_number: issue_number_int,
            ...updateData, // 받은 데이터를 그대로 전달하여 업데이트
        });

        return NextResponse.json(updatedIssue);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error updating issue" },
            { status: 500 }
        );
    }
}