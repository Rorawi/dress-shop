import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { consumePublicActionLimit } from "@/lib/server/public-action-rate-limit";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/service-role";

type SubmittedItem = { productId: string; variantId: string; quantity: number };
type OrderPayload = {
  shopId: string;
  items: SubmittedItem[];
  customerName?: string;
  customerPhone?: string;
  deliveryLocation?: string;
  paymentPreference: "mobile_money" | "cash_on_delivery";
  idempotencyKey: string;
};

const cleanText = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const fail = (message: string, status: number) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 20_000) return fail("This order is too large to submit.", 413);

  let payload: OrderPayload;
  try {
    payload = await request.json() as OrderPayload;
  } catch {
    return fail("Please review your order and try again.", 400);
  }

  if (!payload || typeof payload.shopId !== "string" || !Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 30) {
    return fail("Please review your order and try again.", 400);
  }
  const idempotencyKey = cleanText(payload.idempotencyKey, 64);
  if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) return fail("Please refresh and submit your order again.", 400);

  const submitted = payload.items.map((item) => ({
    productId: cleanText(item?.productId, 64),
    variantId: cleanText(item?.variantId, 64),
    quantity: Number(item?.quantity),
  }));
  if (submitted.some((item) => !item.productId || !item.variantId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
    return fail("One or more quantities are invalid. Please refresh your bag.", 400);
  }
  if (new Set(submitted.map((item) => item.variantId)).size !== submitted.length) return fail("Please remove duplicate items and try again.", 400);

  let supabase: ReturnType<typeof createServiceRoleSupabaseClient>;
  try {
    supabase = createServiceRoleSupabaseClient();
  } catch {
    return fail("Ordering is temporarily unavailable. Please message the shop directly.", 503);
  }

  try {
    const allowed = await consumePublicActionLimit(supabase, request, "order", 12, 60 * 60);
    if (!allowed) return fail("Too many order attempts. Please wait a little before trying again.", 429);
  } catch {
    return fail("Ordering is temporarily unavailable. Please try again shortly.", 503);
  }

  const { data: shop, error: shopError } = await supabase.from("shops")
    .select("id,name,slug,whatsapp_number,accepts_cash_on_delivery,momo_number,momo_network,momo_account_name")
    .eq("id", payload.shopId)
    .maybeSingle();
  if (shopError || !shop) return fail("This shop is no longer available.", 404);

  const { data: publicStatus, error: statusError } = await supabase.rpc("is_shop_public", { target_shop_id: shop.id });
  if (statusError || publicStatus !== true) return fail("This shop is temporarily unavailable.", 409);
  const whatsappNumber = normalizeWhatsAppNumber(shop.whatsapp_number);
  if (!isValidWhatsAppNumber(whatsappNumber)) return fail("This shop cannot receive WhatsApp orders right now.", 409);

  const momoNumber = normalizeWhatsAppNumber(shop.momo_number);
  const mobileMoneyAvailable = isValidWhatsAppNumber(momoNumber) && Boolean(shop.momo_network && shop.momo_account_name);
  const cashAvailable = Boolean(shop.accepts_cash_on_delivery);
  if (payload.paymentPreference === "mobile_money" && !mobileMoneyAvailable) return fail("This shop is not accepting mobile money right now.", 409);
  if (payload.paymentPreference === "cash_on_delivery" && !cashAvailable) return fail("This shop is not accepting cash on delivery right now.", 409);
  if (payload.paymentPreference !== "mobile_money" && payload.paymentPreference !== "cash_on_delivery") return fail("Choose an available payment preference.", 400);

  const productIds = [...new Set(submitted.map((item) => item.productId))];
  const variantIds = submitted.map((item) => item.variantId);
  const [{ data: products, error: productsError }, { data: variants, error: variantsError }] = await Promise.all([
    supabase.from("products").select("id,shop_id,name,slug,price,moderation_status,is_published,is_hidden,admin_hidden").in("id", productIds).eq("shop_id", shop.id),
    supabase.from("product_variants").select("id,product_id,size,color,stock").in("id", variantIds),
  ]);
  if (productsError || variantsError) return fail("We could not verify your bag. Please try again.", 503);

  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const variantById = new Map((variants ?? []).map((variant) => [variant.id, variant]));
  const orderItems: Array<Record<string, string | number | null>> = [];
  const messageItems: Array<{ name: string; slug: string; size: string; color: string; quantity: number; unitPrice: number }> = [];
  let total = 0;
  for (const item of submitted) {
    const product = productById.get(item.productId);
    const variant = variantById.get(item.variantId);
    if (!product || !variant || variant.product_id !== product.id || product.moderation_status !== "approved" || !product.is_published || product.is_hidden || product.admin_hidden) {
      return fail("A product in your bag is no longer available. Refresh the page and try again.", 409);
    }
    if (Number(variant.stock) < item.quantity) return fail(`${product.name} does not have that many in stock. Please update your quantity.`, 409);
    const unitPrice = Number(product.price);
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    total += lineTotal;
    orderItems.push({
      shop_id: shop.id,
      product_id: product.id,
      variant_id: variant.id,
      product_name: product.name,
      product_url: new URL(`/shop/${product.slug}`, request.url).toString(),
      size: variant.size,
      color: variant.color,
      quantity: item.quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
    });
    messageItems.push({ name: product.name, slug: product.slug, size: variant.size, color: variant.color, quantity: item.quantity, unitPrice });
  }

  const { data: settings } = await supabase.from("site_settings").select("currency").eq("id", true).maybeSingle();
  const currency = String(settings?.currency || "GHS").slice(0, 3);
  const { error: orderError, data: order } = await supabase.from("orders").insert({
      shop_id: shop.id,
      customer_name: cleanText(payload.customerName, 120) || null,
      customer_phone: cleanText(payload.customerPhone, 40) || null,
      delivery_location: cleanText(payload.deliveryLocation, 250) || null,
      payment_preference: payload.paymentPreference,
      currency,
      total: Math.round(total * 100) / 100,
      idempotency_key: idempotencyKey,
    }).select("id,order_number").single();
  if (orderError || !order) return fail("We could not save your order attempt. Please try again.", 503);

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems.map((item) => ({ ...item, order_id: order.id })));
  if (itemsError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return fail("We could not save your order items. Please try again.", 503);
  }

  return Response.json({
    orderNumber: order.order_number,
    shop: { id: shop.id, name: shop.name, slug: shop.slug, whatsappNumber },
    items: messageItems,
    total: Math.round(total * 100) / 100,
    currency,
    customerName: cleanText(payload.customerName, 120),
    customerPhone: cleanText(payload.customerPhone, 40),
    deliveryLocation: cleanText(payload.deliveryLocation, 250),
    paymentPreference: payload.paymentPreference,
    payment: mobileMoneyAvailable
      ? { mobileMoney: { number: momoNumber, network: shop.momo_network, accountName: shop.momo_account_name }, cashOnDelivery: cashAvailable }
      : { mobileMoney: null, cashOnDelivery: cashAvailable },
  });
}
