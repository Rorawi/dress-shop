"use client";

import { useState } from "react";
import { Check, MessageCircle, Share2 } from "lucide-react";

export default function ShareProductButton({ productName, price }: { productName: string; price: string }) {
  const [message, setMessage] = useState("");
  const [whatsAppUrl, setWhatsAppUrl] = useState("");

  async function shareProduct() {
    setMessage("");
    setWhatsAppUrl("");
    const url = window.location.href;
    const text = `${productName} · ${price} at Charwin Stores`;
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Product link copied.");
    } catch {
      setMessage("Copy the link or share it on WhatsApp.");
      setWhatsAppUrl(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`);
    }
  }

  return <div className="mt-4 flex flex-wrap items-center gap-3">
    <button type="button" onClick={shareProduct} className="inline-flex items-center gap-2 rounded-full border border-[#d9cce7] px-4 py-2.5 text-sm font-semibold text-[#55239a] transition hover:bg-[#f8f4fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5bc7]">
      {message === "Product link copied." ? <Check size={16} /> : <Share2 size={16} />}{message === "Product link copied." ? "Link copied" : "Share this item"}
    </button>
    {message && <span role="status" className="text-xs text-[#625b68]">{message}</span>}
    {whatsAppUrl && <a href={whatsAppUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-[#55239a] hover:underline"><MessageCircle size={14} />Open WhatsApp</a>}
  </div>;
}
