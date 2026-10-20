"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function SizeGuideModal() {
  const [open, setOpen] = useState(false);

  return <>
    <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-[#55239A] underline underline-offset-4">Sizing help</button>
    {open && typeof document !== "undefined" && createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="fit-help-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-4 flex items-start justify-between gap-4"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">A better fit</p><h2 id="fit-help-title" className="font-[family-name:var(--font-playfair)] text-2xl">Sizing help</h2></div><button type="button" onClick={() => setOpen(false)} aria-label="Close sizing help" className="rounded-full p-2 hover:bg-[#F5F1F8]"><X size={19} /></button></div>
          <p className="text-sm leading-6 text-[#625B68]">Sizing can vary by style and brand. Each product’s available sizes are shown on its page. If you’re between sizes or would like garment measurements, message Charwin before ordering and we’ll help you choose.</p>
          <button type="button" onClick={() => setOpen(false)} className="mt-6 w-full rounded-full bg-[#55239A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#35115F]">Got it</button>
        </section>
      </div>,
      document.body,
    )}
  </>;
}
