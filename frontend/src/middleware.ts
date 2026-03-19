import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const user = request.cookies.get("user")?.value;
    const path = request.nextUrl.pathname;

    // Rotas admin precisam de auth + role admin
    if (path.startsWith("/admin")) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        try {
            const parsed = JSON.parse(user || "{}");
            if (parsed.role !== "admin") {
                return NextResponse.redirect(new URL("/", request.url));
            }
        } catch {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // Perfil precisa de auth
    if (path === "/profile" && !token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Logado não precisa ver login/register
    if ((path === "/login" || path === "/register") && token) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/profile", "/login", "/register"],
};