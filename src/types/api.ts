// API에서 사용하는 공통 타입들

export interface CustomSession {
    accessToken?: string;
}

export interface ApiError {
    message: string;
}

export interface CreateIssueRequest {
    title: string;
    body?: string;
    repo: string; // 프로젝트 라벨로 사용 (물리적으로는 barim-data에 저장)
    issueType: 'Task' | 'Note';
}

export interface UpdateIssueRequest {
    state?: 'open' | 'closed';
    state_reason?: 'completed' | 'not_planned' | 'reopened';
    labels?: string[];
    title?: string;
    body?: string;
    repo?: string; // 하위 호환성을 위해 유지 (대부분 barim-data로 고정)
}

export interface CreateCommentRequest {
    body: string;
    repo?: string; // 하위 호환성을 위해 유지 (대부분 barim-data로 고정)
}

// Dynamic route params for Next.js 15+ (Promise-based)
export interface IssueParams {
    issue_number: string;
}

// 물리적 저장소 (고정)
export const PHYSICAL_REPO = "barim-data";

// 프로젝트별 필터링 및 라벨링 시스템
export interface ProjectFilter {
    projectLabel: string; // 선택한 프로젝트 이름 (라벨로 사용)
    physicalRepo: typeof PHYSICAL_REPO; // 실제 저장되는 레포 (항상 barim-data)
}
