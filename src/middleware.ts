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

    // 1. SKIP LÓGICO PARA ARCHIVOS ESTÁTICOS Y NEXT.JS INTERNAL
    // Si la ruta tiene un punto (ej: .json, .js, .png) o empieza con carpetas de sistema, NO ejecutar middleware.
    if (
        request.nextUrl.pathname.includes('.') ||
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/api')
    ) {
        return supabaseResponse;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const isPublicPath = request.nextUrl.pathname.startsWith("/login") || 
                         request.nextUrl.pathname.startsWith("/register") ||
                         request.nextUrl.pathname === "/";
    const isEsperaPath = request.nextUrl.pathname.startsWith("/espera");

    // 1. Unauthenticated users: redirect to login if not on a public path
    if (!user && !isPublicPath && !isEsperaPath) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 2. Authenticated users logic
    if (user) {
        // Fetch profile to check role and state
        const { data: profile, error: profileError } = await supabase
            .from("perfiles")
            .select("rol, estado")
            .eq("id", user.id)
            .single();

        console.log(`[MIDDLEWARE] User: ${user.email}, Role: ${profile?.rol}, Status: ${profile?.estado}, Path: ${request.nextUrl.pathname}`);

        // If no profile exists (unusual), allow them to proceed to "/" or "/login" to be re-captured or rescued
        if (profileError || !profile) {
            console.warn(`[MIDDLEWARE] Profile not found for ${user.id}`);
            if (!isPublicPath) {
                return NextResponse.redirect(new URL("/login", request.url));
            }
            return supabaseResponse;
        }

        // A. Handle Pending Status
        if (profile.estado === "pendiente") {
            if (!isEsperaPath) {
                console.log("[MIDDLEWARE] Pending user - Redirecting to /espera");
                return NextResponse.redirect(new URL("/espera", request.url));
            }
            return supabaseResponse; // Stay on /espera
        }

        // B. Handle Approved Users (already on /espera or public pages)
        if (profile.estado === "aprobado") {
            // Redirect away from /espera if already approved
            if (isEsperaPath || isPublicPath) {
                let target = "/dashboard/padre";
                if (profile.rol === "directora") target = "/dashboard/directora";
                if (profile.rol === "maestro") target = "/maestro";
                
                console.log(`[MIDDLEWARE] Approved user on ${request.nextUrl.pathname} - Redirecting to ${target}`);
                return NextResponse.redirect(new URL(target, request.url));
            }

            // C. Cross-role protection and generic /dashboard redirect
            const isDirectoraPath = request.nextUrl.pathname.startsWith("/dashboard/directora");
            const isPadrePath = request.nextUrl.pathname.startsWith("/dashboard/padre");
            const isMaestroPath = request.nextUrl.pathname.startsWith("/maestro");
            const isGenericDashboard = request.nextUrl.pathname === "/dashboard" || request.nextUrl.pathname === "/dashboard/";
            
            // Legacy paths handling
            const isLegacyDirectora = request.nextUrl.pathname.startsWith("/directora");

            if (profile.rol === "directora") {
                if (isPadrePath || isMaestroPath || isGenericDashboard || isLegacyDirectora) {
                    return NextResponse.redirect(new URL("/dashboard/directora", request.url));
                }
            } else if (profile.rol === "padre") {
                if (isDirectoraPath || isMaestroPath || isGenericDashboard || isLegacyDirectora) {
                    return NextResponse.redirect(new URL("/dashboard/padre", request.url));
                }
            } else if (profile.rol === "maestro") {
                if (isDirectoraPath || isPadrePath || isGenericDashboard || isLegacyDirectora) {
                    return NextResponse.redirect(new URL("/maestro", request.url));
                }
            }
        }
    }

    // Force fresh data by setting no-cache headers in the response
    supabaseResponse.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    
    return supabaseResponse;
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.[\\w]+$).*)",
    ],
};
