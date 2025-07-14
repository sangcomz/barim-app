import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGitHubAppOctokit } from '@/lib/github-app-auth';

// 고정 레포지토리 이름 (물리적 저장소)
const PHYSICAL_REPO = "barim-data";

// POST: 이슈 수정 (라벨, 상태, 제목, 내용)
export async function POST(request: NextRequest, { params }: { params: { issue_number: string } }) {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
        return NextResponse.json({ 
            message: "Not authenticated. Please provide a valid session." 
        }, { status: 401 });
    }

    const issueNumber = parseInt(params.issue_number);
    
    if (isNaN(issueNumber)) {
        return NextResponse.json({ message: "Invalid issue number" }, { status: 400 });
    }

    try {
        const { repo, labels, state, state_reason, title, body } = await request.json();

        if (!repo) {
            return NextResponse.json({ message: "Repository parameter is required" }, { status: 400 });
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

        // 이슈 업데이트 파라미터 구성
        const updateParams: any = {
            owner: owner,
            repo: PHYSICAL_REPO,
            issue_number: issueNumber,
        };

        if (labels !== undefined) {
            updateParams.labels = labels;
        }

        if (state !== undefined) {
            updateParams.state = state;
        }

        if (state_reason !== undefined) {
            updateParams.state_reason = state_reason;
        }

        if (title !== undefined) {
            updateParams.title = title;
        }

        if (body !== undefined) {
            updateParams.body = body;
        }

        // barim-data 레포지토리에서 이슈 업데이트 (GitHub App 권한으로)
        const { data: issue } = await octokit.rest.issues.update(updateParams);

        return NextResponse.json({
            message: "Issue updated successfully",
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
                state: issue.state,
                updated_at: issue.updated_at,
            },
            meta: {
                authSource: "github-app",
                repository: PHYSICAL_REPO,
                project: repo,
            }
        });
    } catch (error) {
        console.error("Error updating issue:", error);
        return NextResponse.json({ 
            message: "Error updating issue", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
