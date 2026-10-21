import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireShopAdmin() {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirect("/admin/login?error=setup");
  }

  let user;
  try {
    const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
    user = authenticatedUser;
  } catch {
    redirect("/admin/login?error=setup");
  }
  if (!user || user.app_metadata?.role !== "admin") redirect("/admin/login?error=unauthorized");
  return { supabase, user };
}
