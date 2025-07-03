import {Octokit} from "@octokit/rest";
import {NextResponse} from "next/server";
import {requireAuth} from "@/lib/auth-utils";

// 고정 레포지토리 이름 (물리적 저장소)
const PHYSICAL_REPO = "barim-data";

// PATCH: barim-data 레포의 특정 이슈 상태 및 라벨 업데이트
export async function PATCH(
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

    // body에서 업데이트할 정보들을 받음 (state, state_reason, labels 등)
    const updateData = await request.json();
    // repo 파라미터 추출 후 제거 (사용하지 않지만 API 호환성을 위해)
    const {...issueUpdateData} = updateData;

    // 항상 물리적 저장소 사용 (repo 파라미터 무시)
    const repositoryName = PHYSICAL_REPO;

    try {
        const {data: user} = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        const {data: updatedIssue} = await octokit.rest.issues.update({
            owner,
            repo: repositoryName,
            issue_number: issue_number_int,
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
            {message: "Error updating issue"},
            {status: 500}
        );
    }
}