import { NextResponse } from "next/server";
import { generateGitHubAppJWT, getInstallationAccessToken, githubAppFetch } from "@/lib/github-app";
import { requireAuth } from "@/lib/auth-utils";

// GitHub Apps 기능 테스트
export async function GET(request: Request) {
    try {
        const auth = await requireAuth(request);
        if (!auth) {
            return NextResponse.json({ 
                message: "Authentication required" 
            }, { status: 401 });
        }

        const tests = [];
        
        // 1. JWT 토큰 생성 테스트
        try {
            const jwt = generateGitHubAppJWT();
            tests.push({
                name: "JWT Token Generation",
                status: "✅ SUCCESS",
                details: `JWT 토큰 생성 성공 (길이: ${jwt.length})`
            });
        } catch (error) {
            tests.push({
                name: "JWT Token Generation",
                status: "❌ FAILED",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }

        // 2. Installation Access Token 테스트
        try {
            const installationToken = await getInstallationAccessToken();
            tests.push({
                name: "Installation Access Token",
                status: "✅ SUCCESS",
                details: `Installation 토큰 획득 성공 (길이: ${installationToken.length})`
            });
        } catch (error) {
            tests.push({
                name: "Installation Access Token",
                status: "❌ FAILED",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }

        // 3. GitHub Apps API 호출 테스트
        try {
            const response = await githubAppFetch('https://api.github.com/installation/repositories?per_page=5');
            const data = await response.json();
            
            tests.push({
                name: "GitHub Apps API Call",
                status: response.ok ? "✅ SUCCESS" : "❌ FAILED",
                details: response.ok 
                    ? `API 호출 성공, ${data.total_count}개 저장소 발견`
                    : `API 호출 실패: ${response.statusText}`
            });
        } catch (error) {
            tests.push({
                name: "GitHub Apps API Call",
                status: "❌ FAILED",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }

        // 4. 특정 저장소 접근 테스트 (barim-data)
        try {
            const response = await githubAppFetch('https://api.github.com/repos/sangcomz/barim-data');
            const repoData = await response.json();
            
            tests.push({
                name: "barim-data Repository Access",
                status: response.ok ? "✅ SUCCESS" : "❌ FAILED",
                details: response.ok 
                    ? `저장소 접근 성공: ${repoData.name} (${repoData.visibility})`
                    : `저장소 접근 실패: ${response.statusText}`
            });
        } catch (error) {
            tests.push({
                name: "barim-data Repository Access",
                status: "❌ FAILED",
                error: error instanceof Error ? error.message : "Unknown error"
            });
        }

        // 5. 사용자 인증 상태 확인
        tests.push({
            name: "User Authentication Status",
            status: "ℹ️ INFO",
            details: `인증 방식: ${auth.isGitHubApp ? 'GitHub Apps' : 'OAuth Apps'}, 세션에서: ${auth.fromSession ? 'Yes' : 'No'}`
        });

        return NextResponse.json({
            message: "GitHub Apps 테스트 완료",
            timestamp: new Date().toISOString(),
            environment: {
                appId: process.env.GITHUB_APP_ID ? "설정됨" : "미설정",
                privateKey: process.env.GITHUB_APP_PRIVATE_KEY ? "설정됨" : "미설정",
                installationId: process.env.GITHUB_APP_INSTALLATION_ID ? "설정됨" : "미설정",
                clientId: process.env.GITHUB_APP_CLIENT_ID ? "설정됨" : "미설정",
                clientSecret: process.env.GITHUB_APP_CLIENT_SECRET ? "설정됨" : "미설정"
            },
            tests,
            summary: {
                total: tests.length,
                passed: tests.filter(t => t.status.includes("SUCCESS")).length,
                failed: tests.filter(t => t.status.includes("FAILED")).length,
                info: tests.filter(t => t.status.includes("INFO")).length
            }
        });
    } catch (error) {
        console.error("GitHub Apps test error:", error);
        return NextResponse.json({ 
            message: "GitHub Apps 테스트 중 오류 발생",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

// GitHub Apps 설정 정보 확인
export async function POST(request: Request) {
    try {
        const auth = await requireAuth(request);
        if (!auth) {
            return NextResponse.json({ 
                message: "Authentication required" 
            }, { status: 401 });
        }

        // 환경 변수 검증
        const config = {
            appId: process.env.GITHUB_APP_ID,
            appName: process.env.GITHUB_APP_NAME,
            installationId: process.env.GITHUB_APP_INSTALLATION_ID,
            clientId: process.env.GITHUB_APP_CLIENT_ID,
            hasPrivateKey: !!process.env.GITHUB_APP_PRIVATE_KEY,
            hasClientSecret: !!process.env.GITHUB_APP_CLIENT_SECRET,
        };

        const issues = [];
        
        if (!config.appId) issues.push("GITHUB_APP_ID가 설정되지 않았습니다.");
        if (!config.hasPrivateKey) issues.push("GITHUB_APP_PRIVATE_KEY가 설정되지 않았습니다.");
        if (!config.installationId) issues.push("GITHUB_APP_INSTALLATION_ID가 설정되지 않았습니다.");
        if (!config.clientId) issues.push("GITHUB_APP_CLIENT_ID가 설정되지 않았습니다.");
        if (!config.hasClientSecret) issues.push("GITHUB_APP_CLIENT_SECRET가 설정되지 않았습니다.");

        return NextResponse.json({
            message: "GitHub Apps 설정 정보",
            config: {
                ...config,
                privateKey: config.hasPrivateKey ? "[설정됨]" : "[미설정]",
                clientSecret: config.hasClientSecret ? "[설정됨]" : "[미설정]"
            },
            issues,
            isValid: issues.length === 0,
            recommendations: issues.length === 0 ? 
                ["모든 설정이 올바르게 구성되었습니다."] : 
                [
                    "환경 변수를 .env.local 파일에 올바르게 설정하세요.",
                    "GitHub Apps 설정 페이지에서 올바른 값들을 확인하세요.",
                    "Private Key는 -----BEGIN RSA PRIVATE KEY-----로 시작해야 합니다."
                ]
        });
    } catch (error) {
        console.error("GitHub Apps config check error:", error);
        return NextResponse.json({ 
            message: "설정 확인 중 오류 발생",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
