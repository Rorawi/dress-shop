import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function consumePublicActionLimit(
  supabase: SupabaseClient<any, any, any>,
  request: Request,
  action: "order" | "report",
  limit: number,
  windowSeconds: number,
) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "charwin-public-actions";
  const fingerprint = createHash("sha256").update(`${secret}:${ip}`).digest("hex");
  const { data, error } = await supabase.rpc("consume_public_action_rate_limit", {
    p_fingerprint: fingerprint,
    p_action: action,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw error;
  return data === true;
}
