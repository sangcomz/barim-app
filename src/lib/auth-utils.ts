import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { getInstallationAccessToken } from "./github-app";

interface CustomSession {
    accessToken?: string;
    provider?: string;
}

/**
 * 세션 또는 Authorization 헤더에서 액세스 토큰을 추출합니다.
 * GitHub Apps 방식을 우선적으로 처리합니다.
 */
export async function getAccessToken(request?: Request): Promise<string | null> {
    // 1. 세션에서 토큰 확인 (GitHub Apps OAuth)
    try {
        const session: CustomSession | null = await getServerSession(authOptions);
        if (session?.accessToken && session?.provider === "github") {
            return session.accessToken;
        }
    } catch {
        if (process.env.NODE_ENV === 'development') {
            console.log("Session not available, checking Authorization header");
        }
    }

    // 2. Authorization 헤더에서 토큰 확인
    if (request) {
        const authHeader = request.headers.get("authorization");
        if (authHeader) {
            // Bearer 토큰 형식 확인
            if (authHeader.startsWith("Bearer ")) {
                return authHeader.substring(7); // "Bearer " 제거
            }
            // 단순 토큰 형식
            if (authHeader.startsWith("token ")) {
                return authHeader.substring(6); // "token " 제거
            }
            // GitHub Personal Access Token 형식 (ghp_, gho_, ghs_, ghu_ 등으로 시작)
            if (authHeader.match(/^gh[pous]_[a-zA-Z0-9]{36,}$/)) {
                return authHeader;
            }
        }
    }

    return null;
}

/**
 * GitHub Apps Installation Access Token을 가져옵니다.
 * 앱 레벨의 작업에 사용됩니다.
 */
export async function getInstallationToken(): Promise<string | null> {
    try {
        return await getInstallationAccessToken();
    } catch (error) {
        console.error("Error getting installation access token:", error);
        return null;
    }
}

/**
 * 사용자 인증을 위한 토큰을 가져옵니다.
 * 사용자별 작업에 사용됩니다.
 */
export async function getUserToken(request?: Request): Promise<string | null> {
    // 우선 사용자 세션에서 토큰을 가져옴
    const userToken = await getAccessToken(request);
    if (userToken) {
        return userToken;
    }

    // 사용자 토큰이 없으면 Installation Token을 폴백으로 사용
    return await getInstallationToken();
}

/**
 * 인증된 사용자인지 확인하고 액세스 토큰을 반환합니다.
 * GitHub Apps 방식을 지원합니다.
 */
export async function requireAuth(request?: Request): Promise<{ 
    token: string; 
    fromSession: boolean;
    isGitHubApp: boolean;
} | null> {
    const token = await getUserToken(request);
    
    if (!token) {
        return null;
    }

    let fromSession: boolean;
    let isGitHubApp: boolean;
    
    try {
        const session: CustomSession | null = await getServerSession(authOptions);
        fromSession = session?.accessToken === token;
        isGitHubApp = session?.provider === "github" && fromSession;
    } catch {
        fromSession = false;
        isGitHubApp = false;
    }

    return { token, fromSession, isGitHubApp };
}

/**
 * GitHub Apps 전용 인증을 요구합니다.
 * Installation Access Token을 반환합니다.
 */
export async function requireAppAuth(): Promise<string | null> {
    return await getInstallationToken();
}
