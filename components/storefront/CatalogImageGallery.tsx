"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { CatalogImage } from "@/lib/catalog-types";
import DiscreetImage from "@/components/storefront/DiscreetImage";

export default function CatalogImageGallery({ images, productName, discreet = false }: { images: CatalogImage[]; productName: string; discreet?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(!discreet);
  const active = images[activeIndex];
  const move = (direction: number) => setActiveIndex((index) => (index + direction + images.length) % images.length);

  useEffect(() => {
    if (discreet) setAdultConfirmed(window.localStorage.getItem("charwin-adult-confirmed") === "true");
  }, [discreet]);

  return <div>
    <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-[#F3F0F5] sm:rounded-[1.8rem]">
      {active ? <div className="absolute inset-0 block h-full w-full cursor-zoom-in" onClick={() => { if (!discreet || adultConfirmed) setZoomed(true); }}><DiscreetImage src={active.url} alt={active.altText || productName} sizes="(max-width:768px) 100vw,50vw" priority discreet={discreet} onRevealed={() => setAdultConfirmed(true)} /></div> : <div className="flex h-full items-center justify-center text-sm text-[#8B8490]">Product image coming soon</div>}
      {images.length > 1 && <>
        <button onClick={() => move(-1)} aria-label="Previous product image" className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"><ChevronLeft size={19} /></button>
        <button onClick={() => move(1)} aria-label="Next product image" className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"><ChevronRight size={19} /></button>
      </>}
      {(!discreet || adultConfirmed) && <button onClick={() => setZoomed(true)} className="absolute bottom-4 right-4 z-20 rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium text-[#625B68]">Tap to zoom</button>}
    </div>
    {images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
      {images.map((image, index) => <button key={image.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`View image ${index + 1}`} aria-pressed={activeIndex === index} className={`relative h-[76px] w-[62px] shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition ${index === activeIndex ? "border-[#55239A]" : "border-transparent"}`}>
        <Image src={image.url} alt="" fill sizes="62px" className={`object-cover ${discreet && !adultConfirmed ? "blur-md" : ""}`} />
      </button>)}
    </div>}
    {zoomed && active && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`Zoomed image: ${productName}`} onClick={() => setZoomed(false)}>
      <button onClick={() => setZoomed(false)} aria-label="Close zoom" className="absolute right-5 top-5 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"><X size={22} /></button>
      <Image src={active.url} alt={active.altText || productName} fill sizes="100vw" className="object-contain" />
      {images.length > 1 && <><button onClick={(event) => { event.stopPropagation(); move(-1); }} aria-label="Previous image" className="absolute left-5 rounded-full bg-white/10 p-3 text-white"><ChevronLeft size={24} /></button><button onClick={(event) => { event.stopPropagation(); move(1); }} aria-label="Next image" className="absolute right-5 rounded-full bg-white/10 p-3 text-white"><ChevronRight size={24} /></button></>}
    </div>}
  </div>;
}
