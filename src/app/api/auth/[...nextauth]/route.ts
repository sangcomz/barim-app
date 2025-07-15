import NextAuth from "next-auth"
import {authOptions} from "@/lib/auth"

export async function GET(req: Request, ctx: never) {
    const url = new URL(req.url)
    const installationId = url.searchParams.get("installation_id")
    const setupAction = url.searchParams.get("setup_action")

    if (installationId != null && setupAction === "install") {
        return Response.redirect(`${process.env.NEXTAUTH_URL}/`, 302);
    }

    const handler = NextAuth(authOptions)
    return handler(req, ctx)
}

export {GET as POST}