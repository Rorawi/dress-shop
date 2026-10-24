import { consumePublicActionLimit } from "@/lib/server/public-action-rate-limit";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

const reasons = new Set(["counterfeit", "unsafe", "misleading", "inappropriate", "other"]);
const fail = (message: string, status: number) => Response.json({ error: message }, { status });
const cleanText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 8_000) return fail("This report is too large to submit.", 413);

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return fail("Please review the report and try again.", 400);
  }
  if (!body || typeof body !== "object") return fail("Please review the report and try again.", 400);

  const subjectType = body.subjectType === "shop" ? "shop" : body.subjectType === "product" ? "product" : null;
  const shopId = cleanText(body.shopId, 64);
  const productId = cleanText(body.productId, 64);
  const reason = cleanText(body.reason, 40);
  const message = cleanText(body.message, 1200);
  if (!subjectType || !shopId || !reasons.has(reason) || (subjectType === "product" && !productId)) return fail("Please choose a report reason.", 400);

  let supabase: ReturnType<typeof createServiceRoleSupabaseClient>;
  try {
    supabase = createServiceRoleSupabaseClient();
  } catch {
    return fail("Reports are temporarily unavailable. Please try again shortly.", 503);
  }
  try {
    if (!await consumePublicActionLimit(supabase, request, "report", 5, 24 * 60 * 60)) {
      return fail("Too many reports were sent from this connection. Please try again later.", 429);
    }
  } catch {
    return fail("Reports are temporarily unavailable. Please try again shortly.", 503);
  }

  const { data: publicStatus, error: statusError } = await supabase.rpc("is_shop_public", { target_shop_id: shopId });
  if (statusError || publicStatus !== true) return fail("This shop is no longer available to report.", 404);

  if (subjectType === "product") {
    const { data: product, error } = await supabase.from("products").select("id,shop_id").eq("id", productId).maybeSingle();
    if (error || !product || product.shop_id !== shopId) return fail("This product could not be found.", 404);
  }

  const { error } = await supabase.from("reports").insert({
    shop_id: shopId,
    product_id: subjectType === "product" ? productId : null,
    subject_type: subjectType,
    reason,
    message: message || null,
    reporter_name: cleanText(body.reporterName, 120) || null,
    reporter_contact: cleanText(body.reporterContact, 100) || null,
  });
  if (error) return fail("We could not send your report. Please try again.", 503);
  return Response.json({ ok: true });
}
