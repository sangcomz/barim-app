import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // JWT 토큰에서 refresh token 정보 가져오기
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    
    if (!token?.refreshToken) {
      return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
    }

    // GitHub API를 통해 토큰 리프레시
    const refreshResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_APP_CLIENT_ID!,
        client_secret: process.env.GITHUB_APP_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    });

    if (!refreshResponse.ok) {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    }

    const refreshData = await refreshResponse.json();

    // 새로운 토큰들을 JWT에 업데이트
    // 실제로는 NextAuth의 JWT 콜백에서 처리되어야 함
    
    return NextResponse.json({
      access_token: refreshData.access_token,
      refresh_token: refreshData.refresh_token,
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}