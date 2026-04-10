import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getClaims() validates JWT locally via cached JWKS — faster than getUser()
  // which makes a network request to the Auth server on every request.
  // Also refreshes expired tokens via the cookie setAll handler above.
  const { data, error } = await supabase.auth.getClaims();

  const isAuthenticated = !error && data?.claims;
  const userEmail = data?.claims?.email as string | undefined;

  const pathname = request.nextUrl.pathname;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/messages") ||
    pathname.startsWith("/leaderboard") ||
    pathname.startsWith("/feed") ||
    pathname.startsWith("/onboarding");

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/";

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Redirect non-admin users from admin routes
  if (isAdminRoute && isAuthenticated) {
    if (userEmail !== process.env.GAME_MASTER_EMAIL) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users from login page to dashboard
  if (isLoginPage && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
