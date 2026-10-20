"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = ["CASUAL", "FORMAL", "WEDDING", "PARTY", "MAXI", "MINI", "MIDI"];
const SIZES = ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18"];
const COLOURS = [
  { label: "Black", value: "Black", hex: "#17141C" },
  { label: "White", value: "White", hex: "#F5F5F5" },
  { label: "Blush Pink", value: "Blush", hex: "#F2B5BD" },
  { label: "Ivory", value: "Ivory", hex: "#FFFFF0" },
  { label: "Scarlet", value: "Scarlet", hex: "#FF2400" },
  { label: "Sage Green", value: "Sage", hex: "#87AE73" },
  { label: "Midnight Blue", value: "Midnight", hex: "#191970" },
  { label: "Lilac", value: "Lilac", hex: "#C8A2C8" },
];

export default function ShopFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("page");
      if (value) {
        sp.set(key, value);
      } else {
        sp.delete(key);
      }
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = () => {
    router.push(pathname);
  };

  const activeCategory = searchParams.get("category");
  const activeColour = searchParams.get("colour");
  const activeSize = searchParams.get("size");
  const activeSort = searchParams.get("sort");
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";

  const hasFilters = activeCategory || activeColour || activeSize || minPrice || maxPrice;

  const filterContent = (
    <div className="space-y-7">
      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-[#17141C] mb-3">Sort By</h3>
        <select
          value={activeSort ?? ""}
          onChange={(e) => updateParam("sort", e.target.value || null)}
          className="w-full border border-[#E6E0EB] rounded-lg px-3 py-2 text-sm text-[#17141C] focus:outline-none focus:border-[#55239A]"
        >
          <option value="">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-[#17141C] mb-3">Category</h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={activeCategory === cat}
                onChange={() => updateParam("category", activeCategory === cat ? null : cat)}
                className="accent-[#55239A]"
              />
              <span className="text-sm text-[#625B68] group-hover:text-[#17141C] transition-colors">
                {cat.charAt(0) + cat.slice(1).toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Colour */}
      <div>
        <h3 className="text-sm font-semibold text-[#17141C] mb-3">Colour</h3>
        <div className="flex flex-wrap gap-2">
          {COLOURS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => updateParam("colour", activeColour === c.value ? null : c.value)}
              className={`w-7 h-7 rounded-full border-2 transition-all ${
                activeColour === c.value ? "border-[#55239A] scale-110" : "border-[#E6E0EB]"
              }`}
              style={{ backgroundColor: c.hex }}
              aria-label={c.label}
            />
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-sm font-semibold text-[#17141C] mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => updateParam("size", activeSize === s ? null : s)}
              className={`px-3 py-1.5 text-xs font-medium border rounded transition-colors ${
                activeSize === s
                  ? "bg-[#55239A] text-white border-[#55239A]"
                  : "border-[#E6E0EB] text-[#625B68] hover:border-[#55239A] hover:text-[#55239A]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-sm font-semibold text-[#17141C] mb-3">Price Range</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min £"
            value={minPrice}
            min={0}
            onChange={(e) => updateParam("minPrice", e.target.value || null)}
            className="w-full border border-[#E6E0EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#55239A]"
          />
          <span className="text-[#625B68]">–</span>
          <input
            type="number"
            placeholder="Max £"
            value={maxPrice}
            min={0}
            onChange={(e) => updateParam("maxPrice", e.target.value || null)}
            className="w-full border border-[#E6E0EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#55239A]"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-2 text-sm text-[#55239A] hover:underline"
        >
          <X size={14} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center gap-2 border border-[#E6E0EB] px-4 py-2 rounded-full text-sm text-[#17141C] mb-4"
      >
        <SlidersHorizontal size={16} /> Filters
        {hasFilters && <span className="bg-[#55239A] text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">!</span>}
      </button>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Filters</h2>
              <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
            </div>
            {filterContent}
            <button
              onClick={() => setMobileOpen(false)}
              className="mt-6 w-full bg-[#55239A] text-white py-3 rounded-full font-medium"
            >
              Apply Filters
            </button>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-24">{filterContent}</div>
    </>
  );
}
