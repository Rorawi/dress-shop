import { Resend } from "resend";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";
export const maxDuration = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]!));

async function sendReminders(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !from) return Response.json({ error: "Configure RESEND_API_KEY and RESEND_FROM_EMAIL to send subscription reminders." }, { status: 503 });

  let supabase;
  try { supabase = createServiceRoleSupabaseClient(); }
  catch { return Response.json({ error: "Supabase server configuration is incomplete." }, { status: 503 }); }
  const [{ data: settings }, { data: shops, error }] = await Promise.all([
    supabase.from("site_settings").select("expiry_notice_days").eq("id", true).maybeSingle(),
    supabase.from("shops").select("id,name,subscription_status,trial_ends_at,active_until").eq("status", "active").eq("verification_status", "approved").in("subscription_status", ["trial", "active"]),
  ]);
  if (error) return Response.json({ error: "Could not load active seller subscriptions." }, { status: 502 });
  const reminderDays = Array.isArray(settings?.expiry_notice_days) ? settings.expiry_notice_days.map(Number) : [14, 7, 1, 0];
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const resend = new Resend(apiKey);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://charwinstores.com";
  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const shop of shops ?? []) {
    const expiration = shop.subscription_status === "trial" ? shop.trial_ends_at : shop.active_until;
    if (!expiration) { skipped += 1; continue; }
    const endDate = new Date(expiration);
    const endUtc = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
    const daysRemaining = Math.ceil((endUtc - todayUtc) / DAY_MS);
    if (!reminderDays.includes(daysRemaining)) { skipped += 1; continue; }
    const cycleEnd = endDate.toISOString().slice(0, 10);
    const { error: claimError } = await supabase.from("shop_expiry_notices").insert({ shop_id: shop.id, cycle_end: cycleEnd, notice_day: daysRemaining });
    if (claimError?.code === "23505") { skipped += 1; continue; }
    if (claimError) { failures.push(shop.id); continue; }
    const { data: owner } = await supabase.from("shop_members").select("user_id").eq("shop_id", shop.id).eq("role", "owner").order("created_at", { ascending: true }).limit(1).maybeSingle();
    const { data: userData } = owner?.user_id ? await supabase.auth.admin.getUserById(owner.user_id) : { data: { user: null } };
    const email = userData.user?.email;
    if (!email) {
      await supabase.from("shop_expiry_notices").delete().eq("shop_id", shop.id).eq("cycle_end", cycleEnd).eq("notice_day", daysRemaining);
      skipped += 1;
      continue;
    }
    const shopName = escapeHtml(shop.name);
    const timing = daysRemaining === 0 ? "expires today" : `expires in ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"}`;
    try {
      const { error: sendError } = await resend.emails.send({
        from,
        to: email,
        subject: `${shop.name} subscription ${timing}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#17141c"><div style="background:#35115f;padding:28px;color:#fff"><strong>CHARWIN STORES</strong></div><div style="padding:28px"><h1 style="font-size:24px">${shopName} subscription ${timing}</h1><p style="line-height:1.7">Your ${shop.subscription_status} access is scheduled to end on ${new Intl.DateTimeFormat("en-GH", { dateStyle: "long", timeZone: "UTC" }).format(endDate)}. Please contact the marketplace team to arrange renewal and keep your shop active.</p><p><a href="${baseUrl}/seller/settings" style="display:inline-block;background:#55239a;color:#fff;padding:12px 18px;border-radius:24px;text-decoration:none">Open seller settings</a></p><p style="font-size:12px;color:#817888">A grace period may apply according to the marketplace subscription policy.</p></div></div>`,
      });
      if (sendError) throw new Error(sendError.message);
      await supabase.from("shop_expiry_notices").update({ sent_at: new Date().toISOString() }).eq("shop_id", shop.id).eq("cycle_end", cycleEnd).eq("notice_day", daysRemaining);
      sent += 1;
    } catch {
      await supabase.from("shop_expiry_notices").delete().eq("shop_id", shop.id).eq("cycle_end", cycleEnd).eq("notice_day", daysRemaining);
      failures.push(shop.id);
    }
  }
  return Response.json({ sent, skipped, failed: failures.length });
}

export async function GET(request: Request) { return sendReminders(request); }
export async function POST(request: Request) { return sendReminders(request); }
