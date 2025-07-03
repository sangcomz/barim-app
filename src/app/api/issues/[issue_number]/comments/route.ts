import {Octokit} from "@octokit/rest";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";

// 고정 레포지토리 이름 (물리적 저장소)
const PHYSICAL_REPO = "barim-data";

// POST: barim-data 레포의 특정 이슈에 새로운 댓글 생성
export async function POST(
    request: Request,
    {params}: { params: Promise<{ issue_number: string }> }
) {
    const auth = await requireAuth(request);
    if (!auth) {
        return NextResponse.json({
            message: "Not authenticated. Please provide a valid session or Authorization header."
        }, {status: 401});
    }

    const octokit = new Octokit({auth: auth.token});
    const {issue_number} = await params;
    const issue_number_int = parseInt(issue_number, 10);
    const {body} = await request.json();

    if (!body) {
        return NextResponse.json({message: "Comment body is required"}, {status: 400});
    }

    // 항상 물리적 저장소 사용 (repo 파라미터 무시)
    const repositoryName = PHYSICAL_REPO;

    try {
        const {data: user} = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        const {data: newComment} = await octokit.rest.issues.createComment({
            owner,
            repo: repositoryName,
            issue_number: issue_number_int,
            body,
        });

        return NextResponse.json({
            comment: newComment,
            meta: {
                authSource: auth.fromSession ? "session" : "header",
                createdBy: owner,
                repository: repositoryName,
                issueNumber: issue_number_int
            }
        }, {status: 201});
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            {message: "Error creating comment"},
            {status: 500}
        );
    }
}