import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

function supabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const key = supabasePublishableKey();
  if (!supabaseUrl || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  if (getUserError?.code === "refresh_token_not_found") {
    await supabase.auth.signOut();
  }

  const path = request.nextUrl.pathname;
  if (!user && (path.startsWith("/admin") || path.startsWith("/courses"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}
