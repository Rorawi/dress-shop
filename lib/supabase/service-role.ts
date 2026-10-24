import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseSchema } from "@/lib/supabase/public";

export function createServiceRoleSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) throw new Error("Supabase server configuration is incomplete.");

  return createClient(url, serviceKey, {
    db: { schema: getSupabaseSchema() },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
