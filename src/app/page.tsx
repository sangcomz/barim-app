'use client';

import { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";

// 데이터 타입 정의
interface Label {
  id?: number;
  name: string;
  color?: string;
}

interface Issue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  labels: Label[];
}

interface Repo {
  id: number;
  name: string;
}

interface UpdatePayload {
  repo: string;
  labels?: string[];
  state?: string;
  state_reason?: string;
}

export default function HomePage() {
  // 세션 및 상태 관리
  const { data: session, status } = useSession();
  const [allRepos, setAllRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 새 항목 생성 폼 상태
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueBody, setNewIssueBody] = useState('');

  // PENDING 모달 상태
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);
  const [pendingIssue, setPendingIssue] = useState<Issue | null>(null);
  const [pendingReason, setPendingReason] = useState('');

  // --- API 호출 함수들 ---

  // 레포지토리 목록 불러오기 (프로젝트 선택용)
  const fetchRepos = async () => {
    try {
      const response = await fetch('/api/repos');
      if (!response.ok) throw new Error('Failed to fetch repositories.');
      const data = await response.json();
      // API 응답 구조가 변경됨: { repos: [...], meta: {...} }
      setAllRepos(data.repos || data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  // 특정 프로젝트 라벨의 이슈들만 불러오기
  const fetchIssues = useCallback(async (projectName: string) => {
    if (!projectName) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/issues?repo=${projectName}&page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch issues.');
      const data = await response.json();
      // API 응답 구조: { issues: [...], meta: {...} }
      setIssues(data.issues || data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  // 새 항목(Task/Note) 생성 (선택한 프로젝트 라벨 추가)
  const handleCreateIssue = async (e: FormEvent, issueType: 'Task' | 'Note') => {
    e.preventDefault();
    if (!newIssueTitle) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!selectedRepo) {
      alert('프로젝트를 선택해주세요.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: newIssueTitle, 
          body: newIssueBody, 
          repo: selectedRepo, // 프로젝트 라벨로 사용
          issueType 
        }),
      });
      if (!response.ok) throw new Error('Failed to create issue.');

      setNewIssueTitle('');
      setNewIssueBody('');
      await fetchIssues(selectedRepo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Task 상태 변경 (TODO -> DOING, DOING -> DONE/PENDING)
  const handleUpdateState = async (issue: Issue, newState: 'DOING' | 'DONE' | 'PENDING') => {
    if (newState === 'PENDING') {
      setPendingIssue(issue);
      setIsPendingModalOpen(true);
      return;
    }

    setIsLoading(true);
    let newLabels = issue.labels.map(l => l.name);
    const updatePayload: UpdatePayload = { repo: 'barim-data' };

    if (newState === 'DOING') {
      newLabels = newLabels.filter(name => name !== 'TODO');
      newLabels.push('DOING');
      updatePayload.labels = newLabels;
    } else if (newState === 'DONE') {
      newLabels = newLabels.filter(name => name !== 'DOING');
      newLabels.push('DONE');
      updatePayload.labels = newLabels;
      updatePayload.state = 'closed';
      updatePayload.state_reason = 'completed';
    }

    try {
      const response = await fetch(`/api/issues/${issue.number}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      if (!response.ok) throw new Error('Failed to update issue state.');

      await fetchIssues(selectedRepo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 이슈 닫기 (삭제)
  const handleCloseIssue = async (issueNumber: number, reason: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/issues/${issueNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repo: 'barim-data',
          state: 'closed',
          state_reason: reason 
        }),
      });
      if (!response.ok) throw new Error('Failed to close issue.');

      await fetchIssues(selectedRepo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // PENDING 상태 확정 (라벨 변경 및 댓글 추가)
  const handleConfirmPending = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingIssue || !pendingReason) return;

    setIsLoading(true);
    try {
      // 1. PENDING 라벨 추가
      const newLabels = pendingIssue.labels.map(l => l.name).filter(name => name !== 'DOING' && name !== 'TODO');
      newLabels.push('PENDING');
      await fetch(`/api/issues/${pendingIssue.number}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repo: 'barim-data',
          labels: newLabels 
        }),
      });

      // 2. PENDING 이유를 댓글로 추가
      await fetch(`/api/issues/${pendingIssue.number}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          body: `**PENDING:** ${pendingReason}`,
          repo: 'barim-data'
        }),
      });

      // 3. 모달 닫고 목록 새로고침
      setIsPendingModalOpen(false);
      setPendingReason('');
      setPendingIssue(null);
      await fetchIssues(selectedRepo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- useEffect 훅들 ---
  useEffect(() => {
    if (status === 'authenticated') fetchRepos();
  }, [status]);

  useEffect(() => {
    if (selectedRepo) {
      setPage(1); // 프로젝트가 바뀌면 첫 페이지로
      fetchIssues(selectedRepo);
    } else {
      setIssues([]);
    }
  }, [selectedRepo, fetchIssues]);

  useEffect(() => {
    if (selectedRepo) fetchIssues(selectedRepo);
  }, [page, selectedRepo, fetchIssues]);

  // --- UI 렌더링 ---
  if (status === "loading") {
    return <main style={{ padding: '50px', textAlign: 'center' }}>Loading...</main>;
  }

  if (!session) {
    return (
        <main style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Barim에 오신 것을 환영합니다</h1>
          <p>GitHub 계정으로 로그인하여 할 일 목록을 관리해보세요.</p>
          <button onClick={() => signIn('github')} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            GitHub으로 로그인
          </button>
        </main>
    );
  }

  return (
      <main style={{ fontFamily: 'sans-serif', maxWidth: '800px', margin: 'auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>{session.user?.name}님의 Barim</h1>
          <button onClick={() => signOut()} style={{ padding: '8px 15px', cursor: 'pointer' }}>로그아웃</button>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f6f8fa', borderRadius: '8px', border: '1px solid #d1d9e0' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#24292f' }}>📋 프로젝트별 작업 관리</h3>
          <p style={{ margin: '0 0 10px 0', color: '#656d76', fontSize: '14px' }}>
            • 모든 작업은 <strong>barim-data</strong> 레포지토리에 저장됩니다<br/>
            • 아래에서 프로젝트를 선택하면 해당 프로젝트의 작업들만 필터링해서 보여줍니다<br/>
            • 새로 생성하는 작업에는 선택한 프로젝트 라벨이 자동으로 추가됩니다
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="repo-select" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            🎯 프로젝트 선택:
          </label>
          <select 
            id="repo-select" 
            value={selectedRepo} 
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRepo(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '10px', 
              fontSize: '16px', 
              borderRadius: '6px', 
              border: '1px solid #d1d9e0' 
            }}
          >
            <option value="">-- 프로젝트를 선택하세요 --</option>
            {allRepos.map(repo => (
              <option key={repo.id} value={repo.name}>{repo.name}</option>
            ))}
          </select>
        </div>

        {selectedRepo && (
            <>
              <hr style={{ margin: '20px 0' }}/>
              <div style={{ marginBottom: '30px' }}>
                <h2>새 항목 만들기</h2>
                <p style={{ color: '#656d76', fontSize: '14px', margin: '0 0 15px 0' }}>
                  <strong>{selectedRepo}</strong> 프로젝트에 새로운 작업이나 노트를 추가합니다
                </p>
                <form onSubmit={(e) => e.preventDefault()}>
                  <input 
                    type="text" 
                    value={newIssueTitle} 
                    onChange={(e) => setNewIssueTitle(e.target.value)} 
                    placeholder="제목" 
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      boxSizing: 'border-box', 
                      marginBottom: '10px',
                      borderRadius: '4px',
                      border: '1px solid #d1d9e0'
                    }}
                  />
                  <textarea 
                    value={newIssueBody} 
                    onChange={(e) => setNewIssueBody(e.target.value)} 
                    placeholder="상세 내용 (선택 사항)" 
                    style={{ 
                      width: '100%', 
                      minHeight: '80px', 
                      padding: '8px', 
                      boxSizing: 'border-box', 
                      marginBottom: '10px',
                      borderRadius: '4px',
                      border: '1px solid #d1d9e0'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={(e) => handleCreateIssue(e, 'Task')} 
                      disabled={isLoading}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#0969da',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isLoading ? '...' : '📋 Task로 생성'}
                    </button>
                    <button 
                      onClick={(e) => handleCreateIssue(e, 'Note')} 
                      disabled={isLoading}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#bf8700',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isLoading ? '...' : '📝 Note로 생성'}
                    </button>
                  </div>
                </form>
              </div>

              <hr style={{ margin: '20px 0' }}/>
              <h2>{selectedRepo} 프로젝트의 작업 목록</h2>
              {isLoading && <p>로딩 중...</p>}
              {error && <p style={{ color: 'red' }}>에러: {error}</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {issues.map((issue) => {
                  // 라벨 이름만으로 상태를 확인
                  const labels = issue.labels.map(l => l.name);
                  const isTask = labels.includes('Task');
                  const isTodo = labels.includes('TODO');
                  const isDoing = labels.includes('DOING');
                  const isDone = labels.includes('DONE');

                  return (
                      <li key={issue.id} style={{
                        border: '1px solid #d1d9e0',
                        padding: '15px',
                        marginBottom: '10px',
                        borderRadius: '8px',
                        background: isDone ? '#f6f8fa' : '#fff',
                        opacity: isDone ? 0.7 : 1,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <a href={issue.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0969da' }}>
                            <strong style={{ fontSize: '1.2em', textDecoration: isDone ? 'line-through' : 'none' }}>
                              {issue.title}
                            </strong>
                          </a>
                          {!isDone && (
                              <button 
                                onClick={() => handleCloseIssue(issue.number, 'not_planned')} 
                                disabled={isLoading} 
                                style={{ 
                                  background: 'none', 
                                  border: '1px solid #da3633', 
                                  color: '#da3633', 
                                  borderRadius: '6px', 
                                  cursor: 'pointer', 
                                  padding: '4px 8px',
                                  fontSize: '12px'
                                }}
                              >
                                삭제
                              </button>
                          )}
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          {issue.labels.map(label => (
                              <span 
                                key={label.name} 
                                style={{ 
                                  background: `#${label.color || 'eee'}`, 
                                  color: '#fff', 
                                  textShadow: '0 0 2px #000', 
                                  padding: '2px 8px', 
                                  marginRight: '5px', 
                                  borderRadius: '12px', 
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}
                              >
                                {label.name}
                              </span>
                          ))}
                        </div>
                        <p style={{ marginTop: '10px', color: '#656d76' }}>
                          {issue.body || '상세 내용 없음'}
                        </p>

                        {isTask && !isDone && (
                            <div style={{ 
                              marginTop: '15px', 
                              paddingTop: '10px', 
                              borderTop: '1px solid #eee', 
                              display: 'flex', 
                              gap: '8px', 
                              flexWrap: 'wrap' 
                            }}>
                              {isTodo && (
                                <button 
                                  onClick={() => handleUpdateState(issue, 'DOING')}
                                  style={{
                                    padding: '6px 12px',
                                    backgroundColor: '#1f883d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  ▶️ DOING
                                </button>
                              )}
                              {isDoing && (
                                <>
                                  <button 
                                    onClick={() => handleUpdateState(issue, 'DONE')}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#1f883d',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✅ DONE
                                  </button>
                                  <button 
                                    onClick={() => handleUpdateState(issue, 'PENDING')}
                                    style={{
                                      padding: '6px 12px',
                                      backgroundColor: '#d1242f',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ⏸️ PENDING
                                  </button>
                                </>
                              )}
                            </div>
                        )}
                      </li>
                  );
                })}
              </ul>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '20px' 
              }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1 || isLoading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: page === 1 ? '#f6f8fa' : '#f3f4f6',
                    border: '1px solid #d1d9e0',
                    borderRadius: '6px',
                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  이전 페이지
                </button>
                <span style={{ fontWeight: 'bold' }}>Page {page}</span>
                <button 
                  onClick={() => setPage(p => p + 1)} 
                  disabled={issues.length < 10 || isLoading}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: issues.length < 10 ? '#f6f8fa' : '#f3f4f6',
                    border: '1px solid #d1d9e0',
                    borderRadius: '6px',
                    cursor: issues.length < 10 ? 'not-allowed' : 'pointer'
                  }}
                >
                  다음 페이지
                </button>
              </div>
            </>
        )}

        {isPendingModalOpen && pendingIssue && (
            <div style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              background: 'rgba(0,0,0,0.5)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{ 
                background: 'white', 
                padding: '24px', 
                borderRadius: '8px', 
                width: '400px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }}>
                <h3 style={{ margin: '0 0 16px 0' }}>
                  &apos;{pendingIssue.title}&apos; 보류 사유
                </h3>
                <form onSubmit={handleConfirmPending}>
                  <textarea 
                    value={pendingReason} 
                    onChange={(e) => setPendingReason(e.target.value)} 
                    placeholder="보류하는 이유를 입력하세요..." 
                    style={{ 
                      width: '100%', 
                      minHeight: '100px', 
                      boxSizing: 'border-box',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #d1d9e0',
                      resize: 'vertical'
                    }} 
                    required 
                  />
                  <div style={{ 
                    marginTop: '16px', 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    gap: '8px' 
                  }}>
                    <button 
                      type="button" 
                      onClick={() => setIsPendingModalOpen(false)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f6f8fa',
                        border: '1px solid #d1d9e0',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      취소
                    </button>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#d1242f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isLoading ? '...' : '확인'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </main>
  );
}