import { NextResponse } from "next/server";
import { githubAppFetch, githubUserFetch } from "@/lib/github-app";
import { requireAuth } from "@/lib/auth-utils";

// GitHub Apps를 통해 이슈 목록을 가져옵니다.
export async function GET(request: Request) {
    try {
        const auth = await requireAuth(request);
        if (!auth) {
            return NextResponse.json({ 
                message: "Not authenticated." 
            }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const owner = searchParams.get('owner');
        const repo = searchParams.get('repo');
        const project = searchParams.get('project');
        const state = searchParams.get('state') || 'all';
        const per_page = searchParams.get('per_page') || '30';

        if (!owner || !repo) {
            return NextResponse.json({ 
                message: "Owner and repo parameters are required." 
            }, { status: 400 });
        }

        // 이슈 조회 URL 구성
        let issuesUrl = `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=${per_page}`;
        
        // 프로젝트 필터링이 있는 경우 labels 파라미터 추가
        if (project) {
            const labelFilter = project.startsWith('project:') ? project : `project:${project}`;
            issuesUrl += `&labels=${encodeURIComponent(labelFilter)}`;
        }

        // 사용자 토큰이 있으면 사용자 권한으로, 없으면 앱 권한으로 호출
        const response = auth.fromSession && auth.isGitHubApp
            ? await githubUserFetch(issuesUrl, auth.token)
            : await githubAppFetch(issuesUrl);

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const issues = await response.json();
        
        // 이슈 데이터를 정리하여 반환
        const processedIssues = issues.map((issue: any) => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            body: issue.body,
            state: issue.state,
            stateReason: issue.state_reason,
            user: {
                login: issue.user.login,
                avatarUrl: issue.user.avatar_url
            },
            labels: issue.labels.map((label: any) => ({
                id: label.id,
                name: label.name,
                color: label.color,
                description: label.description
            })),
            assignees: issue.assignees?.map((assignee: any) => ({
                login: assignee.login,
                avatarUrl: assignee.avatar_url
            })) || [],
            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
            htmlUrl: issue.html_url,
            commentsCount: issue.comments
        }));

        return NextResponse.json({
            issues: processedIssues,
            meta: {
                authMethod: auth.isGitHubApp ? "GitHub Apps (User)" : "GitHub Apps (Installation)",
                totalCount: issues.length,
                filters: {
                    owner,
                    repo,
                    project,
                    state
                }
            }
        });
    } catch (error) {
        console.error("Error fetching issues:", error);
        return NextResponse.json({ 
            message: "Error fetching issues",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

// GitHub Apps를 통해 새 이슈를 생성합니다.
export async function POST(request: Request) {
    try {
        const auth = await requireAuth(request);
        if (!auth) {
            return NextResponse.json({ 
                message: "Not authenticated." 
            }, { status: 401 });
        }

        const { owner, repo, title, body, labels, assignees } = await request.json();
        
        if (!owner || !repo || !title) {
            return NextResponse.json({ 
                message: "Owner, repo, and title are required." 
            }, { status: 400 });
        }

        const issueData = {
            title,
            body: body || '',
            labels: labels || [],
            assignees: assignees || []
        };

        // 사용자 토큰으로 이슈 생성 (더 적절한 권한)
        const response = auth.fromSession && auth.isGitHubApp
            ? await githubUserFetch(`https://api.github.com/repos/${owner}/${repo}/issues`, auth.token, {
                method: 'POST',
                body: JSON.stringify(issueData),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            : await githubAppFetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
                method: 'POST',
                body: JSON.stringify(issueData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`GitHub API error: ${response.statusText} - ${errorData.message || 'Unknown error'}`);
        }

        const newIssue = await response.json();
        
        return NextResponse.json({
            issue: {
                id: newIssue.id,
                number: newIssue.number,
                title: newIssue.title,
                body: newIssue.body,
                state: newIssue.state,
                htmlUrl: newIssue.html_url,
                createdAt: newIssue.created_at
            },
            meta: {
                authMethod: auth.isGitHubApp ? "GitHub Apps (User)" : "GitHub Apps (Installation)",
                createdBy: "API"
            }
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating issue:", error);
        return NextResponse.json({ 
            message: "Error creating issue",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
