import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

// 고정 레포지토리 이름 (물리적 저장소)
const PHYSICAL_REPO = "barim-data";

// 랜덤 색상 생성 함수
const getRandomColor = () => Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

// GitHub 라벨 타입 정의
interface GitHubLabel {
    id: number;
    name: string;
    color: string;
    description?: string;
}

// GitHub 이슈 타입 정의
interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    body?: string;
    state: string;
    state_reason?: string;
    labels: GitHubLabel[];
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

// GET: barim-data 레포에서 특정 프로젝트 라벨의 이슈들만 필터링해서 가져오기
export async function GET(request: Request) {
    const auth = await requireAuth(request);
    if (!auth) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session or Authorization header." 
        }, { status: 401 });
    }

    const octokit = new Octokit({ auth: auth.token });
    const { searchParams } = new URL(request.url);
    const projectLabel = searchParams.get('repo'); // 필터링할 프로젝트 라벨
    const page = searchParams.get('page') || '1';

    if (!projectLabel) {
        return NextResponse.json({ message: "Project name (repo) is required for filtering" }, { status: 400 });
    }

    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        // barim-data 레포지토리 존재 확인 및 생성
        await ensureBarimDataRepo(octokit, owner);

        const currentPage = parseInt(page);
        const issuesPerPage = 50; // 한 번에 가져올 이슈 수
        let allProjectIssues: any[] = [];
        let githubPage = 1;
        let totalIssuesFound = 0;

        // 요청된 페이지까지의 모든 이슈를 가져오기
        const targetIssueCount = currentPage * issuesPerPage;

        while (allProjectIssues.length < targetIssueCount) {
            try {
                const { data: issues } = await octokit.rest.issues.listForRepo({
                    owner,
                    repo: PHYSICAL_REPO,
                    state: "all",
                    per_page: 100,
                    page: githubPage,
                    sort: "updated",
                    direction: "desc"
                });

                if (issues.length === 0) break;

                // 프로젝트 라벨이 있는 이슈들만 필터링
                const pageProjectIssues = issues.filter(issue => {
                    const hasProjectLabel = issue.labels.some(label => 
                        label.name === projectLabel
                    );
                    
                    const isValidState = 
                        issue.state === 'open' || 
                        (issue.state === 'closed' && issue.state_reason === 'completed');
                    
                    return hasProjectLabel && isValidState;
                });

                allProjectIssues = allProjectIssues.concat(pageProjectIssues);
                githubPage++;
                
                // 더 이상 이슈가 없으면 중단
                if (issues.length < 100) break;
                
                // 안전장치: 너무 많은 페이지를 가져오지 않도록 제한
                if (githubPage > 20) break;
            } catch (error) {
                console.error(`Error fetching GitHub page ${githubPage}:`, error);
                break;
            }
        }

        // 현재 페이지에 해당하는 이슈들만 반환
        const startIndex = (currentPage - 1) * issuesPerPage;
        const endIndex = startIndex + issuesPerPage;
        const paginatedIssues = allProjectIssues.slice(startIndex, endIndex);
        
        // 다음 페이지가 있는지 확인
        const hasNextPage = allProjectIssues.length > endIndex;
        
        // 아직 더 GitHub 페이지가 있을 가능성이 있는지 확인
        const mayHaveMorePages = (githubPage <= 20) && (allProjectIssues.length === targetIssueCount);

        console.log(`Page ${currentPage}: Returning ${paginatedIssues.length} issues, hasNextPage: ${hasNextPage || mayHaveMorePages}`);

        return NextResponse.json({
            issues: paginatedIssues,
            meta: {
                authSource: auth.fromSession ? "session" : "header",
                currentPage: currentPage,
                issuesPerPage,
                returnedCount: paginatedIssues.length,
                hasNextPage: hasNextPage || mayHaveMorePages,
                totalLoadedIssues: allProjectIssues.length,
                projectLabel,
                physicalRepo: PHYSICAL_REPO,
                owner
            }
        });
    } catch (error) {
        console.error("Error fetching issues:", error);
        return NextResponse.json({ message: "Error fetching issues" }, { status: 500 });
    }
}

