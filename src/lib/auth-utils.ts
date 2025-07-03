import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

interface CustomSession {
    accessToken?: string;
}

/**
 * 세션 또는 Authorization 헤더에서 액세스 토큰을 추출합니다.
 * 1. 먼저 session에서 토큰 확인
 * 2. session이 없으면 Authorization 헤더에서 토큰 확인
 */
export async function getAccessToken(request?: Request): Promise<string | null> {
    // 1. 세션에서 토큰 확인
    try {
        const session: CustomSession | null = await getServerSession(authOptions);
        if (session?.accessToken) {
            return session.accessToken;
        }
    } catch {
        console.log("Session not available, checking Authorization header");
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
 * 인증된 사용자인지 확인하고 액세스 토큰을 반환합니다.
 */
export async function requireAuth(request?: Request): Promise<{ 
    token: string; 
    fromSession: boolean 
} | null> {
    const token = await getAccessToken(request);
    
    if (!token) {
        return null;
    }

    let fromSession: boolean;
    try {
        const session: CustomSession | null = await getServerSession(authOptions);
        fromSession = session?.accessToken === token;
    } catch {
        fromSession = false;
    }

    return { token, fromSession };
}