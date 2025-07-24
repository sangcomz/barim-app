import GithubProvider from "next-auth/providers/github"
import { NextAuthOptions, JWT } from "next-auth"

interface TokenData {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: string;
  user?: unknown;
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    // GitHub OAuth App은 refresh token을 제공하지 않음
    // refresh token이 없으면 재로그인 필요
    if (!token.refreshToken) {
      console.log('No refresh token available for OAuth App');
      return {
        ...token,
        error: 'RefreshAccessTokenError',
      };
    }

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GITHUB_APP_CLIENT_ID!,
        client_secret: process.env.GITHUB_APP_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000 + (refreshedTokens.expires_in || 28800)), // 8시간
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_APP_CLIENT_ID!,
            clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
            authorization: {
              params: {
                scope: "read:user user:email repo"
              }
            }
        }),
    ],
    secret: process.env.AUTH_SECRET,
    callbacks: {
        async jwt({ token, account, user }): Promise<JWT> {
            // 첫 로그인시
            if (account && user) {
                console.log('GitHub OAuth account info:', {
                    access_token: account.access_token ? `present (${account.access_token.substring(0, 8)}...)` : 'missing',
                    refresh_token: account.refresh_token ? `present (${account.refresh_token.substring(0, 8)}...)` : 'missing',
                    expires_at: account.expires_at,
                    expires_in: account.expires_in,
                    token_type: account.token_type
                });
                
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    expiresAt: account.expires_at || Math.floor(Date.now() / 1000 + (account.expires_in || 3600 * 24 * 365)), // OAuth App은 1년
                    user,
                }
            }

            // OAuth App 토큰은 만료되지 않으므로 바로 반환
            if (!token.expiresAt || Date.now() < (token.expiresAt as number) * 1000) {
                return token
            }

            // 토큰이 만료된 경우 리프레시 시도 (GitHub App인 경우에만)
            if (token.refreshToken) {
                return refreshAccessToken(token)
            }

            // OAuth App인 경우 토큰이 만료되면 재로그인 필요
            console.log('Token expired and no refresh token available');
            return {
                ...token,
                error: 'RefreshAccessTokenError',
            }
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string
            session.error = token.error as string
            
            if (token.error) {
                // 토큰 에러가 있으면 재로그인 필요
                session.error = token.error
            }
            
            return session
        },
    },
}
