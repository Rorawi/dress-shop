"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

type CategorySlide = {
  slug: string;
  label: string;
  description: string;
  image: string;
  tag?: string;
  department?: string;
  gender?: string;
};

const AUTO_ADVANCE_MS = 5_200;

function getCategoryHref(category: CategorySlide) {
  const params = new URLSearchParams();
  if (category.tag) params.set("tag", category.tag);
  else if (category.department) params.set("department", category.department);
  else if (category.gender) params.set("gender", category.gender);
  else params.set("category", category.slug);
  return `/shop?${params.toString()}`;
}

export default function CategorySlider({ categories }: { categories: CategorySlide[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointerInsideRef = useRef(false);
  const focusInsideRef = useRef(false);
  const manualPauseUntilRef = useRef(0);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || categories.length < 2) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const interval = window.setInterval(() => {
      if (
        pointerInsideRef.current ||
        focusInsideRef.current ||
        Date.now() < manualPauseUntilRef.current
      ) return;

      const firstCard = viewport.querySelector<HTMLElement>("[data-category-card]");
      if (!firstCard) return;

      const gap = Number.parseFloat(window.getComputedStyle(viewport).columnGap) || 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      const maxScroll = viewport.scrollWidth - viewport.clientWidth;
      if (maxScroll <= 0) return;

      if (viewport.scrollLeft >= maxScroll - 4) {
        viewport.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        viewport.scrollTo({ left: Math.min(maxScroll, viewport.scrollLeft + step), behavior: "smooth" });
      }
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(interval);
  }, [categories.length]);

  const scrollOneCard = (direction: -1 | 1) => {
    const viewport = viewportRef.current;
    const firstCard = viewport?.querySelector<HTMLElement>("[data-category-card]");
    if (!viewport || !firstCard) return;

    manualPauseUntilRef.current = Date.now() + AUTO_ADVANCE_MS;
    const gap = Number.parseFloat(window.getComputedStyle(viewport).columnGap) || 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (direction > 0 && viewport.scrollLeft >= maxScroll - 4) {
      viewport.scrollTo({ left: 0, behavior: "smooth" });
    } else if (direction < 0 && viewport.scrollLeft <= 4) {
      viewport.scrollTo({ left: maxScroll, behavior: "smooth" });
    } else {
      viewport.scrollTo({ left: Math.max(0, Math.min(maxScroll, viewport.scrollLeft + step * direction)), behavior: "smooth" });
    }
  };

  return (
    <div
      onPointerEnter={() => { pointerInsideRef.current = true; }}
      onPointerLeave={() => { pointerInsideRef.current = false; }}
      onPointerDown={() => { manualPauseUntilRef.current = Date.now() + AUTO_ADVANCE_MS; }}
      onWheel={() => { manualPauseUntilRef.current = Date.now() + AUTO_ADVANCE_MS; }}
      onFocusCapture={() => { focusInsideRef.current = true; }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          focusInsideRef.current = false;
        }
      }}
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[#8B5BC7]">Explore by edit</p>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-medium sm:text-4xl">Find your kind of style</h2>
          <p className="mt-2 text-sm text-[#625B68]">Everyday essentials and fresh finds for everyone.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href="/shop" className="mr-2 hidden items-center gap-2 text-xs font-semibold text-[#55239A] md:inline-flex">See everything <ArrowRight size={14} /></Link>
          <button
            type="button"
            aria-label="Previous categories"
            onClick={() => scrollOneCard(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E6E0EB] bg-white text-[#35115F] transition hover:border-[#55239A] hover:bg-[#F8F5FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55239A] sm:h-11 sm:w-11"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Next categories"
            onClick={() => scrollOneCard(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E6E0EB] bg-white text-[#35115F] transition hover:border-[#55239A] hover:bg-[#F8F5FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#55239A] sm:h-11 sm:w-11"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          ref={viewportRef}
          role="region"
          aria-label="Shop by category"
          tabIndex={0}
          className="category-slider-viewport flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 outline-none focus-visible:ring-2 focus-visible:ring-[#8B5BC7] focus-visible:ring-offset-4"
        >
          {categories.map((category) => (
            <Link
              key={category.slug}
              data-category-card
              href={getCategoryHref(category)}
              className="group relative aspect-[.94/1] min-w-0 flex-[0_0_78%] snap-start overflow-hidden rounded-3xl bg-[#E9E3EC] sm:flex-[0_0_47%] lg:flex-[0_0_29.5%]"
            >
              <Image
                src={`https://images.unsplash.com/${category.image}?auto=format&fit=crop&w=900&q=85`}
                alt=""
                fill
                sizes="(max-width: 640px) 78vw, (max-width: 1024px) 47vw, 29.5vw"
                className="object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                <p className="mb-2 text-[9px] font-semibold uppercase tracking-[.16em] text-white/75 sm:text-[10px]">
                  {category.description}
                </p>
                <div className="flex items-end justify-between gap-3">
                  <h3 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl">{category.label}</h3>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur transition group-hover:bg-white group-hover:text-[#55239A]">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
