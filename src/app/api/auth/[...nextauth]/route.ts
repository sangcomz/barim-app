import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

export const authOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
            authorization: { // ⬇️ 이 부분을 추가합니다.
                params: {
                    scope: "repo user", // 'repo'와 'user' 권한을 요청합니다.
                },
            },
        }),
    ],
    secret: process.env.AUTH_SECRET,
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
            }
            return token
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            return session
        },
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }