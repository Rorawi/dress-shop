import { MessageCircle } from "lucide-react";
import type { StoreSettings } from "@/lib/catalog-types";

export default function WhatsAppFab({ settings }: { settings: StoreSettings }) {
  if (!settings.whatsappNumber) return null;
  const href = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(`Hello ${settings.shopName}, I have a question about the collection.`)}`;
  return <a href={href} target="_blank" rel="noreferrer" aria-label="Chat with Charwin Stores on WhatsApp" className="fixed bottom-5 right-4 z-40 flex items-center gap-2 rounded-full bg-[#20A56B] px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-[#168653] sm:bottom-7 sm:right-7 sm:px-5 sm:py-3.5"><MessageCircle size={19} /><span className="hidden sm:inline">Chat with us</span></a>;
}
