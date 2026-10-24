"use server";

import { revalidatePath } from "next/cache";
import { requireShopAdmin } from "@/lib/supabase/admin";
import { sendShopOwnerEmail } from "@/lib/server/seller-email";

const read = (formData: FormData, key: string, max = 500) => String(formData.get(key) ?? "").trim().slice(0, max);

export async function updateShopVerification(formData: FormData) {
  const { supabase, user } = await requireShopAdmin();
  const shopId = read(formData, "shop_id", 40);
  const decision = read(formData, "decision", 20);
  if (!shopId || !["approve", "reject"].includes(decision)) throw new Error("Choose a valid shop verification action.");
  const { data: shop, error: readError } = await supabase.from("shops").select("id,name,verification_status,status,subscription_status,trial_ends_at").eq("id", shopId).single();
  if (readError || !shop) throw new Error("The seller shop could not be found.");
  const approved = decision === "approve";
  const currentTrial = shop.trial_ends_at ? new Date(shop.trial_ends_at).getTime() : 0;
  const trialEnds = currentTrial > Date.now() ? shop.trial_ends_at : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("shops").update({
    verification_status: approved ? "approved" : "rejected",
    status: approved ? "active" : "pending",
    ...(approved && shop.subscription_status === "trial" ? { trial_ends_at: trialEnds } : {}),
  }).eq("id", shopId);
  if (error) throw new Error(error.message);
  await supabase.from("moderation_log").insert({ shop_id: shopId, actor_user_id: user.id, action: approved ? "shop_verified" : "shop_verification_rejected", reason: read(formData, "reason") || null, previous_values: { verification_status: shop.verification_status, status: shop.status }, new_values: { verification_status: approved ? "approved" : "rejected", status: approved ? "active" : "pending" } });
  await sendShopOwnerEmail(shopId, approved ? "Your Charwin Stores shop is approved" : "Update about your Charwin Stores shop", approved
    ? `Hi ${shop.name},\n\nYour shop has been approved. You can sign in to the seller studio and prepare listings for review.`
    : `Hi ${shop.name},\n\nYour shop verification was not approved yet. ${read(formData, "reason") || "Please contact the marketplace team for the next steps."}`);
  revalidatePath("/admin/marketplace/shops");
  revalidatePath("/seller");
}

export async function updateShopAccess(formData: FormData) {
  const { supabase, user } = await requireShopAdmin();
  const shopId = read(formData, "shop_id", 40);
  const status = read(formData, "status", 20);
  if (!shopId || !["active", "suspended", "banned"].includes(status)) throw new Error("Choose a valid shop access status.");
  const { data: shop, error: readError } = await supabase.from("shops").select("id,name,status,verification_status").eq("id", shopId).single();
  if (readError || !shop) throw new Error("The seller shop could not be found.");
  if (status === "active" && shop.verification_status !== "approved") throw new Error("Approve shop verification before activating this shop.");
  const { error } = await supabase.from("shops").update({ status }).eq("id", shopId);
  if (error) throw new Error(error.message);
  await supabase.from("moderation_log").insert({ shop_id: shopId, actor_user_id: user.id, action: `shop_${status}`, reason: read(formData, "reason") || null, previous_values: { status: shop.status }, new_values: { status } });
  if (status === "suspended" || status === "banned") await sendShopOwnerEmail(shopId, `Marketplace access ${status}`, `Your shop access is ${status}. ${read(formData, "reason") || "Contact the marketplace team if you need more information."}`);
  revalidatePath("/admin/marketplace/shops");
}

export async function setShopTrusted(formData: FormData) {
  const { supabase, user } = await requireShopAdmin();
  const shopId = read(formData, "shop_id", 40);
  const trusted = formData.get("is_trusted") === "true";
  if (!shopId) throw new Error("Choose a shop to update.");
  const { data: shop, error: readError } = await supabase.from("shops").select("id,name,is_trusted").eq("id", shopId).single();
  if (readError || !shop) throw new Error("The seller shop could not be found.");
  const { error } = await supabase.from("shops").update({ is_trusted: trusted }).eq("id", shopId);
  if (error) throw new Error(error.message);
  await supabase.from("moderation_log").insert({ shop_id: shopId, actor_user_id: user.id, action: trusted ? "shop_marked_trusted" : "shop_trust_removed", previous_values: { is_trusted: shop.is_trusted }, new_values: { is_trusted: trusted } });
  revalidatePath("/admin/marketplace/shops");
}

