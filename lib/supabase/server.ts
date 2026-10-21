import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseSchema } from "@/lib/supabase/public";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)?.trim();
  if (!url || !key) throw new Error("Supabase URL and publishable key are required.");

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    db: { schema: getSupabaseSchema() },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can read cookies but only Server Functions/Proxy can write them.
        }
      },
    },
  });
}
