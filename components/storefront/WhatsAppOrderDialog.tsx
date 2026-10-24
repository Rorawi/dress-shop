"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import type { CartItem } from "@/lib/cart";
import type { StoreSettings } from "@/lib/catalog-types";
import { buildWhatsAppUrl, isValidWhatsAppNumber } from "@/lib/whatsapp";

interface WhatsAppOrderDialogProps {
  items: CartItem[];
  settings: StoreSettings;
  label?: string;
  disabled?: boolean;
  className?: string;
}

type LoggedOrder = {
  orderNumber: number;
  shop: { id: string; name: string; slug: string; whatsappNumber: string };
  items: Array<{ name: string; slug: string; size: string; color: string; quantity: number; unitPrice: number }>;
  total: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  deliveryLocation: string;
  paymentPreference: "mobile_money" | "cash_on_delivery";
  payment: { mobileMoney: { number: string; network: string; accountName: string } | null; cashOnDelivery: boolean };
};

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export default function WhatsAppOrderDialog({ items, settings, label = "Order on WhatsApp", disabled = false, className = "" }: WhatsAppOrderDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [paymentPreference, setPaymentPreference] = useState<"mobile_money" | "cash_on_delivery" | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shopId = items[0]?.shopId;
  const shopName = items[0]?.shopName;
  const whatsappNumber = items[0]?.whatsappNumber;
  const oneShopOnly = items.every((item) => item.shopId === shopId);
  const validNumber = isValidWhatsAppNumber(whatsappNumber);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const momoAvailable = items[0]?.acceptsMobileMoney ?? false;
  const cashAvailable = items[0]?.acceptsCashOnDelivery ?? false;
  const unavailable = disabled || !oneShopOnly || !shopId || !validNumber || items.length === 0 || (!momoAvailable && !cashAvailable);

  const showForm = () => {
    setError("");
    setPaymentPreference(momoAvailable ? "mobile_money" : cashAvailable ? "cash_on_delivery" : "");
    setOpen(true);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (unavailable || !paymentPreference || busy) return;
    setBusy(true);
    setError("");
    const whatsappWindow = window.open("about:blank", "_blank");
    if (whatsappWindow) whatsappWindow.opener = null;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopId,
          items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
          customerName: name,
          customerPhone: phone,
          deliveryLocation: area,
          paymentPreference,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const result = await response.json() as LoggedOrder & { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not save your order. Please try again.");

      const preferenceLabel = result.paymentPreference === "mobile_money" ? "Mobile money" : "Cash on delivery";
      const message = [
        `Hello ${result.shop.name}, I’d like to place an order:`,
        `Order reference: #${result.orderNumber}`,
        "",
        ...result.items.map((item, index) => {
          const options = [item.color.toLowerCase() !== "default" ? item.color : "", item.size.toLowerCase() !== "one size" ? `Size ${item.size}` : ""].filter(Boolean).join(" · ");
          return `${index + 1}. ${item.name}${options ? ` — ${options}` : ""} × ${item.quantity} = ${money(item.unitPrice * item.quantity, result.currency)}\n   ${window.location.origin}/shop/${item.slug}`;
        }),
        "",
        `Total: ${money(result.total, result.currency)}`,
        `Name: ${result.customerName || "Not provided"}`,
        `Phone: ${result.customerPhone || "Not provided"}`,
        `Delivery location: ${result.deliveryLocation || "Please advise"}`,
        `Payment preference: ${preferenceLabel}`,
        "Please confirm availability and delivery details. Thank you!",
      ].join("\n");
      const whatsappUrl = buildWhatsAppUrl(result.shop.whatsappNumber, message);
      if (!whatsappUrl) throw new Error("This shop’s WhatsApp number is invalid. Please contact the shop from its storefront.");

      const confirmation = {
        orderNumber: result.orderNumber,
        shop: result.shop,
        total: result.total,
        currency: result.currency,
        paymentPreference: result.paymentPreference,
        payment: result.payment,
        whatsappUrl,
      };
      window.sessionStorage.setItem("charwin-order-confirmation-v1", JSON.stringify(confirmation));
      if (whatsappWindow) whatsappWindow.location.replace(whatsappUrl);
      else window.sessionStorage.setItem("charwin-order-whatsapp-fallback-v1", whatsappUrl);
      setOpen(false);
      router.push("/order-confirmation");
    } catch (submissionError) {
      whatsappWindow?.close();
      setError(submissionError instanceof Error ? submissionError.message : "We could not save your order. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <>
    <button type="button" onClick={showForm} disabled={unavailable} className={`${className} ${unavailable ? "cursor-not-allowed opacity-50" : ""}`}>
      <MessageCircle size={18} /> {disabled ? "Choose an available option" : validNumber ? label : "WhatsApp unavailable"}
    </button>
    {!validNumber && !disabled && <p className="mt-2 text-center text-xs text-[#625B68]">This shop hasn’t added a WhatsApp number yet.</p>}
    {items.length > 0 && !momoAvailable && !cashAvailable && <p className="mt-2 text-center text-xs text-[#625B68]">Ordering is paused until this shop adds a payment option.</p>}
    {open && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="whatsapp-order-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.18em] text-[#8B5BC7]">Final step · {shopName}</p><h2 id="whatsapp-order-title" className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">Send your order</h2><p className="mt-1 text-sm text-[#625B68]">We’ll save your order attempt, then open this shop’s WhatsApp chat.</p></div>
          <button type="button" onClick={() => setOpen(false)} disabled={busy} aria-label="Close order form" className="rounded-full p-2 hover:bg-[#F5F1F8] disabled:opacity-40"><X size={20} /></button>
        </div>
        <div className="mb-5 max-h-36 space-y-2 overflow-y-auto rounded-2xl bg-[#FCFBFD] p-4">
          {items.map((item) => {
            const options = [item.color.toLowerCase() !== "default" ? item.color : "", item.size.toLowerCase() !== "one size" ? item.size : ""].filter(Boolean).join(" · ");
            return <div key={item.variantId} className="flex justify-between gap-4 text-sm"><span className="text-[#625B68]">{item.name}{options ? ` · ${options}` : ""} × {item.quantity}</span><span className="shrink-0 font-medium">{money(item.price * item.quantity, settings.currency)}</span></div>;
          })}
          <div className="flex justify-between border-t border-[#E6E0EB] pt-2 text-sm font-semibold"><span>Estimated total</span><span>{money(subtotal, settings.currency)}</span></div><p className="text-[10px] leading-4 text-[#8B8490]">We’ll re-check current prices and stock before saving your order.</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium">Your name <span className="font-normal text-[#625B68]">(optional)</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoComplete="name" className="mt-1.5 w-full rounded-xl border border-[#E6E0EB] px-4 py-3 outline-none focus:border-[#8B5BC7]" placeholder="Name" /></label>
          <label className="block text-sm font-medium">Phone number <span className="font-normal text-[#625B68]">(optional)</span><input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} autoComplete="tel" inputMode="tel" className="mt-1.5 w-full rounded-xl border border-[#E6E0EB] px-4 py-3 outline-none focus:border-[#8B5BC7]" placeholder="Your contact number" /></label>
          <label className="block text-sm font-medium">Delivery location <span className="font-normal text-[#625B68]">(optional)</span><input value={area} onChange={(event) => setArea(event.target.value)} maxLength={250} autoComplete="street-address" className="mt-1.5 w-full rounded-xl border border-[#E6E0EB] px-4 py-3 outline-none focus:border-[#8B5BC7]" placeholder="Town or neighbourhood" /></label>
          <label className="block text-sm font-medium">Payment preference<select required value={paymentPreference} onChange={(event) => setPaymentPreference(event.target.value as typeof paymentPreference)} className="mt-1.5 w-full rounded-xl border border-[#E6E0EB] bg-white px-4 py-3 text-sm outline-none focus:border-[#8B5BC7]"><option value="">Choose a payment preference</option>{momoAvailable && <option value="mobile_money">Mobile money</option>}{cashAvailable && <option value="cash_on_delivery">Cash on delivery</option>}</select></label>
          {error && <p role="alert" className="rounded-xl bg-[#FFF2F0] px-4 py-3 text-sm leading-5 text-[#B42318]">{error}</p>}
          <button type="submit" disabled={unavailable || !paymentPreference || busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#55239A] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#35115F] disabled:cursor-not-allowed disabled:bg-[#E9E5EC] disabled:text-[#8B8490]"><MessageCircle size={18} />{busy ? "Saving your order…" : "Continue to WhatsApp"}</button>
          <p className="text-center text-[10px] leading-4 text-[#8B8490]">No payment is taken here. You’ll confirm payment directly with {shopName || "the shop"}.</p>
        </form>
      </section>
    </div>}
  </>;
}
