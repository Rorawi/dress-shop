"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCartStore, type CartItem } from "@/lib/cart";
import type { StoreSettings } from "@/lib/catalog-types";
import WhatsAppOrderDialog from "@/components/storefront/WhatsAppOrderDialog";
import DiscreetImage from "@/components/storefront/DiscreetImage";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

function groupByShop(items: CartItem[]) {
  const grouped = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = item.shopId || `unavailable:${item.variantId}`;
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return [...grouped.entries()].map(([shopId, shopItems]) => ({ shopId, items: shopItems }));
}

export default function CartView({ settings }: { settings: StoreSettings }) {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (useCartStore.persist.hasHydrated()) {
      setReady(true);
      return;
    }
    const unsubscribe = useCartStore.persist.onFinishHydration(() => setReady(true));
    return unsubscribe;
  }, []);

  const shopGroups = useMemo(() => groupByShop(items), [items]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return <div className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
    <div className="mb-7"><Link href="/shop" className="mb-4 inline-flex items-center gap-2 text-xs text-[#625B68] hover:text-[#55239A]"><ArrowLeft size={14} /> Continue shopping</Link><h1 className="font-[family-name:var(--font-playfair)] text-4xl font-medium">Your bag</h1><p className="mt-2 text-sm text-[#625B68]">{ready ? `${items.reduce((sum, item) => sum + item.quantity, 0)} items from ${shopGroups.length} ${shopGroups.length === 1 ? "shop" : "shops"}` : "Loading your saved items…"}</p></div>
    {!ready ? <div className="h-40 animate-pulse rounded-3xl bg-[#F3F0F5]" /> : items.length === 0 ? <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl bg-white px-5 text-center"><span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5F1F8] text-[#55239A]"><ShoppingBag size={25} /></span><h2 className="font-[family-name:var(--font-playfair)] text-2xl">Your bag is waiting</h2><p className="mt-2 max-w-sm text-sm leading-6 text-[#625B68]">Take a look around and add a few pieces you love. You can place a separate WhatsApp order with each shop.</p><Link href="/shop" className="mt-6 rounded-full bg-[#55239A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#35115F]">Explore the collection</Link></div> : <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">{shopGroups.map(({ shopId, items: shopItems }) => {
        const first = shopItems[0];
        const shopTotal = shopItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const stockChanged = shopItems.some((item) => item.stock <= 0 || item.quantity > item.stock);
        return <section key={shopId} className="overflow-hidden rounded-3xl border border-[#EEEAF0] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E0EB] bg-[#FCFBFD] px-4 py-4 sm:px-6">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#8B5BC7]">Your order goes to</p>{first.shopSlug ? <Link href={`/s/${first.shopSlug}`} className="mt-1 inline-block font-[family-name:var(--font-playfair)] text-xl font-medium hover:text-[#55239A]">{first.shopName || "Local shop"}</Link> : <p className="mt-1 font-semibold text-[#B42318]">Shop unavailable</p>}</div>
            <span className="text-xs text-[#625B68]">{shopItems.reduce((sum, item) => sum + item.quantity, 0)} {shopItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? "item" : "items"}</span>
          </div>
          <div className="divide-y divide-[#E6E0EB] px-4 sm:px-6">{shopItems.map((item) => <article key={item.variantId} className="flex gap-4 py-5 sm:gap-5">
            <div className="relative aspect-[4/5] w-[92px] shrink-0 overflow-hidden rounded-xl bg-[#F3F0F5] sm:w-[112px]">{item.image ? <DiscreetImage src={item.image} alt={item.name} sizes="112px" discreet={item.discreetImage} /> : null}</div>
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 py-0.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/shop/${item.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:text-[#55239A]">{item.name}</Link>{(item.color.toLowerCase() !== "default" || item.size.toLowerCase() !== "one size") && <p className="mt-1 text-xs text-[#625B68]">{[item.color.toLowerCase() !== "default" ? item.color : "", item.size.toLowerCase() !== "one size" ? `Size ${item.size}` : ""].filter(Boolean).join(" · ")}</p>}<p className="mt-2 text-xs font-medium">{money(item.price, settings.currency)}</p>{item.stock <= 0 && <p className="mt-1 text-xs font-semibold text-[#B42318]">Sold out · remove this item to order</p>}{item.stock > 0 && item.quantity > item.stock && <p className="mt-1 text-xs font-semibold text-[#8A4B00]">Only {item.stock} available · lower the quantity</p>}</div><button type="button" onClick={() => removeItem(item.variantId)} aria-label={`Remove ${item.name}`} className="rounded-full p-2 text-[#8B8490] hover:bg-[#F8F5FA] hover:text-[#B42318]"><Trash2 size={16} /></button></div><div className="flex items-center justify-between gap-4"><div className="flex items-center rounded-full border border-[#E6E0EB]"><button type="button" onClick={() => updateQuantity(item.variantId, item.quantity - 1)} aria-label="Decrease quantity" className="p-2.5"><Minus size={13} /></button><span className="min-w-7 text-center text-xs font-semibold">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.variantId, item.quantity + 1)} aria-label="Increase quantity" disabled={item.quantity >= Math.min(item.stock, 99)} className="p-2.5 disabled:opacity-30"><Plus size={13} /></button></div><span className="text-sm font-semibold">{money(item.price * item.quantity, settings.currency)}</span></div></div>
          </article>)}</div>
          <div className="flex flex-col gap-4 border-t border-[#E6E0EB] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-xs text-[#625B68]">Items subtotal</p><p className="mt-1 text-lg font-semibold">{money(shopTotal, settings.currency)}</p></div><WhatsAppOrderDialog items={shopItems} settings={settings} disabled={stockChanged} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#55239A] px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#35115F] sm:w-auto" /></div>
        </section>;
      })}</div>
      <aside className="rounded-3xl border border-[#EEEAF0] bg-white p-5 sm:p-6 lg:sticky lg:top-28"><h2 className="font-[family-name:var(--font-playfair)] text-2xl">Bag summary</h2><div className="mt-5 space-y-3 border-b border-[#E6E0EB] pb-5 text-sm"><div className="flex justify-between text-[#625B68]"><span>All items</span><span>{money(subtotal, settings.currency)}</span></div><p className="text-xs leading-5 text-[#8B8490]">Each shop receives a separate order. Delivery and payment are confirmed with that shop in WhatsApp.</p></div><div className="flex justify-between py-5 text-sm font-semibold"><span>Estimated total</span><span>{money(subtotal, settings.currency)}</span></div><p className="text-center text-[10px] leading-4 text-[#8B8490]">Nothing is charged here. Payment goes directly to each shop.</p></aside>
    </div>}
  </div>;
}
