import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGitHubAppOctokit } from '@/lib/github-app-auth';

// 고정 레포지토리 이름 (물리적 저장소)
const PHYSICAL_REPO = "barim-data";

// POST: 이슈에 댓글 추가
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
        const { body, repo } = await request.json();

        if (!body || !repo) {
            return NextResponse.json({ message: "Comment body and repository are required" }, { status: 400 });
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

        // barim-data 레포지토리에 댓글 생성 (GitHub App 권한으로)
        const { data: comment } = await octokit.rest.issues.createComment({
            owner: owner,
            repo: PHYSICAL_REPO,
            issue_number: issueNumber,
            body: body,
        });

        return NextResponse.json({
            message: "Comment created successfully",
            comment: {
                id: comment.id,
                body: comment.body,
                html_url: comment.html_url,
                created_at: comment.created_at,
                updated_at: comment.updated_at,
                user: comment.user,
            },
            meta: {
                authSource: "github-app",
                repository: PHYSICAL_REPO,
                project: repo,
                issueNumber: issueNumber,
            }
        });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ 
            message: "Error creating comment", 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
