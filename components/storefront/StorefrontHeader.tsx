"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/lib/cart";

const links = [
  { label: "Shop all", href: "/shop" },
  { label: "Clothing", href: "/shop?department=clothing" },
  { label: "Dresses", href: "/shop?category=dresses" },
  { label: "Shirts & tops", href: "/shop?category=shirts" },
  { label: "Underwear", href: "/shop?department=underwear" },
];

export default function StorefrontHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCartStore((state) => state.items);
  const count = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E6E0EB] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button className="p-2 text-[#17141C] md:hidden" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <Link href="/" aria-label="Charwin Stores home" className="flex items-center gap-2.5">
          <Image src="/brand/charwin-stores-logo.jpg" alt="" width={54} height={54} priority className="h-12 w-12 rounded-full object-cover" />
          <span className="font-[family-name:var(--font-playfair)] text-lg font-semibold tracking-tight text-[#17141C] sm:text-xl">Charwin Stores</span>
        </Link>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {links.map((link) => <Link key={link.href} href={link.href} className="text-[13px] font-medium text-[#625B68] transition hover:text-[#55239A]">{link.label}</Link>)}
        </nav>
        <div className="flex items-center gap-1 sm:gap-3">
          <Link href="/shop" className="rounded-full p-2.5 text-[#17141C] transition hover:bg-[#F5F1F8] hover:text-[#55239A]" aria-label="Search products"><Search size={20} /></Link>
          <Link href="/cart" className="relative rounded-full p-2.5 text-[#17141C] transition hover:bg-[#F5F1F8] hover:text-[#55239A]" aria-label={`Shopping bag${count ? `, ${count} items` : ""}`}>
            <ShoppingBag size={21} />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#55239A] px-1 text-[10px] font-semibold text-white">{count}</span>}
          </Link>
        </div>
      </div>
      {mobileOpen && <nav className="flex flex-col gap-1 border-t border-[#E6E0EB] bg-white px-5 py-3 md:hidden" aria-label="Mobile navigation">
        {links.map((link) => <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-sm font-medium text-[#625B68] hover:bg-[#F5F1F8] hover:text-[#55239A]" onClick={() => setMobileOpen(false)}>{link.label}</Link>)}
        <Link href="/cart" className="rounded-lg px-3 py-3 text-sm font-medium text-[#625B68] hover:bg-[#F5F1F8]" onClick={() => setMobileOpen(false)}>Your bag{count ? ` (${count})` : ""}</Link>
      </nav>}
    </header>
  );
}
