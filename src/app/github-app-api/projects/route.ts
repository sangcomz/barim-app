import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGitHubAppOctokit } from '@/lib/github-app-auth';

// 고정 레포지토리 이름 (물리적 저장소)
const PHYSICAL_REPO = "barim-data";

// 프로젝트 색상 맵
const PROJECT_COLORS: { [key: string]: string } = {
    'barim-app': '#3b82f6',
    'backend-service': '#10b981',
    'frontend-app': '#f59e0b',
    'mobile-app': '#8b5cf6',
    'data-pipeline': '#ef4444',
    'ml-model': '#06b6d4',
    'documentation': '#6b7280',
    'research': '#ec4899',
    'prototype': '#84cc16',
    'maintenance': '#f97316',
};

// GET: 모든 프로젝트 목록 가져오기
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session." 
        }, { status: 401 });
    }

    try {
        // GitHub App Installation Token을 사용하여 Octokit 인스턴스 생성
        const octokit = await getGitHubAppOctokit();

        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'application/vnd.github+json'
            },
        });

        if (!userResponse.ok) {
            console.error("Failed to get user info:", userResponse.statusText);
            throw new Error('Failed to get user info');
        }

        const user = await userResponse.json();
        const owner = user.login;

        const { data: labels } = await octokit.rest.issues.listLabelsForRepo({
            owner: owner,
            repo: PHYSICAL_REPO,
            per_page: 100,
        });

        // project: 접두사가 있는 라벨들만 필터링
        const projectLabels = labels.filter(label => label.name.startsWith('project:'));
        
        // 각 프로젝트별로 이슈 개수 계산
        const projectsWithCounts = await Promise.all(
            projectLabels.map(async (label) => {
                const projectName = label.name.replace('project:', '');
                
                try {
                    // 해당 프로젝트 라벨이 있는 이슈들 가져오기
                    const { data: issues } = await octokit.rest.issues.listForRepo({
                        owner: owner,
                        repo: PHYSICAL_REPO,
                        labels: label.name,
                        state: 'all',
                        per_page: 1, // 개수만 필요하므로 1개만
                    });
                    
                    // 실제 개수를 얻기 위해서는 Link 헤더를 파싱해야 하지만, 
                    // 간단하게 하기 위해 별도 요청으로 개수 추정
                    const { data: allIssues } = await octokit.rest.issues.listForRepo({
                        owner: owner,
                        repo: PHYSICAL_REPO,
                        labels: label.name,
                        state: 'all',
                        per_page: 100, // 최대 100개까지 가져와서 개수 계산
                    });
                    
                    return {
                        name: projectName,
                        label: label.name,
                        color: PROJECT_COLORS[projectName] || label.color || '#6b7280',
                        description: label.description || `Project: ${projectName}`,
                        issueCount: allIssues.length,
                    };
                } catch (error) {
                    console.error(`Error fetching issues for project ${projectName}:`, error);
                    return {
                        name: projectName,
                        label: label.name,
                        color: PROJECT_COLORS[projectName] || label.color || '#6b7280',
                        description: label.description || `Project: ${projectName}`,
                        issueCount: 0,
                    };
                }
            })
        );

        // 이슈 개수 순으로 정렬
        projectsWithCounts.sort((a, b) => b.issueCount - a.issueCount);

        return NextResponse.json({
            projects: projectsWithCounts,
            meta: {
                authSource: "github-app",
                totalProjects: projectsWithCounts.length,
                repository: PHYSICAL_REPO,
            }
        });
    } catch (error) {
        console.error("Error fetching projects:", error);
        return NextResponse.json({ 
            message: "Error fetching projects", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST: 새로운 프로젝트 생성
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session." 
        }, { status: 401 });
    }

    try {
        const { projectName, description } = await request.json();

        if (!projectName) {
            return NextResponse.json({ message: "Project name is required" }, { status: 400 });
        }

        // GitHub App Installation Token을 사용하여 Octokit 인스턴스 생성
        const octokit = await getGitHubAppOctokit();

        // 사용자 정보 가져오기 (OAuth 토큰으로)
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${session.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!userResponse.ok) {
            throw new Error('Failed to get user info');
        }

        const user = await userResponse.json();
        const owner = user.login;

        const labelName = `project:${projectName}`;
        const labelColor = PROJECT_COLORS[projectName] || '6b7280';

        // barim-data 레포지토리에 프로젝트 라벨 생성 (GitHub App 권한으로)
        const { data: label } = await octokit.rest.issues.createLabel({
            owner: owner,
            repo: PHYSICAL_REPO,
            name: labelName,
            color: labelColor.replace('#', ''),
            description: description || `Project: ${projectName}`,
        });

        return NextResponse.json({
            message: "Project created successfully",
            project: {
                name: projectName,
                label: label.name,
                color: `#${label.color}`,
                description: label.description,
                issueCount: 0,
            },
            meta: {
                authSource: "github-app",
                repository: PHYSICAL_REPO,
            }
        });
    } catch (error) {
        console.error("Error creating project:", error);
        
        // 이미 존재하는 라벨인 경우 처리
        if (error instanceof Error && error.message.includes('already_exists')) {
            return NextResponse.json({ 
                message: "Project already exists", 
                error: "A project with this name already exists"
            }, { status: 409 });
        }
        
        return NextResponse.json({ 
            message: "Error creating project", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
