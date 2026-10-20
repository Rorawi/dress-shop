"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { useCartStore } from "@/lib/cart";
import CartDrawer from "./CartDrawer";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?category=CASUAL", label: "Casual" },
  { href: "/shop?category=FORMAL", label: "Formal" },
  { href: "/shop?category=WEDDING", label: "Wedding" },
  { href: "/shop?category=PARTY", label: "Party" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, openCart, isOpen, closeCart } = useCartStore();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-[#E6E0EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              aria-label="Charwin Stores home"
              className="flex items-center gap-2 font-[family-name:var(--font-playfair)] text-xl font-bold tracking-tight text-[#17141C]"
            >
              <Image
                src="/brand/charwin-stores-logo.jpg"
                alt=""
                width={52}
                height={52}
                priority
                className="h-12 w-12 rounded-full object-cover"
              />
              <span>Charwin Stores</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-[#625B68] hover:text-[#55239A] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={openCart}
                aria-label="Open cart"
                className="relative p-2 text-[#17141C] hover:text-[#55239A] transition-colors"
              >
                <ShoppingBag size={22} />
                {totalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#55239A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {totalItems()}
                  </span>
                )}
              </button>
              <button
                className="md:hidden p-2 text-[#17141C]"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="md:hidden bg-white border-t border-[#E6E0EB] px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#625B68] hover:text-[#55239A]"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <CartDrawer isOpen={isOpen} onClose={closeCart} />
    </>
  );
}
