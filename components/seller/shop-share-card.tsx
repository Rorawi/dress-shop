"use client";
/* eslint-disable @next/next/no-img-element -- This is a QR image hosted by the configured QR API. */

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

export default function ShopShareCard({ shopName, shopUrl, slug }: { shopName: string; shopUrl: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=svg&data=${encodeURIComponent(shopUrl)}`;
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copy your public shop link", shopUrl);
    }
  }
  return <section className="mt-6 grid gap-5 rounded-2xl border border-[#ece6f0] bg-white p-5 sm:grid-cols-[1fr_180px] sm:p-6"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#8b5bc7]">SHARE YOUR SHOP</p><h2 className="mt-2 text-2xl">Your public link</h2><p className="mt-2 break-all text-sm text-[#625b68]">{shopUrl}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-full bg-[#55239a] px-4 py-2.5 text-sm font-semibold text-white"><Copy size={15}/>{copied ? "Copied" : "Copy link"}</button><a href={shopUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#d9cce7] px-4 py-2.5 text-sm font-semibold text-[#55239a]">Open shop <ExternalLink size={14}/></a></div><p className="mt-3 text-xs leading-5 text-[#817888]">Add this link to your WhatsApp, Instagram, or Snapchat bio. Visitors can browse without an account.</p></div><div className="mx-auto text-center"><img src={qrUrl} alt={`QR code for ${shopName}`} width="160" height="160" className="aspect-square w-40 rounded-xl border border-[#ece6f0]"/><a href={qrUrl} download={`${slug}-qr.svg`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-[#55239a] underline">Open / save QR code</a></div></section>;
}
