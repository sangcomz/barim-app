import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

interface CustomSession {
    accessToken?: string;
}

// POST: 특정 이슈에 새로운 댓글 생성
export async function POST(
    request: Request,
    { params }: { params: { issue_number: string } }
) {
    const session: CustomSession | null = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const octokit = new Octokit({ auth: session.accessToken });
    const issue_number = parseInt(params.issue_number, 10);
    const { body } = await request.json();

    if (!body) {
        return NextResponse.json({ message: "Comment body is required" }, { status: 400 });
    }

    try {
        const { data: user } = await octokit.rest.users.getAuthenticated();
        const owner = user.login;

        const { data: newComment } = await octokit.rest.issues.createComment({
            owner,
            repo: "barim-data", // 저장소 이름
            issue_number,
            body,
        });

        return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { message: "Error creating comment" },
            { status: 500 }
        );
    }
}