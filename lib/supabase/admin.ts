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

export async function requireShopMember() {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    redirect("/seller/login?error=setup");
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/seller/login?error=unauthorized");
  if (user.app_metadata?.role === "admin") redirect("/admin");

  const { data: membership, error } = await supabase
    .from("shop_members")
    .select("shop_id,role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) redirect("/seller/login?error=setup");
  if (!membership) redirect("/seller/signup?error=shop");

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("id,name,slug,bio,location,phone,whatsapp_number,logo_url,banner_url,instagram_url,snapchat_url,tiktok_url,facebook_url,website_url,momo_number,momo_network,momo_account_name,accepts_cash_on_delivery,owner_name,owner_phone,verification_social_url,verification_document_path,verification_status,status,subscription_status,trial_ends_at,active_until,strike_count,created_at")
    .eq("id", membership.shop_id)
    .single();
  if (shopError || !shop) redirect("/seller/login?error=setup");
  return { supabase, user, membership, shop };
}
