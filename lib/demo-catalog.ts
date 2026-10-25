import type { CatalogProduct, CatalogShop } from "@/lib/catalog-types";

const photo = (id: string, width = 1000) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const DEMO_SHOPS: CatalogShop[] = [
  {
    id: "demo-queens-collection",
    name: "Queen's Collection",
    slug: "queens-collection",
    bio: "Easy-to-wear dresses and polished everyday pieces, chosen for confidence and comfort.",
    location: "Accra, Greater Accra",
    whatsappNumber: "233240000000",
    logoUrl: null,
    bannerUrl: null,
    instagramUrl: null,
    snapchatUrl: null,
    tiktokUrl: null,
    facebookUrl: null,
    websiteUrl: null,
    acceptsMobileMoney: true,
    acceptsCashOnDelivery: true,
    isFeatured: true,
  },
  {
    id: "demo-ahenfie-streetwear",
    name: "Ahenfie Streetwear",
    slug: "ahenfie-streetwear",
    bio: "Relaxed Ghana-inspired streetwear for campus, weekends, and the city.",
    location: "Kumasi, Ashanti Region",
    whatsappNumber: "233240000001",
    logoUrl: null,
    bannerUrl: null,
    instagramUrl: null,
    snapchatUrl: null,
    tiktokUrl: null,
    facebookUrl: null,
    websiteUrl: null,
    acceptsMobileMoney: true,
    acceptsCashOnDelivery: false,
    isFeatured: true,
  },
];

let demoProductAge = 0;
const clothing = { id: "demo-clothing", name: "Clothing", slug: "clothing", department: "clothing" as const };
const underwear = { id: "demo-underwear", name: "Underwear", slug: "underwear", department: "underwear" as const };
const bags = { id: "demo-bags", name: "Bags", slug: "bags", department: "bags" as const };
const shoes = { id: "demo-shoes", name: "Shoes", slug: "shoes", department: "shoes" as const };

type DemoCategory = typeof clothing | typeof underwear | typeof bags | typeof shoes;

