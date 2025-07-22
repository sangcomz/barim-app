import GithubProvider from "next-auth/providers/github"
import { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_APP_CLIENT_ID!,
            clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!
        }),
    ],
    secret: process.env.AUTH_SECRET,
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
                token.refreshToken = account.refresh_token
                token.expiresAt = account.expires_at
            }
            
            // 토큰이 만료되었는지 확인
            if (Date.now() < (token.expiresAt as number) * 1000) {
                return token
            }

            // GitHub는 refresh token을 제공하지 않으므로 토큰 만료시 재로그인 필요
            return token
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string
            session.error = token.error as string
            return session
        },
    },
}
