import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { StoreSettings } from "@/lib/catalog-types";

export default function StorefrontFooter({ settings }: { settings: StoreSettings }) {
  const waLink = settings.whatsappNumber
    ? `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hello ${settings.shopName}, I have a question about your store.`)}`
    : null;

  return <footer className="bg-[#17141C] text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8 lg:py-16">
      <div className="max-w-sm">
        <Link href="/" className="font-[family-name:var(--font-playfair)] text-2xl font-semibold">Charwin Stores</Link>
        <p className="mt-3 text-sm leading-6 text-white/60">Clothing and intimates selected for everyday confidence. Thoughtful finds, personal service, and easy ordering.</p>
        {waLink ? <a href={waLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm text-white transition hover:bg-white/10"><MessageCircle size={16} /> Chat with us</a> : <p className="mt-5 text-xs text-white/40">WhatsApp contact will be available soon.</p>}
      </div>
      <div><h2 className="mb-4 text-xs font-semibold uppercase tracking-[.18em] text-white/40">Shop</h2><div className="flex flex-col gap-3 text-sm text-white/65"><Link href="/shop" className="hover:text-white">All products</Link><Link href="/shop?department=clothing" className="hover:text-white">Clothing</Link><Link href="/shop?category=dresses" className="hover:text-white">Dresses</Link><Link href="/shop?department=underwear" className="hover:text-white">Underwear</Link></div></div>
      <div><h2 className="mb-4 text-xs font-semibold uppercase tracking-[.18em] text-white/40">Need a hand?</h2><p className="max-w-xs text-sm leading-6 text-white/65">Ask about sizes, availability, delivery or anything else. We’re happy to help you choose.</p>{waLink && <a href={waLink} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-white underline decoration-white/30 underline-offset-4 hover:decoration-white">Message Charwin</a>}</div>
    </div>
    <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/40">© {new Date().getFullYear()} Charwin Stores. All rights reserved.</div>
  </footer>;
}
