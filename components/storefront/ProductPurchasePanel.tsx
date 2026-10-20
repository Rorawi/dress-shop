"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import type { CatalogProduct, StoreSettings } from "@/lib/catalog-types";
import type { CartItem } from "@/lib/cart";
import { useCartStore } from "@/lib/cart";
import WhatsAppOrderDialog from "@/components/storefront/WhatsAppOrderDialog";
import SizeGuideModal from "@/components/SizeGuideModal";

const money = (amount: number, currency: string) => new Intl.NumberFormat("en-GH", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

export default function ProductPurchasePanel({ product, settings }: { product: CatalogProduct; settings: StoreSettings }) {
  const colors = [...new Set(product.variants.map((variant) => variant.color))];
  const [color, setColor] = useState(colors[0] ?? "Default");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const colorVariants = product.variants.filter((variant) => variant.color === color);
  const selected = colorVariants.find((variant) => variant.size === size && variant.stock > 0);
  const available = product.variants.some((variant) => variant.stock > 0);
  const firstImage = product.images[0]?.url ?? "";

  const orderItem: CartItem[] = useMemo(() => selected ? [{
    productId: product.id,
    variantId: selected.id,
    name: product.name,
    slug: product.slug,
    size: selected.size,
    color: selected.color,
    price: product.price,
    image: firstImage,
    stock: selected.stock,
    discreetImage: product.discreetImage,
    quantity,
  }] : [], [firstImage, product, quantity, selected]);

  const handleAdd = () => {
    if (!selected) return;
    addItem({ ...orderItem[0], quantity });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return <div className="space-y-6">
    {colors.length > 0 && <div>
      <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Colour <span className="font-normal text-[#625B68]">/ {color}</span></p><span className="text-xs text-[#625B68]">{colors.length} option{colors.length === 1 ? "" : "s"}</span></div>
      <div className="flex flex-wrap gap-2">{colors.map((option) => {
        const selectedColor = option === color;
        return <button type="button" key={option} onClick={() => { setColor(option); setSize(""); setQuantity(1); }} aria-pressed={selectedColor} className={`rounded-full border px-4 py-2 text-xs font-medium transition ${selectedColor ? "border-[#55239A] bg-[#F5F1F8] text-[#35115F]" : "border-[#E6E0EB] text-[#625B68] hover:border-[#8B5BC7]"}`}>{option}</button>;
      })}</div>
    </div>}
    <div>
      <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">Select size</span><SizeGuideModal /></div>
      <div className="flex flex-wrap gap-2">{colorVariants.map((variant) => {
        const out = variant.stock <= 0;
        const active = size === variant.size;
        return <button key={variant.id} type="button" onClick={() => { if (!out) { setSize(variant.size); setQuantity(1); } }} disabled={out} aria-pressed={active} className={`min-w-12 rounded-xl border px-4 py-3 text-sm transition ${out ? "cursor-not-allowed border-[#EEEAF0] text-[#C3BBC8] line-through" : active ? "border-[#17141C] bg-[#17141C] text-white" : "border-[#E6E0EB] text-[#17141C] hover:border-[#55239A]"}`}>{variant.size}</button>;
      })}</div>
      {!available && <p className="mt-3 text-sm font-medium text-[#B42318]">Sold out at the moment. Please check back soon.</p>}
      {selected && <p className="mt-3 text-xs text-[#625B68]">{selected.stock <= 3 ? `Only ${selected.stock} left in this size` : "In stock"}</p>}
    </div>
    {selected && <div className="flex items-center justify-between rounded-2xl border border-[#E6E0EB] p-3">
      <span className="pl-2 text-sm font-medium">Quantity</span>
      <div className="flex items-center gap-4"><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Decrease quantity" className="rounded-full p-2 hover:bg-[#F5F1F8]"><Minus size={15} /></button><span className="min-w-4 text-center text-sm font-semibold">{quantity}</span><button type="button" onClick={() => setQuantity((current) => Math.min(selected.stock, current + 1))} aria-label="Increase quantity" className="rounded-full p-2 hover:bg-[#F5F1F8]"><Plus size={15} /></button></div>
    </div>}
    <div className="space-y-3">
      <button type="button" onClick={handleAdd} disabled={!selected} className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold transition ${selected ? "bg-[#17141C] text-white hover:bg-[#35115F]" : "cursor-not-allowed bg-[#E9E5EC] text-[#8B8490]"}`}><ShoppingBag size={18} />{added ? "Added to your bag" : selected ? "Add to bag" : available ? "Choose your size" : "Sold out"}</button>
      <WhatsAppOrderDialog items={orderItem} settings={settings} disabled={!selected} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#55239A] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#35115F]" />
    </div>
    <div className="grid grid-cols-3 gap-2 border-t border-[#E6E0EB] pt-5 text-center text-[10px] leading-4 text-[#625B68] sm:text-xs"><div className="rounded-xl bg-[#FCFBFD] p-3">Order directly<br />on WhatsApp</div><div className="rounded-xl bg-[#FCFBFD] p-3">Personal sizing<br />assistance</div><div className="rounded-xl bg-[#FCFBFD] p-3">Delivery details<br />confirmed in chat</div></div>
  </div>;
}
