import { NextResponse } from "next/server";
import { getInstallationRepositories, githubAppFetch } from "@/lib/github-app";
import { requireAuth, requireAppAuth } from "@/lib/auth-utils";

// GitHub Apps를 통해 액세스 가능한 리포지토리 목록을 가져옵니다.
export async function GET(request: Request) {
    try {
        // 사용자 인증 확인
        const auth = await requireAuth(request);
        if (!auth) {
            return NextResponse.json({ 
                message: "Not authenticated. Please log in with GitHub Apps." 
            }, { status: 401 });
        }

        // GitHub Apps Installation을 통해 리포지토리 목록 가져오기
        const reposData = await getInstallationRepositories();
        
        // 리포지토리 정보를 더 유용한 형태로 변환
        const repositories = reposData.repositories.map((repo: any) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            private: repo.private,
            htmlUrl: repo.html_url,
            defaultBranch: repo.default_branch,
            language: repo.language,
            stargazersCount: repo.stargazers_count,
            forksCount: repo.forks_count,
            openIssuesCount: repo.open_issues_count,
            createdAt: repo.created_at,
            updatedAt: repo.updated_at,
            permissions: repo.permissions
        }));

        return NextResponse.json({
            repositories,
            meta: {
                totalCount: reposData.total_count,
                authMethod: "GitHub Apps",
                isGitHubApp: auth.isGitHubApp,
                fromSession: auth.fromSession
            }
        });
    } catch (error) {
        console.error("Error fetching GitHub Apps repositories:", error);
        return NextResponse.json({ 
            message: "Error fetching repositories through GitHub Apps",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

// GitHub Apps를 통해 특정 리포지토리 정보를 가져옵니다.
export async function POST(request: Request) {
    try {
        const auth = await requireAuth(request);
        if (!auth) {
            return NextResponse.json({ 
                message: "Not authenticated." 
            }, { status: 401 });
        }

        const { owner, repo } = await request.json();
        
        if (!owner || !repo) {
            return NextResponse.json({ 
                message: "Owner and repo parameters are required." 
            }, { status: 400 });
        }

        // GitHub Apps를 통해 특정 리포지토리 정보 가져오기
        const response = await githubAppFetch(`https://api.github.com/repos/${owner}/${repo}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ 
                    message: "Repository not found or not accessible through GitHub Apps." 
                }, { status: 404 });
            }
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const repoData = await response.json();
        
        return NextResponse.json({
            repository: {
                id: repoData.id,
                name: repoData.name,
                fullName: repoData.full_name,
                description: repoData.description,
                private: repoData.private,
                htmlUrl: repoData.html_url,
                defaultBranch: repoData.default_branch,
                language: repoData.language,
                stargazersCount: repoData.stargazers_count,
                forksCount: repoData.forks_count,
                openIssuesCount: repoData.open_issues_count,
                createdAt: repoData.created_at,
                updatedAt: repoData.updated_at,
                permissions: repoData.permissions
            },
            meta: {
                authMethod: "GitHub Apps",
                accessedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error("Error fetching repository:", error);
        return NextResponse.json({ 
            message: "Error fetching repository",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
