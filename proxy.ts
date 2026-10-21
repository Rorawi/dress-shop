import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseSchema, hasPublicSupabaseConfig } from "@/lib/supabase/public";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasPublicSupabaseConfig()) return response;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!.trim();
  const supabase = createServerClient(url, key, {
    db: { schema: getSupabaseSchema() },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Let the route render its setup/error state if Supabase is temporarily unavailable.
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
