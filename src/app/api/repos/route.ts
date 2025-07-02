import { Octokit } from "@octokit/rest";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { CustomSession } from "@/types/api";

export async function GET() {
    const session: CustomSession | null = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const octokit = new Octokit({ auth: session.accessToken });

    try {
        const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
            type: "owner", // 내가 소유한 레포지토리만
            sort: "updated",
            per_page: 100, // 최대 100개까지
        });
        return NextResponse.json(repos);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error fetching repositories" }, { status: 500 });
    }
}