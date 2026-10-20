import type { CatalogProduct } from "@/lib/catalog-types";

const photo = (id: string, width = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

let demoProductAge = 0;
const clothing = { id: "demo-clothing", name: "Clothing", slug: "clothing", department: "clothing" as const };
const underwear = { id: "demo-underwear", name: "Underwear", slug: "underwear", department: "underwear" as const };

function product(input: {
  slug: string;
  name: string;
  description: string;
  category: typeof clothing | typeof underwear;
  subcategory: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  gender: CatalogProduct["gender"];
  color: string;
  style: string;
  sleeveLength?: string;
  photos: string[];
  tags?: string[];
  discreetImage?: boolean;
  featured?: boolean;
  stock?: number;
}): CatalogProduct {
  const availableStock = input.stock ?? 4;
  return {
    id: `demo-${input.slug}`,
    name: input.name,
    slug: input.slug,
    description: input.description,
    brand: { name: input.brand, slug: input.brand.toLowerCase().replaceAll(" ", "-") },
    category: input.category,
    subcategory: { name: input.subcategory, slug: input.subcategory.toLowerCase().replaceAll(" ", "-") },
    gender: input.gender,
    sleeveLength: input.sleeveLength ?? null,
    style: input.style,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    images: input.photos.map((id, index) => ({
      id: `${input.slug}-image-${index + 1}`,
      url: photo(id),
      altText: `${input.name} — view ${index + 1}`,
      position: index,
    })),
    variants: ["S", "M", "L", "XL"].map((size, index) => ({
      id: `${input.slug}-${input.color.toLowerCase().replaceAll(" ", "-")}-${size.toLowerCase()}`,
      size,
      color: input.color,
      stock: Math.max(0, availableStock - (availableStock > 0 ? index % 2 : 0)),
    })),
    tags: (input.tags ?? []).map((name) => ({
      name,
      slug: name.toLowerCase().replaceAll(" ", "-"),
      kind: name === "Christmas" ? "seasonal" : "collection",
    })),
    isFeatured: input.featured ?? false,
    discreetImage: input.discreetImage ?? false,
    createdAt: new Date(Date.now() - demoProductAge++ * 86400000).toISOString(),
  };
}

export const DEMO_PRODUCTS: CatalogProduct[] = [
  product({ slug: "aster-floral-midi-dress", name: "Aster Floral Midi Dress", description: "A breezy floral midi for brunch, birthdays and bright days out.", category: clothing, subcategory: "Dresses", brand: "Charwin Edit", price: 285, compareAtPrice: 340, gender: "women", color: "Lilac Floral", style: "romantic", sleeveLength: "short", photos: ["photo-1496747611176-843222e1e57c", "photo-1539008835657-9e8e9680c956"], tags: ["New Arrival", "Popular"], featured: true }),
  product({ slug: "amethyst-wrap-maxi-dress", name: "Amethyst Wrap Maxi Dress", description: "A flowing wrap silhouette with a softly defined waist and an easy, elegant drape.", category: clothing, subcategory: "Dresses", brand: "Charwin Edit", price: 420, compareAtPrice: 480, gender: "women", color: "Violet", style: "occasion", sleeveLength: "sleeveless", photos: ["photo-1595777457583-95e059d581b8", "photo-1566174053879-31528523f8ae"], tags: ["New Arrival", "Christmas"], featured: true }),
  product({ slug: "soft-linen-shirt", name: "Soft Linen Shirt", description: "A relaxed linen button-up designed for warm weather and easy layering.", category: clothing, subcategory: "Shirts", brand: "Everyday", price: 245, gender: "unisex", color: "Natural", style: "casual", sleeveLength: "long", photos: ["photo-1598033129183-c4f50c736f10", "photo-1603252110481-7ba873bf42ab"], tags: ["Everyday"] }),
  product({ slug: "classic-pique-polo", name: "Classic Piqué Polo", description: "A clean cotton piqué polo with a ribbed collar and a timeless fit.", category: clothing, subcategory: "Polos", brand: "Lacoste", price: 680, gender: "men", color: "White", style: "classic", sleeveLength: "short", photos: ["photo-1625910513413-5fc45e21c8d4", "photo-1627225924765-552d49cf47ad"], tags: ["Popular"] }),
  product({ slug: "everyday-cotton-t-shirt", name: "Everyday Cotton T-shirt", description: "A soft midweight cotton tee with a comfortable everyday cut.", category: clothing, subcategory: "T-shirts", brand: "Everyday", price: 155, gender: "unisex", color: "Black", style: "casual", sleeveLength: "short", photos: ["photo-1521572163474-6864f9cf17ab", "photo-1503342217505-b0a15ec3261c"], tags: ["Popular"] }),
  product({ slug: "weekend-tailored-shorts", name: "Weekend Tailored Shorts", description: "Smart, breathable shorts with a relaxed leg and an easy adjustable waist.", category: clothing, subcategory: "Shorts", brand: "Charwin Edit", price: 210, compareAtPrice: 250, gender: "men", color: "Navy", style: "casual", photos: ["photo-1591195853828-11db59a44f6b", "photo-1562183241-b937e95585b6"], tags: ["Everyday"] }),
  product({ slug: "straight-leg-trousers", name: "Straight Leg Trousers", description: "Versatile straight leg trousers with a clean finish for work or weekends.", category: clothing, subcategory: "Trousers", brand: "Everyday", price: 325, gender: "women", color: "Black", style: "smart casual", photos: ["photo-1506629905607-d9a9d4fca6bb", "photo-1551854838-212c50b4c184"], tags: ["Everyday"] }),
  product({ slug: "weekend-layer-jacket", name: "Weekend Layer Jacket", description: "A light outer layer with practical pockets and an easy relaxed shape.", category: clothing, subcategory: "Jackets", brand: "Charwin Edit", price: 520, compareAtPrice: 590, gender: "unisex", color: "Olive", style: "casual", sleeveLength: "long", photos: ["photo-1551028719-00167b16eac5", "photo-1544923246-77307dd654cb"], tags: ["Christmas"], featured: true }),
  product({ slug: "cotton-stretch-boxer-briefs", name: "Cotton Stretch Boxer Briefs", description: "A breathable cotton stretch boxer brief with a soft, supportive waistband.", category: underwear, subcategory: "Boxers", brand: "Everyday", price: 120, gender: "men", color: "Black", style: "everyday", photos: ["photo-1618354691373-d851c5c3a990", "photo-1620799140408-edc6dcb6d633"], tags: ["Popular"], discreetImage: true }),
  product({ slug: "ribbed-cotton-singlet", name: "Ribbed Cotton Singlet", description: "A soft ribbed cotton singlet for layering, lounging or warm days.", category: underwear, subcategory: "Singlets", brand: "Everyday", price: 80, gender: "unisex", color: "White", style: "everyday", sleeveLength: "sleeveless", photos: ["photo-1627225924765-552d49cf47ad", "photo-1618354691229-88d47f285158"], tags: ["Everyday"], discreetImage: true }),
  product({ slug: "everyday-cotton-briefs", name: "Everyday Cotton Briefs", description: "A comfortable cotton brief with a smooth finish and gentle stretch.", category: underwear, subcategory: "Briefs", brand: "Everyday", price: 95, gender: "women", color: "Black", style: "everyday", photos: ["photo-1583743814966-8936f37f4678", "photo-1618354691373-d851c5c3a990"], tags: ["Everyday"], discreetImage: true }),
  product({ slug: "satin-floral-sleep-set", name: "Satin Floral Sleep Set", description: "A matching satin sleep set with a soft floral print and a relaxed fit.", category: underwear, subcategory: "Sleepwear", brand: "Charwin Edit", price: 240, compareAtPrice: 285, gender: "women", color: "Blush Floral", style: "loungewear", sleeveLength: "short", photos: ["photo-1618354691229-88d47f285158", "photo-1583743814966-8936f37f4678"], tags: ["New Arrival", "Christmas"], discreetImage: true, featured: true }),
];