// POST: barim-data 레포에 선택한 프로젝트 라벨을 달고 새로운 이슈(Task/Note) 생성
export async function POST(request: Request) {
    const auth = await requireAuth(request);
    if (!auth) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session or Authorization header." 
        }, { status: 401 });
    }

    const octokit = new Octokit({ auth: auth.token });
    const { title, body, issueType, repo: projectLabel, tags } = await request.json();

    if (!title || !issueType || !projectLabel) {
        return NextResponse.json(
            { message: "Title, issueType, and repo (project label) are required" },
            { status: 400 }
        );
    }

    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        // barim-data 레포지토리 존재 확인 및 생성
        await ensureBarimDataRepo(octokit, owner);

        // 기존 라벨 목록 확인
        let existingLabels: GitHubLabel[] = [];
        try {
            const labelResponse = await octokit.rest.issues.listLabelsForRepo({
                owner,
                repo: PHYSICAL_REPO,
            });
            existingLabels = labelResponse.data as GitHubLabel[];
        } catch {
            // 라벨을 가져올 수 없으면 빈 배열로 초기화
            existingLabels = [];
        }
        
        const existingLabelNames = existingLabels.map(label => label.name);

        // 필요한 라벨들 정의 (선택한 프로젝트 라벨 포함)
        const labelsToEnsure = [
            { name: projectLabel, color: getRandomColor(), description: `Issues from ${projectLabel} project` },
            { name: 'Note', color: 'fbca04', description: 'Simple note' },
            { name: 'Task', color: '0075ca', description: 'A task that needs to be done' },
            { name: 'TODO', color: 'd876e3', description: 'Task to be done' },
            { name: 'IN PROGRESS', color: '008672', description: 'Task in progress' },
            { name: 'DONE', color: '0e8a16', description: 'Task completed' },
            { name: 'PENDING', color: 'b33a3a', description: 'Task is pending' },
        ];

        // 태그가 있는 경우 태그 라벨들도 추가
        if (tags && Array.isArray(tags)) {
            tags.forEach(tag => {
                if (tag && tag.trim()) {
                    labelsToEnsure.push({
                        name: `tag:${tag.trim()}`,
                        color: getRandomColor(),
                        description: `Tag: ${tag.trim()}`
                    });
                }
            });
        }

        // 필요한 라벨들이 없으면 생성
        for (const label of labelsToEnsure) {
            if (!existingLabelNames.includes(label.name)) {
                try {
                    await octokit.rest.issues.createLabel({
                        owner,
                        repo: PHYSICAL_REPO,
                        name: label.name,
                        color: label.color,
                        description: label.description,
                    });
                } catch (labelError) {
                    console.warn(`Warning: Could not create label ${label.name}:`, labelError);
                }
            }
        }

        // 이슈에 추가할 라벨 목록 구성
        const labelsToAdd = [projectLabel]; // 선택한 프로젝트 라벨 추가
        if (issueType === 'Task') {
            labelsToAdd.push('Task', 'TODO');
        } else if (issueType === 'Note') {
            labelsToAdd.push('Note');
            // 태그가 있는 경우 태그 라벨들도 추가
            if (tags && Array.isArray(tags)) {
                tags.forEach(tag => {
                    if (tag && tag.trim()) {
                        labelsToAdd.push(`tag:${tag.trim()}`);
                    }
                });
            }
        }

        // 이슈 생성
        const { data: newIssue } = await octokit.rest.issues.create({
            owner,
            repo: PHYSICAL_REPO,
            title,
            body,
            labels: labelsToAdd,
        });
        
        return NextResponse.json({
            issue: newIssue,
            meta: {
                authSource: auth.fromSession ? "session" : "header",
                createdBy: owner,
                physicalRepo: PHYSICAL_REPO,
                projectLabel
            }
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating issue:", error);
        return NextResponse.json(
            { message: "Error creating issue" },
            { status: 500 }
        );
    }
}