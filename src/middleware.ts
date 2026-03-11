import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh session if expired
    const { data: { user }, error } = await supabase.auth.getUser();

    if (user) {
        console.log(`[MIDDLEWARE] User authenticated: ${user.id} at ${request.nextUrl.pathname}`);
    }

    // Prevent intercepting Next.js internal routes to avoid breaking hydration or actions
    if (request.nextUrl.pathname.startsWith("/_next") || request.nextUrl.pathname.startsWith("/api")) {
        return supabaseResponse;
    }

    const isPublicPath = request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/register");

    // 3. Basic Auth Protection
    if (!user && !isPublicPath) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect authenticated users away from public pages
    if (user && isPublicPath) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
