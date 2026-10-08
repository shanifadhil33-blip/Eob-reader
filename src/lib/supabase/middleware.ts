import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const USER_ID_HEADER = "x-eob-user-id";
const USER_EMAIL_HEADER = "x-eob-user-email";
const USER_NAME_HEADER = "x-eob-user-name";

function safeHeader(value: string | undefined): string {
  if (!value) return "";
  return value.replace(/[^\x20-\x7E]/g, "").slice(0, 180);
}

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

  // One auth read per document. The app layout must not call getUser() again:
  // that second call refreshes a single-use token the middleware just rotated,
  // then throws while writing cookies from a Server Component. The browser
  // shows "This page couldn't load"; a reload works because these cookies landed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  request.headers.delete(USER_ID_HEADER);
  request.headers.delete(USER_EMAIL_HEADER);
  request.headers.delete(USER_NAME_HEADER);
  if (user) {
    const metadata = user.user_metadata;
    const name =
      typeof metadata?.full_name === "string"
        ? metadata.full_name
        : typeof metadata?.name === "string"
          ? metadata.name
          : "";
    request.headers.set(USER_ID_HEADER, user.id);
    request.headers.set(USER_EMAIL_HEADER, safeHeader(user.email));
    request.headers.set(USER_NAME_HEADER, safeHeader(name));
  }

  supabaseResponse = NextResponse.next({ request });
  for (const cookie of pendingCookies) {
    supabaseResponse.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  const publicRoutes = ["/", "/demo", "/privacy", "/terms", "/hipaa", "/auth/callback", "/api/keep-alive"];
  const path = request.nextUrl.pathname;
  const isPublicRoute =
    publicRoutes.some((route) => path === route) || path.startsWith("/api/webhooks");

  if (!user && !isPublicRoute && !path.startsWith("/api/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const response = NextResponse.redirect(url);
    for (const cookie of pendingCookies) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }
    return noStore(response);
  }

  if (user && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    const response = NextResponse.redirect(url);
    for (const cookie of pendingCookies) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }
    return noStore(response);
  }

  return noStore(supabaseResponse);
}