export async function reviewMarketplaceProduct(formData: FormData) {
  const { supabase, user } = await requireShopAdmin();
  const productId = read(formData, "product_id", 40);
  const decision = read(formData, "decision", 20);
  const reasonOptions: Record<string, string> = {
    prohibited_item: "Prohibited item",
    counterfeit_or_misrepresented: "Counterfeit or misrepresented brand",
    unclear_photos: "Photos are missing or unclear",
    inaccurate_listing: "Description or category is inaccurate",
    other: "Other policy concern",
  };
  const reasonCode = read(formData, "reason_code", 60);
  const reasonNote = read(formData, "reason_note");
  const reason = [reasonOptions[reasonCode], reasonNote].filter(Boolean).join(": ");
  if (!productId || !["approve", "reject"].includes(decision)) throw new Error("Choose a valid listing decision.");
  if (decision === "reject" && !reasonOptions[reasonCode]) throw new Error("Choose a rejection reason so the seller knows what to fix.");
  const { data: product, error: readError } = await supabase.from("products").select("id,shop_id,name,moderation_status,is_published").eq("id", productId).single();
  if (readError || !product) throw new Error("The product could not be found.");
  const approved = decision === "approve";
  const { error } = await supabase.from("products").update({ moderation_status: approved ? "approved" : "rejected", is_published: approved, is_hidden: false, admin_hidden: false, admin_hidden_reason: null, admin_hidden_at: null, rejection_reason: approved ? null : reason, reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("id", productId);
  if (error) throw new Error(error.message);
  await supabase.from("moderation_log").insert({ shop_id: product.shop_id, product_id: product.id, actor_user_id: user.id, action: approved ? "product_approved" : "product_rejected", reason: reason || null, previous_values: { moderation_status: product.moderation_status, is_published: product.is_published }, new_values: { moderation_status: approved ? "approved" : "rejected", is_published: approved } });
  await sendShopOwnerEmail(product.shop_id, approved ? `Listing approved: ${product.name}` : `Listing needs changes: ${product.name}`, approved
    ? `Your product “${product.name}” was approved and can appear in your public shop when your shop is active.`
    : `Your product “${product.name}” was not approved. Reason: ${reason}. Update the listing in your seller studio and submit it again.`);
  revalidatePath("/admin/marketplace/review");
  revalidatePath("/admin/marketplace/shops");
  revalidatePath("/seller/products");
}

export async function issueShopStrike(formData: FormData) {
  const { supabase, user } = await requireShopAdmin();
  const shopId = read(formData, "shop_id", 40);
  const action = read(formData, "action", 20);
  const reason = read(formData, "reason");
  const note = read(formData, "note");
  if (!shopId || !["warning", "suspension", "ban"].includes(action) || !reason) throw new Error("Choose an action and provide a reason.");
  const { data: shop, error: readError } = await supabase.from("shops").select("id,name,status,strike_count").eq("id", shopId).single();
  if (readError || !shop) throw new Error("The seller shop could not be found.");
  const { error: strikeError } = await supabase.from("strikes").insert({ shop_id: shopId, action, reason, note: note || null, issued_by: user.id });
  if (strikeError) throw new Error(strikeError.message);
  const nextStatus = action === "ban" ? "banned" : action === "suspension" ? "suspended" : shop.status;
  const { error } = await supabase.from("shops").update({ strike_count: Number(shop.strike_count) + 1, status: nextStatus }).eq("id", shopId);
  if (error) throw new Error(error.message);
  await supabase.from("moderation_log").insert({ shop_id: shopId, actor_user_id: user.id, action: `strike_${action}`, reason, note, previous_values: { status: shop.status, strike_count: shop.strike_count }, new_values: { status: nextStatus, strike_count: Number(shop.strike_count) + 1 } });
  await sendShopOwnerEmail(shopId, `Marketplace notice for ${shop.name}`, `A ${action} has been recorded for your shop. Reason: ${reason}${note ? `\n\nNote: ${note}` : ""}`);
  revalidatePath("/admin/marketplace/shops");
}

export async function saveShopSubscription(formData: FormData) {
  const { supabase, user } = await requireShopAdmin();
  const shopId = read(formData, "shop_id", 40);
  const status = read(formData, "subscription_status", 20);
  const endDate = read(formData, "active_until", 20);
  if (!shopId || !["trial", "active", "expired"].includes(status)) throw new Error("Choose a valid subscription status.");
  if (status !== "expired" && !endDate) throw new Error("Set a subscription end date.");
  const { data: shop, error: readError } = await supabase.from("shops").select("id,name,subscription_status,trial_ends_at,active_until").eq("id", shopId).single();
  if (readError || !shop) throw new Error("The seller shop could not be found.");
  const iso = endDate ? new Date(`${endDate}T23:59:59.000Z`).toISOString() : null;
  const update = status === "trial"
    ? { subscription_status: "trial", trial_ends_at: iso }
    : status === "active"
      ? { subscription_status: "active", active_until: iso }
      : { subscription_status: "expired", active_until: new Date().toISOString() };
  const { error } = await supabase.from("shops").update(update).eq("id", shopId);
  if (error) throw new Error(error.message);
  await supabase.from("moderation_log").insert({ shop_id: shopId, actor_user_id: user.id, action: `subscription_${status}`, reason: read(formData, "reason") || null, previous_values: { subscription_status: shop.subscription_status, trial_ends_at: shop.trial_ends_at, active_until: shop.active_until }, new_values: update });
  revalidatePath("/admin/marketplace/shops");
}

export async function reviewMarketplaceReport(formData: FormData) {
  const { supabase, user } = await requireShopAdmin();
  const reportId = read(formData, "report_id", 40);
  const decision = read(formData, "decision", 20);
  const reason = read(formData, "reason");
  if (!reportId || !["reviewed", "dismiss", "hide"].includes(decision)) throw new Error("Choose a valid report action.");
  const { data: report, error: readError } = await supabase.from("reports").select("id,shop_id,product_id,status,products(name)").eq("id", reportId).single();
  if (readError || !report) throw new Error("The report could not be found.");
  if (decision === "hide" && report.product_id) {
    const { error } = await supabase.from("products").update({ admin_hidden: true, admin_hidden_reason: reason || "Hidden while a customer report is reviewed", admin_hidden_at: new Date().toISOString(), is_published: false }).eq("id", report.product_id);
    if (error) throw new Error(error.message);
  }
  const status = decision === "dismiss" ? "dismissed" : decision === "hide" ? "actioned" : "reviewed";
  const { error } = await supabase.from("reports").update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", reportId);
  if (error) throw new Error(error.message);
  await supabase.from("moderation_log").insert({ shop_id: report.shop_id, product_id: report.product_id, actor_user_id: user.id, action: `report_${status}`, reason: reason || null, previous_values: { status: report.status }, new_values: { status } });
  if (decision === "hide") {
    const productName = Array.isArray(report.products) ? report.products[0]?.name : (report.products as { name?: string } | null)?.name;
    await sendShopOwnerEmail(report.shop_id, "A product from your shop was hidden for review", `A customer report was received for ${productName || "one of your listings"}. The listing has been temporarily hidden while the marketplace team reviews it.${reason ? `\n\nNote: ${reason}` : ""}`);
  }
  revalidatePath("/admin/marketplace/reports");
}

export async function saveMarketplacePolicy(formData: FormData) {
  const { supabase } = await requireShopAdmin();
  const autoApproval = read(formData, "auto_approval_mode", 40);
  const graceDays = Number(read(formData, "subscription_grace_days", 3));
  const prohibitedItems = read(formData, "prohibited_items", 8_000).split(/\r?\n/).map((item) => item.trim()).filter(Boolean).slice(0, 80);
  const noticeDays = [...new Set(read(formData, "expiry_notice_days", 100).split(",").map((day) => Number(day.trim())).filter((day) => Number.isInteger(day) && day >= 0 && day <= 90))].sort((a, b) => b - a);
  if (!["suggestions_only", "trusted_shops_low_risk"].includes(autoApproval) || !Number.isInteger(graceDays) || graceDays < 0 || graceDays > 90 || !noticeDays.length || !prohibitedItems.length) throw new Error("Enter at least one prohibited item and expiry reminder day; grace days must be 0–90.");
  const { error } = await supabase.from("site_settings").update({ auto_approval_mode: autoApproval, subscription_grace_days: graceDays, prohibited_items: prohibitedItems, expiry_notice_days: noticeDays }).eq("id", true);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/marketplace/settings");
}
