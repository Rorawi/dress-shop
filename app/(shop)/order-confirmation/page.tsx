"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageCircle, ShoppingBag } from "lucide-react";

type Confirmation = {
  orderNumber: number;
  shop: { name: string; slug: string };
  total: number;
  currency: string;
  paymentPreference: "mobile_money" | "cash_on_delivery";
  payment: { mobileMoney: { number: string; network: string; accountName: string } | null; cashOnDelivery: boolean };
  whatsappUrl: string;
};

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export default function OrderConfirmationPage() {
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = window.sessionStorage.getItem("charwin-order-confirmation-v1");
    if (saved) {
      try {
        setConfirmation(JSON.parse(saved) as Confirmation);
      } catch {
        window.sessionStorage.removeItem("charwin-order-confirmation-v1");
      }
      window.sessionStorage.removeItem("charwin-order-confirmation-v1");
    }
    window.sessionStorage.removeItem("charwin-order-whatsapp-fallback-v1");
    setReady(true);
  }, []);

  if (!ready) return <div className="mx-auto min-h-[60vh] max-w-xl animate-pulse px-4 py-16"><div className="h-72 rounded-3xl bg-[#F3F0F5]" /></div>;

  return <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center px-4 py-12 sm:px-6">
    <section className="w-full rounded-[2rem] border border-[#E6E0EB] bg-white p-6 text-center shadow-sm sm:p-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF6EF] text-[#18794E]"><CheckCircle2 size={32} /></span>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">Order attempt saved</p>
      <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-medium sm:text-4xl">{confirmation ? `Your order is with ${confirmation.shop.name}` : "Your order is ready"}</h1>
      {confirmation ? <>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#625B68]">Order reference <strong className="text-[#17141C]">#{confirmation.orderNumber}</strong> has been recorded for {confirmation.shop.name}. Finish by sending the prepared message in WhatsApp.</p>
        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#FCFBFD] p-4 text-left"><div className="flex justify-between gap-4 text-sm"><span className="text-[#625B68]">Order total</span><strong>{money(confirmation.total, confirmation.currency)}</strong></div><div className="mt-2 flex justify-between gap-4 text-sm"><span className="text-[#625B68]">Payment preference</span><strong>{confirmation.paymentPreference === "mobile_money" ? "Mobile money" : "Cash on delivery"}</strong></div></div>
        {confirmation.payment.mobileMoney && <div className="mx-auto mt-5 max-w-md rounded-2xl border border-[#D8EBDD] bg-[#F3FAF5] p-5 text-left"><p className="text-sm font-semibold text-[#12603D]">Mobile money details</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-[#625B68]">Network</dt><dd className="font-medium text-[#17141C]">{confirmation.payment.mobileMoney.network}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#625B68]">Number</dt><dd className="font-medium text-[#17141C]">{confirmation.payment.mobileMoney.number}</dd></div><div className="flex justify-between gap-4"><dt className="text-[#625B68]">Account name</dt><dd className="text-right font-medium text-[#17141C]">{confirmation.payment.mobileMoney.accountName}</dd></div></dl><p className="mt-4 border-t border-[#D8EBDD] pt-3 text-xs leading-5 text-[#625B68]">Payment is made directly to the shop after they confirm your order. Charwin Stores does not handle payments.</p></div>}
        <a href={confirmation.whatsappUrl} target="_blank" rel="noreferrer" className="mx-auto mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#18794E] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#12603D]"><MessageCircle size={18} /> Open WhatsApp order</a>
        <div className="mt-5"><Link href={`/s/${confirmation.shop.slug}`} className="text-xs font-semibold text-[#55239A] hover:underline">Visit {confirmation.shop.name}</Link></div>
      </> : <>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#625B68]">There isn’t a recent order in this browser session. You can keep browsing shops and build a new order anytime.</p>
        <Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#55239A] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#35115F]"><ShoppingBag size={17} /> Browse shops</Link>
      </>}
    </section>
  </div>;
}
