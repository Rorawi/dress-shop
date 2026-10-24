import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

export async function sendShopOwnerEmail(shopId: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return;

  try {
    const service = createServiceRoleSupabaseClient();
    const { data: membership } = await service.from("shop_members").select("user_id").eq("shop_id", shopId).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (!membership) return;
    const { data } = await service.auth.admin.getUserById(membership.user_id);
    const email = data.user?.email;
    if (!email) return;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({ from, to: [email], subject: subject.slice(0, 180), text: text.slice(0, 8_000) }),
    });
    if (!response.ok) console.warn("Seller notification could not be sent", { shopId, status: response.status });
  } catch (error) {
    console.warn("Seller notification could not be sent", { shopId, message: error instanceof Error ? error.message : "unknown error" });
  }
}
