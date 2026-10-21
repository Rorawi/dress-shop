"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import type { CatalogProduct, StoreSettings } from "@/lib/catalog-types";
import type { CartItem } from "@/lib/cart";
import { useCartStore } from "@/lib/cart";
import { colorKey, getCatalogColorOptions } from "@/lib/catalog-colors";
import WhatsAppOrderDialog from "@/components/storefront/WhatsAppOrderDialog";
import SizeGuideModal from "@/components/SizeGuideModal";

export default function ProductPurchasePanel({ product, settings }: { product: CatalogProduct; settings: StoreSettings }) {
  const isBagProduct = product.category.department === "bags";
  const isShoeProduct = product.category.department === "shoes";
  const colors = getCatalogColorOptions(product.variants.map((variant) => variant.color));
  const showColorSelector = colors.length > 0;
  const [color, setColor] = useState(colors[0]?.name ?? "Default");
  const [size, setSize] = useState(isBagProduct ? "One size" : "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const colorVariants = product.variants.filter((variant) => colorKey(variant.color) === colorKey(color));
  const selected = colorVariants.find((variant) => variant.size === size && variant.stock > 0);
  const available = colorVariants.some((variant) => variant.stock > 0);
  const firstImage = product.images[0]?.url ?? "";

  const orderItem: CartItem[] = selected ? [{
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
  }] : [];

  const handleAdd = () => {
    if (!selected) return;
    addItem({ ...orderItem[0], quantity });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return <div className="space-y-6">
    {showColorSelector && <div>
      <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Colour <span className="font-normal text-[#625B68]">/ {colors.find((option) => option.key === colorKey(color))?.name ?? color}</span></p><span className="text-xs text-[#625B68]">Choose a colour</span></div>
      <div className="flex flex-wrap gap-3">{colors.map((option) => {
        const selectedColor = option.key === colorKey(color);
        return <button type="button" key={option.key} onClick={() => { setColor(option.name); setSize(isBagProduct ? "One size" : ""); setQuantity(1); }} aria-label={`Choose ${option.name}`} aria-pressed={selectedColor} className="group flex min-w-14 flex-col items-center gap-1.5 rounded-xl p-1.5 text-[10px] font-medium text-[#625B68] transition hover:bg-[#F8F5FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5BC7]">
          <span className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white p-1 ${selectedColor ? "border-[#55239A] ring-2 ring-[#55239A] ring-offset-2" : "border-[#E6E0EB]"}`}><span className="h-full w-full rounded-full border border-black/10" style={{ backgroundColor: option.hex }} /></span>
          <span>{option.name}</span>
        </button>;
      })}</div>
    </div>}
    {!isBagProduct && <div>
      <div className="mb-3 flex items-center justify-between"><span className="text-sm font-semibold">{isShoeProduct ? "Select UK shoe size" : "Select size"}</span><SizeGuideModal shoes={isShoeProduct} /></div>
      <div className="flex flex-wrap gap-2">{colorVariants.map((variant) => {
        const out = variant.stock <= 0;
        const active = size === variant.size;
        return <button key={variant.id} type="button" onClick={() => { if (!out) { setSize(variant.size); setQuantity(1); } }} disabled={out} aria-pressed={active} className={`min-w-12 rounded-xl border px-4 py-3 text-sm transition ${out ? "cursor-not-allowed border-[#EEEAF0] text-[#C3BBC8] line-through" : active ? "border-[#17141C] bg-[#17141C] text-white" : "border-[#E6E0EB] text-[#17141C] hover:border-[#55239A]"}`}>{variant.size}</button>;
      })}</div>
      {!available && <p className="mt-3 text-sm font-medium text-[#B42318]">{showColorSelector ? `${color} is sold out at the moment.` : "Sold out at the moment."} Please check back soon.</p>}
    </div>}
    {selected && <p className="-mt-4 text-xs text-[#625B68]">{selected.stock <= 3 ? `Only ${selected.stock} left in stock` : "In stock"}</p>}
    {selected && <div className="flex items-center justify-between rounded-2xl border border-[#E6E0EB] p-3">
      <span className="pl-2 text-sm font-medium">Quantity</span>
      <div className="flex items-center gap-4"><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))} aria-label="Decrease quantity" className="rounded-full p-2 hover:bg-[#F5F1F8]"><Minus size={15} /></button><span className="min-w-4 text-center text-sm font-semibold">{quantity}</span><button type="button" onClick={() => setQuantity((current) => Math.min(selected.stock, current + 1))} aria-label="Increase quantity" className="rounded-full p-2 hover:bg-[#F5F1F8]"><Plus size={15} /></button></div>
    </div>}
    <div className="space-y-3">
      <button type="button" onClick={handleAdd} disabled={!selected} className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-semibold transition ${selected ? "bg-[#17141C] text-white hover:bg-[#35115F]" : "cursor-not-allowed bg-[#E9E5EC] text-[#8B8490]"}`}><ShoppingBag size={18} />{added ? "Added to your bag" : selected ? "Add to bag" : available ? isBagProduct ? "Choose a colour" : "Choose your size" : "Sold out"}</button>
      <WhatsAppOrderDialog items={orderItem} settings={settings} disabled={!selected} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#55239A] px-6 py-4 text-sm font-semibold text-white transition hover:bg-[#35115F]" />
    </div>
    <div className="grid grid-cols-3 gap-2 border-t border-[#E6E0EB] pt-5 text-center text-[10px] leading-4 text-[#625B68] sm:text-xs"><div className="rounded-xl bg-[#FCFBFD] p-3">Order directly<br />on WhatsApp</div><div className="rounded-xl bg-[#FCFBFD] p-3">{isBagProduct ? <>Product questions<br />answered in chat</> : <>Personal sizing<br />assistance</>}</div><div className="rounded-xl bg-[#FCFBFD] p-3">Delivery details<br />confirmed in chat</div></div>
  </div>;
}
