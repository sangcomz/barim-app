import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { API_ENDPOINTS, createAuthHeaders } from "@/lib/api-config";

// GET: Barim API를 통해 특정 레포지토리 정보 가져오기
export async function GET(request: Request, { params }: { params: Promise<{ repository_name: string }> }) {
    const auth = await requireAuth(request);
    if (!auth) {
        return NextResponse.json({
            message: "Not authenticated. Please provide a valid session or Authorization header."
        }, { status: 401 });
    }

    const { repository_name } = await params;
    if (!repository_name) {
        return NextResponse.json({ message: "Repository name is required." }, { status: 400 });
    }

    try {
        const response = await fetch(API_ENDPOINTS.repo(repository_name), {
            method: 'GET',
            headers: createAuthHeaders(auth.token),
        });

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ message: `Repository '${repository_name}' not found.` }, { status: 404 });
            }
            throw new Error(`Barim API error: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching repository from Barim API:", error);
        return NextResponse.json({ message: "Error fetching repository" }, { status: 500 });
    }
}