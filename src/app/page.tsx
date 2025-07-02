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

  // 레포지토리 목록 불러오기
  const fetchRepos = async () => {
    try {
      const response = await fetch('/api/repos');
      if (!response.ok) throw new Error('Failed to fetch repositories.');
      const data = await response.json();
      setAllRepos(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    }
  };

  // 특정 레포지토리의 이슈 목록 불러오기
  const fetchIssues = useCallback(async (repoName: string) => {
    if (!repoName) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/issues?repo=${repoName}&page=${page}`);
      if (!response.ok) throw new Error('Failed to fetch issues.');
      const data = await response.json();
      setIssues(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  // 새 항목(Task/Note) 생성
  const handleCreateIssue = async (e: FormEvent, issueType: 'Task' | 'Note') => {
    e.preventDefault();
    if (!newIssueTitle) {
      alert('제목을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newIssueTitle, body: newIssueBody, repo: selectedRepo, issueType }),
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
    const updatePayload: UpdatePayload = { repo: selectedRepo }; // repo 정보 추가

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
          repo: selectedRepo,
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
        body: JSON.stringify({ labels: newLabels }),
      });

      // 2. PENDING 이유를 댓글로 추가
      await fetch(`/api/issues/${pendingIssue.number}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: `**PENDING:** ${pendingReason}` }),
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
      setPage(1); // 레포가 바뀌면 첫 페이지로
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

        <div>
          <label htmlFor="repo-select">프로젝트(레포지토리) 선택: </label>
          <select id="repo-select" value={selectedRepo} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedRepo(e.target.value)}>
            <option value="">-- 레포지토리를 선택하세요 --</option>
            {allRepos.map(repo => <option key={repo.id} value={repo.name}>{repo.name}</option>)}
          </select>
        </div>

        {selectedRepo && (
            <>
              <hr style={{ margin: '20px 0' }}/>
              <div style={{ marginBottom: '30px' }}>
                <h2>새 항목 만들기 (in &apos;{selectedRepo}&apos;)</h2>
                <form onSubmit={(e) => e.preventDefault()}>
                  <input type="text" value={newIssueTitle} onChange={(e) => setNewIssueTitle(e.target.value)} placeholder="제목" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}/>
                  <textarea value={newIssueBody} onChange={(e) => setNewIssueBody(e.target.value)} placeholder="상세 내용 (선택 사항)" style={{ width: '100%', minHeight: '80px', padding: '8px', boxSizing: 'border-box', marginBottom: '10px' }}/>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={(e) => handleCreateIssue(e, 'Task')} disabled={isLoading}>{isLoading ? '...' : 'Task로 생성'}</button>
                    <button onClick={(e) => handleCreateIssue(e, 'Note')} disabled={isLoading}>{isLoading ? '...' : 'Note로 생성'}</button>
                  </div>
                </form>
              </div>

              <hr style={{ margin: '20px 0' }}/>
              <h2>목록</h2>
              {isLoading && <p>로딩 중...</p>}
              {error && <p style={{ color: 'red' }}>에러: {error}</p>}
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {issues.map((issue) => {
                  // 라벨 이름만으로 상태를 확인
                  const labels = issue.labels.map(l => l.name);
                  const isTask = labels.includes('Task');
                  const isTodo = labels.includes('TODO');
                  const isDoing = labels.includes('DOING');
                  const isDone = labels.includes('DONE'); // ✨ 완료 상태 확인

                  return (
                      // ✨ 완료된 항목이면 취소선과 흐리게 처리
                      <li key={issue.id} style={{
                        border: '1px solid #ddd',
                        padding: '15px',
                        marginBottom: '10px',
                        borderRadius: '5px',
                        background: isDone ? '#f6f8fa' : '#fff', // 배경색 변경
                        opacity: isDone ? 0.7 : 1, // 투명도 조절
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <a href={issue.html_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#0366d6' }}>
                            {/* ✨ 완료된 항목이면 제목에 취소선 추가 */}
                            <strong style={{ fontSize: '1.2em', textDecoration: isDone ? 'line-through' : 'none' }}>
                              {issue.title}
                            </strong>
                          </a>
                          {/* ✨ 완료된 항목이 아닐 때만 삭제 버튼 표시 */}
                          {!isDone && (
                              <button onClick={() => handleCloseIssue(issue.number, 'not_planned')} disabled={isLoading} style={{ background: 'none', border: '1px solid #d9534f', color: '#d9534f', borderRadius: '5px', cursor: 'pointer', padding: '3px 8px' }}>
                                삭제
                              </button>
                          )}
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          {issue.labels.map(label => (
                              <span key={label.name} style={{ background: `#${label.color || 'eee'}`, color: '#fff', textShadow: '0 0 2px #000', padding: '2px 8px', marginRight: '5px', borderRadius: '10px', fontSize: '12px' }}>{label.name}</span>
                          ))}
                        </div>
                        <p style={{ marginTop: '10px', color: '#586069' }}>{issue.body || '상세 내용 없음'}</p>

                        {/* ✨ 완료되지 않은 Task일 때만 상태 변경 버튼 표시 */}
                        {isTask && !isDone && (
                            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              {isTodo && <button onClick={() => handleUpdateState(issue, 'DOING')}>▶️ DOING</button>}
                              {isDoing && <button onClick={() => handleUpdateState(issue, 'DONE')}>✅ DONE</button>}
                              {isDoing && <button onClick={() => handleUpdateState(issue, 'PENDING')}>⏸️ PENDING</button>}
                            </div>
                        )}
                      </li>
                  );
                })}
              </ul>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>이전 페이지</button>
                <span>Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={issues.length < 10 || isLoading}>다음 페이지</button>
              </div>
            </>
        )}

        {isPendingModalOpen && pendingIssue && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '5px', width: '400px' }}>
                <h3>&apos;{pendingIssue.title}&apos; 보류 사유</h3>
                <form onSubmit={handleConfirmPending}>
                  <textarea value={pendingReason} onChange={(e) => setPendingReason(e.target.value)} placeholder="보류하는 이유를 입력하세요..." style={{ width: '100%', minHeight: '100px', boxSizing: 'border-box' }} required />
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setIsPendingModalOpen(false)}>취소</button>
                    <button type="submit" disabled={isLoading}>{isLoading ? '...' : '확인'}</button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </main>
  );
}