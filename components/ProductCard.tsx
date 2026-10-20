import Image from "next/image";
import Link from "next/link";
import { Category } from "@prisma/client";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  colour: string;
  category: Category;
  images: { url: string; altText: string }[];
  variants: { size: string; stock: number }[];
}

const COLOUR_MAP: Record<string, string> = {
  "Blush Pink": "#F2B5BD",
  "Black": "#17141C",
  "Ivory": "#FFFFF0",
  "Scarlet Red": "#FF2400",
  "White": "#FFFFFF",
  "Sage Green": "#87AE73",
  "Midnight Blue": "#191970",
  "Terracotta": "#E2725B",
  "Powder Blue": "#B0D0E8",
  "Rust": "#B7410E",
  "Forest Green": "#228B22",
  "Lilac": "#C8A2C8",
};

export default function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  colour,
  images,
  variants,
}: ProductCardProps) {
  const primaryImage = images[0];
  const secondaryImage = images[1];
  const availableSizes = variants.filter((v) => v.stock > 0).map((v) => v.size);
  const colourDot = COLOUR_MAP[colour] ?? "#E6E0EB";
  const discountPct =
    compareAtPrice && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : null;

  return (
    <Link href={`/shop/${slug}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#FCFBFD]">
        {primaryImage && (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText}
            fill
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {secondaryImage && (
          <Image
            src={secondaryImage.url}
            alt={secondaryImage.altText}
            fill
            sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw, 25vw"
            className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}
        {discountPct && (
          <span className="absolute top-3 left-3 bg-[#55239A] text-white text-xs font-semibold px-2 py-1 rounded-full">
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 space-y-1">
        <p className="text-sm text-[#17141C] font-medium leading-snug group-hover:text-[#55239A] transition-colors">
          {name}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#17141C]">£{price.toFixed(2)}</span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-xs text-[#625B68] line-through">£{compareAtPrice.toFixed(2)}</span>
          )}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span
            className="w-3.5 h-3.5 rounded-full border border-[#E6E0EB] flex-shrink-0"
            style={{ backgroundColor: colourDot }}
            title={colour}
          />
          <div className="flex flex-wrap gap-1">
            {availableSizes.slice(0, 4).map((size) => (
              <span key={size} className="text-[10px] text-[#625B68] border border-[#E6E0EB] px-1.5 py-0.5 rounded">
                {size.replace("UK ", "")}
              </span>
            ))}
            {availableSizes.length > 4 && (
              <span className="text-[10px] text-[#625B68]">+{availableSizes.length - 4}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
