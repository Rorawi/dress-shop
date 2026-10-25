"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string };

const AUTH_TIMEOUT_MS = 6_000;

function withAuthTimeout<T>(promiseLike: PromiseLike<T>): Promise<T> {
  return Promise.race([
    Promise.resolve(promiseLike),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Auth request timed out")), AUTH_TIMEOUT_MS)
    ),
  ]);
}

export async function loginAdmin(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your admin email and password." };

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return { error: "Supabase is not configured yet. Check the project URL and publishable key." };
  }

  let user;
  try {
    const { data, error } = await withAuthTimeout(
      supabase.auth.signInWithPassword({ email, password })
    );
    if (error || !data.user) return { error: "Those sign-in details could not be verified." };
    user = data.user;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("timed out")) return { error: "Could not reach Supabase — connection timed out. Try again shortly." };
    return { error: "Could not reach Supabase. Check your project URL, key, and connection." };
  }

  if (user.app_metadata?.role !== "admin") {
    try { await supabase.auth.signOut(); } catch { /* session will be rejected */ }
    return { error: "This account is not enabled for Charwin store management." };
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } finally {
    redirect("/admin/login");
  }
}
