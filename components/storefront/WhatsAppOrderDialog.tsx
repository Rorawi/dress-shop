"use client";

import { useState } from "react";
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

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export default function WhatsAppOrderDialog({ items, settings, label = "Order on WhatsApp", disabled = false, className = "" }: WhatsAppOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const validNumber = isValidWhatsAppNumber(settings.whatsappNumber);
  const unavailable = disabled || !validNumber || items.length === 0;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (unavailable) return;
    const message = [
      `Hello ${settings.shopName}, I’d like to place an order:`,
      "",
      ...items.map((item, index) => {
        const options = [item.size.toLowerCase() !== "one size" ? item.size : "", item.color.toLowerCase() !== "default" ? item.color : ""].filter(Boolean).join(", ");
        return `${index + 1}. ${item.name}${options ? ` — ${options}` : ""} × ${item.quantity} = ${money(item.price * item.quantity, settings.currency)}\n   ${window.location.origin}/shop/${item.slug}`;
      }),
      "",
      `Subtotal: ${money(subtotal, settings.currency)}`,
      `Name: ${name.trim() || "Not provided"}`,
      `Delivery area: ${area.trim() || "Please advise"}`,
      note.trim() ? `Note: ${note.trim()}` : "",
      "Please confirm availability and delivery details. Thank you!",
    ].filter(Boolean).join("\n");
    const url = buildWhatsAppUrl(settings.whatsappNumber, message);
    if (url) window.location.assign(url);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} disabled={unavailable} className={`${className} ${unavailable ? "cursor-not-allowed opacity-50" : ""}`}>
        <MessageCircle size={18} /> {settings.whatsappNumber ? label : "WhatsApp ordering setup pending"}
      </button>
      {!settings.whatsappNumber && <p className="mt-2 text-center text-xs text-[#625B68]">Add the shop WhatsApp number in site settings to enable orders.</p>}
      {settings.whatsappNumber && !isValidWhatsAppNumber(settings.whatsappNumber) && <p className="mt-2 text-center text-xs text-[#B42318]">The shop WhatsApp number is invalid. Update it in site settings.</p>}
      {open && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="whatsapp-order-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div><p className="mb-1 text-xs font-semibold uppercase tracking-[.18em] text-[#8B5BC7]">Final step</p><h2 id="whatsapp-order-title" className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">Send your order</h2><p className="mt-1 text-sm text-[#625B68]">We’ll open WhatsApp with your order details ready to send.</p></div>
            <button onClick={() => setOpen(false)} aria-label="Close order form" className="rounded-full p-2 hover:bg-[#F5F1F8]"><X size={20} /></button>
          </div>
          <div className="mb-5 max-h-36 space-y-2 overflow-y-auto rounded-2xl bg-[#FCFBFD] p-4">
            {items.map((item) => {
              const options = [item.size.toLowerCase() !== "one size" ? item.size : "", item.color.toLowerCase() !== "default" ? item.color : ""].filter(Boolean).join(" · ");
              return <div key={item.variantId} className="flex justify-between gap-4 text-sm"><span className="text-[#625B68]">{item.name}{options ? ` · ${options}` : ""} × {item.quantity}</span><span className="shrink-0 font-medium">{money(item.price * item.quantity, settings.currency)}</span></div>;
            })}
            <div className="flex justify-between border-t border-[#E6E0EB] pt-2 text-sm font-semibold"><span>Subtotal</span><span>{money(subtotal, settings.currency)}</span></div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium">Your name <span className="font-normal text-[#625B68]">(optional)</span><input value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#E6E0EB] px-4 py-3 outline-none focus:border-[#8B5BC7]" placeholder="Name" /></label>
            <label className="block text-sm font-medium">Delivery area <span className="font-normal text-[#625B68]">(optional)</span><input value={area} onChange={(event) => setArea(event.target.value)} className="mt-1.5 w-full rounded-xl border border-[#E6E0EB] px-4 py-3 outline-none focus:border-[#8B5BC7]" placeholder="Town or neighbourhood" /></label>
            <label className="block text-sm font-medium">Note <span className="font-normal text-[#625B68]">(optional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={2} className="mt-1.5 w-full resize-y rounded-xl border border-[#E6E0EB] px-4 py-3 outline-none focus:border-[#8B5BC7]" placeholder="Anything else we should know?" /></label>
            <button type="submit" disabled={unavailable} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#55239A] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#35115F] disabled:cursor-not-allowed disabled:bg-[#E9E5EC] disabled:text-[#8B8490]"><MessageCircle size={18} /> {validNumber ? "Continue to WhatsApp" : "WhatsApp unavailable"}</button>
          </form>
        </section>
      </div>}
    </>
  );
}
