import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

// 고정 레포지토리 이름 (물리적 저장소)
const PHYSICAL_REPO = "barim-data";

// GitHub 라벨 타입 정의
interface GitHubLabel {
    id: number;
    name: string;
    color: string;
    description?: string;
}

// 프로젝트 정보 타입 정의
interface Project {
    name: string;
    label: string;
    color: string;
    description?: string;
    issueCount: number;
}

// barim-data 레포지토리가 존재하는지 확인하고, 없으면 생성
async function ensureBarimDataRepo(octokit: Octokit, owner: string) {
    try {
        // 레포지토리 존재 확인
        await octokit.rest.repos.get({
            owner,
            repo: PHYSICAL_REPO,
        });
        console.log(`Repository ${PHYSICAL_REPO} already exists`);
        return true;
    } catch (error: unknown) {
        const err = error as { status?: number };
        if (err.status === 404) {
            // 레포지토리가 없으면 생성
            console.log(`Repository ${PHYSICAL_REPO} not found, creating...`);
            try {
                await octokit.rest.repos.createForAuthenticatedUser({
                    name: PHYSICAL_REPO,
                    description: "Personal task and note management repository for Barim app",
                    private: false, // 공개 레포로 생성 (원하면 true로 변경)
                    auto_init: true, // README.md 자동 생성
                });
                console.log(`Repository ${PHYSICAL_REPO} created successfully`);
                return true;
            } catch (createError) {
                console.error(`Error creating repository ${PHYSICAL_REPO}:`, createError);
                throw createError;
            }
        } else {
            console.error(`Error checking repository ${PHYSICAL_REPO}:`, error);
            throw error;
        }
    }
}

// barim-data 레포지토리에서 project:xxx 라벨들을 기준으로 프로젝트 목록을 가져옵니다.
export async function GET(request: Request) {
    const auth = await requireAuth(request);
    if (!auth) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session or Authorization header." 
        }, { status: 401 });
    }

    const octokit = new Octokit({ auth: auth.token });

    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        // barim-data 레포지토리 존재 확인 및 생성
        await ensureBarimDataRepo(octokit, owner);

        // barim-data 레포지토리의 모든 라벨 가져오기
        const { data: allLabels } = await octokit.rest.issues.listLabelsForRepo({
            owner,
            repo: PHYSICAL_REPO,
            per_page: 100,
        });

        // project:xxx 패턴의 라벨들만 필터링
        const projectLabels = (allLabels as GitHubLabel[]).filter(label => 
            label.name.startsWith('project:')
        );

        // 각 프로젝트 라벨에 대해 이슈 개수 계산
        const projects: Project[] = [];
        
        for (const label of projectLabels) {
            try {
                // 해당 프로젝트 라벨이 달린 이슈들 검색
                const { data: issues } = await octokit.rest.issues.listForRepo({
                    owner,
                    repo: PHYSICAL_REPO,
                    labels: label.name,
                    state: 'all',
                    per_page: 1, // 개수만 필요하므로 1개만 가져와서 total_count 사용
                });

                // 실제 이슈 개수를 정확히 계산하기 위해 모든 이슈를 가져옴
                const { data: allIssues } = await octokit.rest.issues.listForRepo({
                    owner,
                    repo: PHYSICAL_REPO,
                    labels: label.name,
                    state: 'all',
                    per_page: 100,
                });

                const issueCount = allIssues.filter(issue => {
                    // 유효한 상태의 이슈만 카운트 (open이거나 completed로 closed된 것)
                    return issue.state === 'open' || 
                           (issue.state === 'closed' && (issue as any).state_reason === 'completed');
                }).length;

                const projectName = label.name.replace('project:', '');
                
                projects.push({
                    name: projectName,
                    label: label.name,
                    color: label.color,
                    description: label.description || `Project: ${projectName}`,
                    issueCount
                });
            } catch (error) {
                console.warn(`Error fetching issues for project ${label.name}:`, error);
                // 에러가 있어도 프로젝트는 포함시키되 이슈 개수는 0으로 설정
                const projectName = label.name.replace('project:', '');
                projects.push({
                    name: projectName,
                    label: label.name,
                    color: label.color,
                    description: label.description || `Project: ${projectName}`,
                    issueCount: 0
                });
            }
        }

        // 프로젝트 이름 순으로 정렬
        projects.sort((a, b) => a.name.localeCompare(b.name));
        
        // 응답에 인증 방식 정보 추가 (디버깅용)
        return NextResponse.json({
            projects,
            meta: {
                authSource: auth.fromSession ? "session" : "header",
                totalCount: projects.length,
                physicalRepo: PHYSICAL_REPO,
                owner,
                note: "Projects are now based on 'project:xxx' labels from barim-data repository"
            }
        });
    } catch (error) {
        console.error("Error fetching project labels:", error);
        return NextResponse.json({ message: "Error fetching project labels" }, { status: 500 });
    }
}