import { createClient } from "@supabase/supabase-js";

const PLACEHOLDER_VALUE = /(?:your[-_ ]?(?:project|supabase|anon|publishable|key)|replace[-_ ]?me|example|placeholder|changeme|<[^>]+>)/i;

/** True only when the public settings can form a usable Supabase client. */
export function hasPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !publishableKey || PLACEHOLDER_VALUE.test(url) || PLACEHOLDER_VALUE.test(publishableKey)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/** Create a least-privileged Supabase client for public catalog reads. */
export function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!url || !publishableKey || !hasPublicSupabaseConfig()) {
    throw new Error(
      "Set a valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY before using the catalog client.",
    );
  }

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
