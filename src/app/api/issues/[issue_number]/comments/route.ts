import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

// POST: 특정 이슈에 새로운 댓글 생성
export async function POST(
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
    const { body, repo } = await request.json();

    if (!body) {
        return NextResponse.json({ message: "Comment body is required" }, { status: 400 });
    }

    // repo가 제공되지 않은 경우 기본값 사용
    const repositoryName = repo || "barim-data";

    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        const { data: newComment } = await octokit.rest.issues.createComment({
            owner,
            repo: repositoryName,
            issue_number,
            body,
        });

        return NextResponse.json({
            comment: newComment,
            meta: {
                authSource: auth.fromSession ? "session" : "header",
                createdBy: owner,
                repository: repositoryName,
                issueNumber: issue_number
            }
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { message: "Error creating comment" },
            { status: 500 }
        );
    }
}