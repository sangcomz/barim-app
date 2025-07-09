import jwt from 'jsonwebtoken'

// GitHub Apps JWT 토큰 생성
export function generateGitHubAppJWT(): string {
    const appId = process.env.GITHUB_APP_ID!
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY!
    
    const now = Math.floor(Date.now() / 1000)
    const payload = {
        iat: now - 60, // 1분 전 (시간 차이 보정)
        exp: now + 600, // 10분 후 만료
        iss: appId,
    }
    
    return jwt.sign(payload, privateKey, { algorithm: 'RS256' })
}

// Installation Access Token 생성
export async function getInstallationAccessToken(): Promise<string> {
    const jwtToken = generateGitHubAppJWT()
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID!
    
    const response = await fetch(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${jwtToken}`,
                Accept: 'application/vnd.github.v3+json',
                'User-Agent': 'barim-app'
            },
        }
    )
    
    if (!response.ok) {
        throw new Error(`Failed to get installation access token: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.token
}

// GitHub Apps를 통한 API 호출
export async function githubAppFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await getInstallationAccessToken()
    
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'barim-app'
        },
    })
}

// 사용자의 GitHub Apps 토큰으로 API 호출
export async function githubUserFetch(url: string, userToken: string, options: RequestInit = {}): Promise<Response> {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `token ${userToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'barim-app'
        },
    })
}

// GitHub Apps 설치 확인
export async function checkAppInstallation(owner: string, repo: string): Promise<boolean> {
    try {
        const response = await githubAppFetch(`https://api.github.com/repos/${owner}/${repo}`)
        return response.ok
    } catch (error) {
        console.error('Error checking app installation:', error)
        return false
    }
}

// 리포지토리 목록 가져오기 (Installation 기반)
export async function getInstallationRepositories() {
    try {
        const response = await githubAppFetch('https://api.github.com/installation/repositories')
        
        if (!response.ok) {
            throw new Error(`Failed to fetch repositories: ${response.statusText}`)
        }
        
        return await response.json()
    } catch (error) {
        console.error('Error fetching installation repositories:', error)
        throw error
    }
}
