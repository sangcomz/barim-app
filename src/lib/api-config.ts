const API_BASE_URL = 'https://barim-api.vercel.app';

// 토큰 리프레시 함수
async function refreshToken(): Promise<string | null> {
  try {
    // 서버에서 토큰 리프레시 API 호출
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.access_token;
    }

    // 리프레시 실패시 재로그인
    console.log('Token refresh failed, redirecting to login');
    window.location.href = '/api/auth/signin';
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    window.location.href = '/api/auth/signin';
    return null;
  }
}

// API 요청을 401 에러 핸들링과 함께 실행하는 헬퍼 함수
async function apiRequest<T>(
  apiCall: (token: string) => Promise<T>,
  token: string,
  maxRetries: number = 1
): Promise<T> {
  try {
    return await apiCall(token);
  } catch (error: any) {
    if (error.message.includes('401') && maxRetries > 0) {
      console.log('401 error detected, attempting token refresh...');
      const newToken = await refreshToken();
      if (newToken) {
        return apiRequest(apiCall, newToken, maxRetries - 1);
      }
    }
    throw error;
  }
}

export const API_ENDPOINTS = {
  // Projects
  projects: `${API_BASE_URL}/api/projects`,
  
  // Issues
  issues: `${API_BASE_URL}/api/issues`,
  issue: (issueNumber: number) => `${API_BASE_URL}/api/issues/${issueNumber}`,
  issueComments: (issueNumber: number) => `${API_BASE_URL}/api/issues/${issueNumber}/comments`,
  
  // Repositories
  repos: `${API_BASE_URL}/api/repos`,
  repo: (repositoryName: string) => `${API_BASE_URL}/api/repos/${repositoryName}`,
} as const;

export const createAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});

// Client-side API helper functions
export const barimApi = {
  async getProjects(token: string) {
    return apiRequest(async (currentToken: string) => {
      const response = await fetch(API_ENDPOINTS.projects, {
        headers: createAuthHeaders(currentToken),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    }, token);
  },

  async createProject(token: string, data: { projectName: string; description?: string }) {
    return apiRequest(async (currentToken: string) => {
      const response = await fetch(API_ENDPOINTS.projects, {
        method: 'POST',
        headers: createAuthHeaders(currentToken),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    }, token);
  },

  async getIssues(token: string, params: URLSearchParams) {
    return apiRequest(async (currentToken: string) => {
      const url = `${API_ENDPOINTS.issues}?${params.toString()}`;
      const response = await fetch(url, {
        headers: createAuthHeaders(currentToken),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    }, token);
  },

  async createIssue(token: string, data: {
    title: string;
    body: string;
    repo: string;
    issueType: string;
    tags?: string[];
  }) {
    return apiRequest(async (currentToken: string) => {
      const response = await fetch(API_ENDPOINTS.issues, {
        method: 'POST',
        headers: createAuthHeaders(currentToken),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    }, token);
  },

  async updateIssue(token: string, issueNumber: number, data: {
    repo?: string;
    labels?: string[];
    state?: string;
    state_reason?: string;
    title?: string;
    body?: string | null;
  }) {
    return apiRequest(async (currentToken: string) => {
      const response = await fetch(API_ENDPOINTS.issue(issueNumber), {
        method: 'POST',
        headers: createAuthHeaders(currentToken),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    }, token);
  },

  async addComment(token: string, issueNumber: number, data: { body: string }) {
    return apiRequest(async (currentToken: string) => {
      const response = await fetch(API_ENDPOINTS.issueComments(issueNumber), {
        method: 'POST',
        headers: createAuthHeaders(currentToken),
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    }, token);
  },

  async getRepos(token: string) {
    return apiRequest(async (currentToken: string) => {
      const response = await fetch(API_ENDPOINTS.repos, {
        headers: createAuthHeaders(currentToken),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      return response.json();
    }, token);
  },

  async hasRepo(token: string, repoName: string): Promise<boolean> {
    try {
      return await apiRequest(async (currentToken: string) => {
        const response = await fetch(API_ENDPOINTS.repo(repoName), {
          headers: createAuthHeaders(currentToken)
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`Repository ${repoName} check result:`, data);
          return true;
        }

        return false;
      }, token);
    } catch (error) {
      console.error(`Error checking for ${repoName} repository:`, error);
      return false;
    }
  }
};

export { API_BASE_URL };