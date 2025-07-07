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

// GitHub 레포지토리 타입 정의
interface GitHubRepository {
    id: number;
    name: string;
    full_name: string;
    description?: string | null;
    updated_at: string;
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

// GET: 사용자의 모든 레포지토리 목록 가져오기 (프로젝트 추가용)
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
                totalCount: filteredRepos.length
            }
        });
    } catch (error) {
        console.error("Error fetching repositories:", error);
        return NextResponse.json({ message: "Error fetching repositories" }, { status: 500 });
    }
}

// POST: 새 프로젝트(라벨) 추가
export async function POST(request: Request) {
    const auth = await requireAuth(request);
    if (!auth) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session or Authorization header." 
        }, { status: 401 });
    }

    const octokit = new Octokit({ auth: auth.token });
    const { projectName, description } = await request.json();

    if (!projectName || !projectName.trim()) {
        return NextResponse.json(
            { message: "Project name is required" },
            { status: 400 }
        );
    }

    const cleanProjectName = projectName.trim();
    const projectLabelName = `project:${cleanProjectName}`;

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

        // 이미 존재하는 프로젝트 라벨인지 확인
        if (existingLabelNames.includes(projectLabelName)) {
            return NextResponse.json(
                { message: `Project "${cleanProjectName}" already exists` },
                { status: 409 }
            );
        }

        // 새 프로젝트 라벨 생성
        const { data: newLabel } = await octokit.rest.issues.createLabel({
            owner,
            repo: PHYSICAL_REPO,
            name: projectLabelName,
            color: getRandomColor(),
            description: description || `Project: ${cleanProjectName}`,
        });
        
        return NextResponse.json({
            project: {
                name: cleanProjectName,
                label: projectLabelName,
                color: newLabel.color,
                description: newLabel.description,
                issueCount: 0
            },
            meta: {
                authSource: auth.fromSession ? "session" : "header",
                createdBy: owner,
                physicalRepo: PHYSICAL_REPO
            }
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating project label:", error);
        return NextResponse.json(
            { message: "Error creating project" },
            { status: 500 }
        );
    }
}
