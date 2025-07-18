const API_BASE_URL = 'https://barim-api.vercel.app';

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
    const response = await fetch(API_ENDPOINTS.projects, {
      headers: createAuthHeaders(token),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async createProject(token: string, data: { projectName: string; description?: string }) {
    const response = await fetch(API_ENDPOINTS.projects, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async getIssues(token: string, params: URLSearchParams) {
    const url = `${API_ENDPOINTS.issues}?${params.toString()}`;
    const response = await fetch(url, {
      headers: createAuthHeaders(token),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async createIssue(token: string, data: {
    title: string;
    body: string;
    repo: string;
    issueType: string;
    tags?: string[];
  }) {
    const response = await fetch(API_ENDPOINTS.issues, {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async updateIssue(token: string, issueNumber: number, data: {
    repo?: string;
    labels?: string[];
    state?: string;
    state_reason?: string;
    title?: string;
    body?: string | null;
  }) {
    const response = await fetch(API_ENDPOINTS.issue(issueNumber), {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async addComment(token: string, issueNumber: number, data: { body: string }) {
    const response = await fetch(API_ENDPOINTS.issueComments(issueNumber), {
      method: 'POST',
      headers: createAuthHeaders(token),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async getRepos(token: string) {
    const response = await fetch(API_ENDPOINTS.repos, {
      headers: createAuthHeaders(token),
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  },

  async hasRepo(token: string, repoName: string): Promise<boolean> {
    try {
      const response = await fetch(API_ENDPOINTS.repo(repoName), {
        headers: createAuthHeaders(token)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Repository ${repoName} check result:`, data);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking for ${repoName} repository:`, error);
      return false;
    }
  }
};

export { API_BASE_URL };