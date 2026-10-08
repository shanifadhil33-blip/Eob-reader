import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === "your_supabase_url" || !supabaseUrl.startsWith("http")) {
    return noStore(supabaseResponse);
  }

  const pendingCookies: {
    name: string;
    value: string;
    options?: Parameters<NextResponse["cookies"]["set"]>[2];
  }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          pendingCookies.splice(0, pendingCookies.length, ...cookiesToSet);
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Only place a document request contacts the auth server. The app layout
  // reads the cookie with getSession() and must not call getUser() again.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  supabaseResponse = NextResponse.next({ request });
  for (const cookie of pendingCookies) {
    supabaseResponse.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  const publicRoutes = ["/", "/demo", "/privacy", "/terms", "/hipaa", "/auth/callback", "/api/keep-alive"];
  const path = request.nextUrl.pathname;
  const isPublicRoute =
    publicRoutes.some((route) => path === route) || path.startsWith("/api/webhooks");

  function redirect(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    const response = NextResponse.redirect(url);
    for (const cookie of pendingCookies) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }
    return noStore(response);
  }

  if (!user && !isPublicRoute && !path.startsWith("/api/")) {
    return redirect("/");
  }

  if (user && path === "/") {
    return redirect("/dashboard");
  }

  return noStore(supabaseResponse);
}
