import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGitHubAppOctokit } from '@/lib/github-app-auth';

// 고정 레포지토리 이름 (물리적 저장소)
const PHYSICAL_REPO = "barim-data";

// GET: 특정 프로젝트의 이슈 목록 가져오기
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session." 
        }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = 30;

    if (!repo) {
        return NextResponse.json({ message: "Repository parameter is required" }, { status: 400 });
    }

    try {
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

        // barim-data 레포지토리에서 이슈 가져오기 (GitHub App 권한으로)
        const { data: issues } = await octokit.rest.issues.listForRepo({
            owner: owner,
            repo: PHYSICAL_REPO,
            state: 'all',
            page: page,
            per_page: perPage,
            sort: 'created',
            direction: 'desc',
            labels: `project:${repo}`, // 프로젝트별 라벨 필터링
        });

        // 다음 페이지 확인
        const nextPage = issues.length === perPage ? page + 1 : null;
        const hasNextPage = nextPage !== null;

        return NextResponse.json({
            issues: issues.map(issue => ({
                id: issue.id,
                number: issue.number,
                title: issue.title,
                body: issue.body,
                html_url: issue.html_url,
                labels: issue.labels.map(label => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'string' ? undefined : label.color,
                })),
                state: issue.state,
                created_at: issue.created_at,
                updated_at: issue.updated_at,
            })),
            meta: {
                authSource: "github-app",
                currentPage: page,
                hasNextPage: hasNextPage,
                nextPage: nextPage,
                repository: PHYSICAL_REPO,
                project: repo,
            }
        });
    } catch (error) {
        console.error("Error fetching issues:", error);
        return NextResponse.json({ 
            message: "Error fetching issues", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST: 새로운 이슈 생성
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session." 
        }, { status: 401 });
    }

    try {
        const { title, body, repo, issueType, tags } = await request.json();

        if (!title || !repo) {
            return NextResponse.json({ message: "Title and repository are required" }, { status: 400 });
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

        // 라벨 설정
        const labels = [`project:${repo}`];
        
        if (issueType === 'Task') {
            labels.push('Task', 'TODO');
        } else if (issueType === 'Note') {
            labels.push('Note');
        }

        // 태그 라벨 추가
        if (tags && Array.isArray(tags)) {
            tags.forEach(tag => {
                if (tag.trim()) {
                    labels.push(`tag:${tag.trim()}`);
                }
            });
        }

        // barim-data 레포지토리에 이슈 생성 (GitHub App 권한으로)
        const { data: issue } = await octokit.rest.issues.create({
            owner: owner,
            repo: PHYSICAL_REPO,
            title: title,
            body: body || '',
            labels: labels,
        });

        return NextResponse.json({
            message: "Issue created successfully",
            issue: {
                id: issue.id,
                number: issue.number,
                title: issue.title,
                body: issue.body,
                html_url: issue.html_url,
                labels: issue.labels.map(label => ({
                    name: typeof label === 'string' ? label : label.name,
                    color: typeof label === 'string' ? undefined : label.color,
                })),
            },
            meta: {
                authSource: "github-app",
                repository: PHYSICAL_REPO,
                project: repo,
            }
        });
    } catch (error) {
        console.error("Error creating issue:", error);
        return NextResponse.json({ 
            message: "Error creating issue", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