function product(input: {
  slug: string;
  name: string;
  description: string;
  category: DemoCategory;
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
  shop?: CatalogShop;
}): CatalogProduct {
  const availableStock = input.stock ?? 4;
  const sizes = input.category.department === "shoes"
    ? ["38", "39", "40", "41", "42", "43"]
    : input.category.department === "bags"
    ? ["Standard"]
    : ["S", "M", "L", "XL"];

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
    variants: sizes.map((size, index) => ({
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
    shop: input.shop ?? (demoProductAge % 2 === 0 ? DEMO_SHOPS[0] : DEMO_SHOPS[1]),
  };
}

export const DEMO_PRODUCTS: CatalogProduct[] = [
  // Clothing - Dresses
  product({ slug: "aster-floral-midi-dress", name: "Aster Floral Midi Dress", description: "A breezy floral midi for brunch, birthdays and bright days out.", category: clothing, subcategory: "Dresses", brand: "Charwin Edit", price: 285, compareAtPrice: 340, gender: "women", color: "Lilac Floral", style: "romantic", sleeveLength: "short", photos: ["photo-1496747611176-843222e1e57c", "photo-1539008835657-9e8e9680c956"], tags: ["New Arrival", "Popular"], featured: true }),
  product({ slug: "amethyst-wrap-maxi-dress", name: "Amethyst Wrap Maxi Dress", description: "A flowing wrap silhouette with a softly defined waist and an easy, elegant drape.", category: clothing, subcategory: "Dresses", brand: "Charwin Edit", price: 420, compareAtPrice: 480, gender: "women", color: "Violet", style: "occasion", sleeveLength: "sleeveless", photos: ["photo-1595777457583-95e059d581b8", "photo-1566174053879-31528523f8ae"], tags: ["New Arrival", "Christmas"], featured: true }),
  
  // Clothing - Shirts & Tops
  product({ slug: "soft-linen-shirt", name: "Soft Linen Shirt", description: "A relaxed linen button-up designed for warm weather and easy layering.", category: clothing, subcategory: "Shirts", brand: "Everyday", price: 245, gender: "unisex", color: "Natural", style: "casual", sleeveLength: "long", photos: ["photo-1598033129183-c4f50c736f10", "photo-1603252110481-7ba873bf42ab"], tags: ["Everyday"] }),
  product({ slug: "classic-pique-polo", name: "Classic Piqué Polo", description: "A clean cotton piqué polo with a ribbed collar and a timeless fit.", category: clothing, subcategory: "Polos", brand: "Lacoste", price: 680, gender: "men", color: "White", style: "classic", sleeveLength: "short", photos: ["photo-1625910513413-5fc45e21c8d4", "photo-1627225924765-552d49cf47ad"], tags: ["Popular"] }),
  product({ slug: "everyday-cotton-t-shirt", name: "Everyday Cotton T-shirt", description: "A soft midweight cotton tee with a comfortable everyday cut.", category: clothing, subcategory: "T-shirts", brand: "Everyday", price: 155, gender: "unisex", color: "Black", style: "casual", sleeveLength: "short", photos: ["photo-1521572163474-6864f9cf17ab", "photo-1503342217505-b0a15ec3261c"], tags: ["Popular"] }),
  
  // Clothing - Bottoms & Outerwear
  product({ slug: "weekend-tailored-shorts", name: "Weekend Tailored Shorts", description: "Smart, breathable shorts with a relaxed leg and an easy adjustable waist.", category: clothing, subcategory: "Shorts", brand: "Charwin Edit", price: 210, compareAtPrice: 250, gender: "men", color: "Navy", style: "casual", photos: ["photo-1591195853828-11db59a44f6b", "photo-1562183241-b937e95585b6"], tags: ["Everyday"] }),
  product({ slug: "straight-leg-trousers", name: "Straight Leg Trousers", description: "Versatile straight leg trousers with a clean finish for work or weekends.", category: clothing, subcategory: "Trousers", brand: "Everyday", price: 325, gender: "women", color: "Black", style: "smart casual", photos: ["photo-1506629905607-d9a9d4fca6bb", "photo-1551854838-212c50b4c184"], tags: ["Everyday"] }),
  product({ slug: "weekend-layer-jacket", name: "Weekend Layer Jacket", description: "A light outer layer with practical pockets and an easy relaxed shape.", category: clothing, subcategory: "Jackets", brand: "Charwin Edit", price: 520, compareAtPrice: 590, gender: "unisex", color: "Olive", style: "casual", sleeveLength: "long", photos: ["photo-1551028719-00167b16eac5", "photo-1544923246-77307dd654cb"], tags: ["Christmas"], featured: true }),
  
  // Underwear
  product({ slug: "cotton-stretch-boxer-briefs", name: "Cotton Stretch Boxer Briefs", description: "A breathable cotton stretch boxer brief with a soft, supportive waistband.", category: underwear, subcategory: "Boxers", brand: "Everyday", price: 120, gender: "men", color: "Black", style: "everyday", photos: ["photo-1618354691373-d851c5c3a990", "photo-1620799140408-edc6dcb6d633"], tags: ["Popular"], discreetImage: true }),
  product({ slug: "ribbed-cotton-singlet", name: "Ribbed Cotton Singlet", description: "A soft ribbed cotton singlet for layering, lounging or warm days.", category: underwear, subcategory: "Singlets", brand: "Everyday", price: 80, gender: "unisex", color: "White", style: "everyday", sleeveLength: "sleeveless", photos: ["photo-1627225924765-552d49cf47ad", "photo-1618354691229-88d47f285158"], tags: ["Everyday"], discreetImage: true }),
  product({ slug: "everyday-cotton-briefs", name: "Everyday Cotton Briefs", description: "A comfortable cotton brief with a smooth finish and gentle stretch.", category: underwear, subcategory: "Briefs", brand: "Everyday", price: 95, gender: "women", color: "Black", style: "everyday", photos: ["photo-1583743814966-8936f37f4678", "photo-1618354691373-d851c5c3a990"], tags: ["Everyday"], discreetImage: true }),
  product({ slug: "satin-floral-sleep-set", name: "Satin Floral Sleep Set", description: "A matching satin sleep set with a soft floral print and a relaxed fit.", category: underwear, subcategory: "Sleepwear", brand: "Charwin Edit", price: 240, compareAtPrice: 285, gender: "women", color: "Blush Floral", style: "loungewear", sleeveLength: "short", photos: ["photo-1618354691229-88d47f285158", "photo-1583743814966-8936f37f4678"], tags: ["New Arrival", "Christmas"], discreetImage: true, featured: true }),

  // Bags
  product({ slug: "classic-leather-tote-bag", name: "Classic Leather Tote Bag", description: "A spacious structured leather tote made to carry your day with timeless style.", category: bags, subcategory: "Totes", brand: "Charwin Edit", price: 460, compareAtPrice: 520, gender: "women", color: "Tan", style: "classic", photos: ["photo-1548036328-c9fa89d128fa", "photo-1594223274512-ad4803739b7c"], tags: ["New Arrival", "Popular"], featured: true }),
  product({ slug: "compact-crossbody-bag", name: "Compact Crossbody Bag", description: "A structured camera-style crossbody bag with an adjustable webbing strap.", category: bags, subcategory: "Handbags", brand: "Charwin Edit", price: 340, gender: "unisex", color: "Black", style: "minimal", photos: ["photo-1590874103328-eac38a683ce7"], tags: ["Everyday"] }),
  product({ slug: "woven-artisan-handbag", name: "Woven Artisan Handbag", description: "A handcrafted woven everyday handbag with smooth bamboo top handles.", category: bags, subcategory: "Handbags", brand: "Charwin Edit", price: 380, compareAtPrice: 440, gender: "women", color: "Natural", style: "bohemian", photos: ["photo-1584917865442-de89df76afd3"], tags: ["Popular"] }),

  // Shoes
  product({ slug: "minimalist-court-sneakers", name: "Minimalist Court Sneakers", description: "Low-top leather sneakers with clean stitch lines and a cushioned insole.", category: shoes, subcategory: "Sneakers", brand: "Everyday", price: 490, compareAtPrice: 560, gender: "unisex", color: "White", style: "minimal", photos: ["photo-1549298916-b41d501d3772"], tags: ["Popular", "New Arrival"], featured: true }),
  product({ slug: "retro-runner-trainers", name: "Retro Runner Trainers", description: "Lightweight lifestyle trainers featuring suede overlays and vintage runner silhouette.", category: shoes, subcategory: "Sneakers", brand: "Everyday", price: 540, gender: "men", color: "Grey Multi", style: "sporty", photos: ["photo-1560769629-975ec94e6a86"], tags: ["New Arrival"] }),
  product({ slug: "woven-leather-slide-sandals", name: "Woven Leather Slide Sandals", description: "Effortless slide sandals crafted with supple woven leather bands.", category: shoes, subcategory: "Sandals", brand: "Charwin Edit", price: 295, compareAtPrice: 350, gender: "women", color: "Caramel", style: "casual", photos: ["photo-1603808033192-082d6919d3e1"], tags: ["Everyday"] }),
  product({ slug: "block-heel-strap-sandals", name: "Block Heel Strap Sandals", description: "Mid-height block heel sandals with delicate ankle straps for evening celebrations.", category: shoes, subcategory: "Sandals", brand: "Charwin Edit", price: 410, gender: "women", color: "Nude", style: "occasion", photos: ["photo-1543163521-1bf539c55dd2"], tags: ["Christmas"] }),
];
