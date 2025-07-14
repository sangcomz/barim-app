import { barimApi } from "@/lib/api-config";

export interface GitHubAppInstallStatus {
    isAppInstalled: boolean;
    hasBarimDataRepo: boolean;
}

const PHYSICAL_REPO = "barim-data";

export async function checkGitHubAppInstallation(accessToken: string): Promise<GitHubAppInstallStatus> {
    try {
        console.log('GitHub App 설치 상태 확인 시작');

        // GitHub App Installation Token을 사용하여 Octokit 인스턴스 생성
        const hasBarimDataRepo = await barimApi.hasRepo(accessToken, PHYSICAL_REPO);

        // GitHub App이 설치되어 있다면 installation token을 성공적으로 얻었다는 뜻
        const result = {
            isAppInstalled: true, // installation token을 성공적으로 얻었으므로 true
            hasBarimDataRepo: hasBarimDataRepo,
        };

        console.log('GitHub App 설치 상태 확인 완료:', result);
        return result;

    } catch (error) {
        console.error('GitHub App 설치 상태 확인 에러:', error);

        // GitHub App이 설치되지 않았거나 권한이 없으면 installation token 생성 실패
        return {
            isAppInstalled: false,
            hasBarimDataRepo: false,
        };
    }
}
