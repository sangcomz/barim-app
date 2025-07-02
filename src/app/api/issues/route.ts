import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

interface CustomSession {
    accessToken?: string;
}

// 랜덤 색상 생성 함수
const getRandomColor = () => Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

// GET: 이슈 목록 불러오기 (완료된 항목 포함하도록 수정)
export async function GET(request: Request) {
    const session: CustomSession | null = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const octokit = new Octokit({ auth: session.accessToken });
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');
    const page = searchParams.get('page') || '1';

    if (!repo) {
        return NextResponse.json({ message: "Repository name is required" }, { status: 400 });
    }

    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        const { data: issues } = await octokit.rest.issues.listForRepo({
            owner,
            repo,
            state: "all", // ✨ 'open' -> 'all'로 변경하여 모든 상태의 이슈를 가져옴
            per_page: 10,
            page: parseInt(page),
        });

        // ✨ 가져온 이슈들 중, 상태가 'open'이거나 'completed' 사유로 닫힌 것만 필터링
        const filteredIssues = issues.filter(issue =>
            issue.state === 'open' || issue.state_reason === 'completed'
        );

        return NextResponse.json(filteredIssues);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error fetching issues" }, { status: 500 });
    }
}

// POST: 특정 레포에 새로운 이슈(Task/Note) 생성
// src/app/api/issues/route.ts 파일의 POST 함수

// src/app/api/issues/route.ts 파일의 POST 함수

export async function POST(request: Request) {
    const session: CustomSession | null = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const octokit = new Octokit({ auth: session.accessToken });
    const { title, body, repo, issueType } = await request.json(); // issueType: 'Task' 또는 'Note'

    if (!title || !repo || !issueType) {
        return NextResponse.json(
            { message: "Title, repo, and issueType are required" },
            { status: 400 }
        );
    }

    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        // 1. 레포지토리의 기존 라벨 목록을 가져옵니다.
        const { data: existingLabels } = await octokit.rest.issues.listLabelsForRepo({
            owner,
            repo,
        });
        const existingLabelNames = existingLabels.map(label => label.name);

        // 2. 필요한 라벨들이 없으면 새로 생성합니다. (Task 라벨 추가)
        const labelsToEnsure = [
            { name: repo, color: getRandomColor(), description: `Issues from ${repo}` },
            { name: 'Note', color: 'fbca04', description: 'Simple note' },
            { name: 'Task', color: '0075ca', description: 'A task that needs to be done' },
            // ⬇️ 상태 라벨들 추가
            { name: 'TODO', color: 'd876e3', description: 'Task to be done' },
            { name: 'DOING', color: '008672', description: 'Task in progress' },
            { name: 'DONE', color: '0e8a16', description: 'Task completed' },
            { name: 'PENDING', color: 'b33a3a', description: 'Task is pending' },
        ];

        for (const label of labelsToEnsure) {
            if (!existingLabelNames.includes(label.name)) {
                await octokit.rest.issues.createLabel({
                    owner,
                    repo,
                    name: label.name,
                    color: label.color,
                    description: label.description,
                });
            }
        }

        // 3. 이슈에 추가할 라벨 목록을 구성합니다.
        const labelsToAdd = [repo]; // 기본적으로 레포 이름 라벨 추가
        if (issueType === 'Task') {
            labelsToAdd.push('Task', 'TODO'); // Task 타입이면 'Task'와 'TODO' 라벨 모두 추가
        } else if (issueType === 'Note') {
            labelsToAdd.push('Note');
        }

        // 4. 최종적으로 라벨 목록과 함께 이슈를 생성합니다.
        const { data: newIssue } = await octokit.rest.issues.create({
            owner,
            repo,
            title,
            body,
            labels: labelsToAdd,
        });
        return NextResponse.json(newIssue, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error creating issue" },
            { status: 500 }
        );
    }
}