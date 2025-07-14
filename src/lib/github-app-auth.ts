import jwt from 'jsonwebtoken';

interface GitHubAppInstallationToken {
    token: string;
    expires_at: string;
}

// GitHub App Installation Token 생성
export async function getGitHubAppInstallationToken(): Promise<string> {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

    if (!appId || !privateKey || !installationId) {
        throw new Error('GitHub App credentials not configured');
    }

    try {
        // 1. JWT 생성 (GitHub App 인증용)
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: parseInt(appId),
            iat: now - 60, // 1분 전
            exp: now + 600, // 10분 후
        };

        const jwtToken = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

        // 2. Installation Access Token 요청
        const response = await fetch(
            `https://api.github.com/app/installations/${installationId}/access_tokens`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Barim-App',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get installation token: ${response.status} ${errorText}`);
        }

        const tokenData: GitHubAppInstallationToken = await response.json();
        console.log('GitHub App Installation Token 생성 성공');
        
        return tokenData.token;
    } catch (error) {
        console.error(error)
        console.error('GitHub App Installation Token 생성 실패:', error);
        throw error;
    }
}

// GitHub App Installation Token을 사용한 Octokit 인스턴스 생성
export async function getGitHubAppOctokit() {
    const token = await getGitHubAppInstallationToken();
    const { Octokit } = await import('@octokit/rest');
    
    return new Octokit({
        auth: token,
        userAgent: 'Barim-App',
    });
}
