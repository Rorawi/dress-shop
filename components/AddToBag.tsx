"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/cart";
import SizeGuideModal from "./SizeGuideModal";

interface Variant {
  id: string;
  size: string;
  color?: string;
  stock: number;
}

interface AddToBagProps {
  productId: string;
  productName: string;
  productSlug: string;
  price: number;
  image: string;
  variants: Variant[];
}

export default function AddToBag({
  productId,
  productName,
  productSlug,
  price,
  image,
  variants,
}: AddToBagProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const { addItem } = useCartStore();

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  const handleAdd = () => {
    if (!selectedVariant) return;
    addItem({
      productId,
      variantId: selectedVariant.id,
      name: productName,
      slug: productSlug,
      size: selectedVariant.size,
      color: selectedVariant.color ?? "Default",
      price,
      image,
      stock: selectedVariant.stock,
      discreetImage: false,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Size selector */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[#17141C]">Select Size</span>
          <SizeGuideModal />
        </div>
        <div className="flex flex-wrap gap-2">
          {variants.map((v) => {
            const outOfStock = v.stock === 0;
            const selected = v.id === selectedVariantId;
            return (
              <button
                key={v.id}
                onClick={() => !outOfStock && setSelectedVariantId(v.id)}
                disabled={outOfStock}
                className={`px-4 py-2 text-sm border rounded-lg transition-all ${
                  outOfStock
                    ? "border-[#E6E0EB] text-[#E6E0EB] cursor-not-allowed line-through"
                    : selected
                    ? "bg-[#17141C] text-white border-[#17141C]"
                    : "border-[#E6E0EB] text-[#17141C] hover:border-[#55239A] hover:text-[#55239A]"
                }`}
                aria-label={`Size ${v.size}${outOfStock ? " - out of stock" : ""}`}
              >
                {v.size}
              </button>
            );
          })}
        </div>
        {selectedVariant && (
          <p className="text-xs text-[#625B68] mt-2">
            {selectedVariant.stock <= 3
              ? `Only ${selectedVariant.stock} left in stock!`
              : `${selectedVariant.stock} in stock`}
          </p>
        )}
      </div>

      {/* Add to bag */}
      <button
        onClick={handleAdd}
        disabled={!selectedVariant}
        className={`w-full py-4 rounded-full text-sm font-semibold transition-all ${
          added
            ? "bg-green-600 text-white"
            : selectedVariant
            ? "bg-[#55239A] text-white hover:bg-[#35115F]"
            : "bg-[#E6E0EB] text-[#625B68] cursor-not-allowed"
        }`}
      >
        {added ? "✓ Added to Bag" : !selectedVariant ? "Select a Size" : "Add to Bag"}
      </button>
    </div>
  );
}
