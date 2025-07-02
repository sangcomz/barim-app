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
    repo: string;
    issueType: 'Task' | 'Note';
}

export interface UpdateIssueRequest {
    state?: 'open' | 'closed';
    state_reason?: 'completed' | 'not_planned' | 'reopened';
    labels?: string[];
    title?: string;
    body?: string;
}

export interface CreateCommentRequest {
    body: string;
}
