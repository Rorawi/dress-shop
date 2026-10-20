import { PrismaClient, Category } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { WebSocket } from "ws";
import { neonConfig } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

// Required for Node.js environments
neonConfig.webSocketConstructor = WebSocket;

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });


const dresses = [
  {
    name: "Elara Floral Maxi Dress",
    slug: "elara-floral-maxi-dress",
    description:
      "A romantic floral maxi dress featuring delicate bloom prints on a flowing chiffon fabric. Perfect for garden parties and summer celebrations.",
    price: 89.99,
    compareAtPrice: 120.0,
    category: Category.MAXI,
    colour: "Blush Pink",
    fabric: "100% Chiffon",
    careInstructions: "Hand wash cold. Do not tumble dry. Iron on low heat.",
    isFeatured: true,
    images: [
      { url: "https://picsum.photos/seed/elara1/800/1000", altText: "Elara Floral Maxi Dress front view", position: 0 },
      { url: "https://picsum.photos/seed/elara2/800/1000", altText: "Elara Floral Maxi Dress side view", position: 1 },
    ],
  },
  {
    name: "Noir Wrap Midi Dress",
    slug: "noir-wrap-midi-dress",
    description:
      "A chic wrap midi in classic noir. The adjustable wrap waist flatters all figures while the midi length adds elegance.",
    price: 75.0,
    compareAtPrice: null,
    category: Category.MIDI,
    colour: "Black",
    fabric: "95% Viscose, 5% Elastane",
    careInstructions: "Machine wash at 30°C. Hang to dry.",
    isFeatured: true,
    images: [
      { url: "https://picsum.photos/seed/noir1/800/1000", altText: "Noir Wrap Midi Dress front", position: 0 },
      { url: "https://picsum.photos/seed/noir2/800/1000", altText: "Noir Wrap Midi Dress back", position: 1 },
    ],
  },
  {
    name: "Ivory Lace Bridal Mini",
    slug: "ivory-lace-bridal-mini",
    description:
      "Stunning ivory lace mini dress ideal for civil ceremonies or bridal parties. Features intricate floral lace overlay and scalloped hem.",
    price: 155.0,
    compareAtPrice: 190.0,
    category: Category.WEDDING,
    colour: "Ivory",
    fabric: "Lace overlay with satin lining",
    careInstructions: "Dry clean only.",
    isFeatured: true,
    images: [
      { url: "https://picsum.photos/seed/ivory1/800/1000", altText: "Ivory Lace Bridal Mini front", position: 0 },
      { url: "https://picsum.photos/seed/ivory2/800/1000", altText: "Ivory Lace Bridal Mini detail", position: 1 },
    ],
  },
  {
    name: "Scarlet Evening Gown",
    slug: "scarlet-evening-gown",
    description:
      "Make a bold statement in this floor-length scarlet gown. Features a daring thigh-high slit and structured bodice with subtle boning.",
    price: 175.0,
    compareAtPrice: 220.0,
    category: Category.FORMAL,
    colour: "Scarlet Red",
    fabric: "Duchess Satin",
    careInstructions: "Dry clean only. Store on padded hanger.",
    isFeatured: true,
    images: [
      { url: "https://picsum.photos/seed/scarlet1/800/1000", altText: "Scarlet Evening Gown front", position: 0 },
      { url: "https://picsum.photos/seed/scarlet2/800/1000", altText: "Scarlet Evening Gown side slit", position: 1 },
    ],
  },
  {
    name: "Daisy Broderie Mini",
    slug: "daisy-broderie-mini",
    description:
      "A playful white broderie anglaise mini dress with flutter sleeves. Light, airy, and perfect for sunny days out.",
    price: 55.0,
    compareAtPrice: 70.0,
    category: Category.MINI,
    colour: "White",
    fabric: "100% Cotton Broderie",
    careInstructions: "Machine wash at 30°C. Tumble dry low.",
    isFeatured: false,
    images: [
      { url: "https://picsum.photos/seed/daisy1/800/1000", altText: "Daisy Broderie Mini front", position: 0 },
      { url: "https://picsum.photos/seed/daisy2/800/1000", altText: "Daisy Broderie Mini back", position: 1 },
    ],
  },
  {
    name: "Sage Linen Shirt Dress",
    slug: "sage-linen-shirt-dress",
    description:
      "Effortless everyday style in sage green linen. Features a button-through front, belt loops, and a relaxed midi length.",
    price: 65.0,
    compareAtPrice: null,
    category: Category.CASUAL,
    colour: "Sage Green",
    fabric: "100% Linen",
    careInstructions: "Machine wash at 40°C. Iron while slightly damp.",
    isFeatured: false,
    images: [
      { url: "https://picsum.photos/seed/sage1/800/1000", altText: "Sage Linen Shirt Dress front", position: 0 },
      { url: "https://picsum.photos/seed/sage2/800/1000", altText: "Sage Linen Shirt Dress belted", position: 1 },
    ],
  },
  {
    name: "Midnight Sequin Party Dress",
    slug: "midnight-sequin-party-dress",
    description:
      "Turn heads at every party in this all-over sequin mini dress. Midnight blue with a plunging V-neckline and open back.",
    price: 110.0,
    compareAtPrice: 145.0,
    category: Category.PARTY,
    colour: "Midnight Blue",
    fabric: "Sequin mesh over jersey lining",
    careInstructions: "Hand wash cold. Lay flat to dry.",
    isFeatured: false,
    images: [
      { url: "https://picsum.photos/seed/midnight1/800/1000", altText: "Midnight Sequin Party Dress front", position: 0 },
      { url: "https://picsum.photos/seed/midnight2/800/1000", altText: "Midnight Sequin Party Dress open back", position: 1 },
    ],
  },
  {
    name: "Terracotta Smocked Maxi",
    slug: "terracotta-smocked-maxi",
    description:
      "Boho-chic smocked maxi dress in warm terracotta. Features an elasticated smocked bodice, tiered skirt, and adjustable straps.",
    price: 78.0,
    compareAtPrice: null,
    category: Category.MAXI,
    colour: "Terracotta",
    fabric: "100% Viscose",
    careInstructions: "Machine wash at 30°C. Do not tumble dry.",
    isFeatured: false,
    images: [
      { url: "https://picsum.photos/seed/terra1/800/1000", altText: "Terracotta Smocked Maxi front", position: 0 },
      { url: "https://picsum.photos/seed/terra2/800/1000", altText: "Terracotta Smocked Maxi detail", position: 1 },
    ],
  },
  {
    name: "Powder Blue Satin Slip",
    slug: "powder-blue-satin-slip",
    description:
      "Luxuriously smooth satin slip dress in powder blue. A minimalist design with adjustable spaghetti straps and a bias-cut silhouette.",
    price: 95.0,
    compareAtPrice: 125.0,
    category: Category.FORMAL,
    colour: "Powder Blue",
    fabric: "Polyester Satin",
    careInstructions: "Hand wash cold. Iron on low.",
    isFeatured: false,
    images: [
      { url: "https://picsum.photos/seed/powder1/800/1000", altText: "Powder Blue Satin Slip front", position: 0 },
      { url: "https://picsum.photos/seed/powder2/800/1000", altText: "Powder Blue Satin Slip draped", position: 1 },
    ],
  },
  {
    name: "Rust Ribbed Bodycon Midi",
    slug: "rust-ribbed-bodycon-midi",
    description:
      "A figure-hugging rust-coloured ribbed bodycon midi that moves with your every curve. Soft stretch knit for all-day comfort.",
    price: 58.0,
    compareAtPrice: 72.0,
    category: Category.MIDI,
    colour: "Rust",
    fabric: "92% Polyester, 8% Elastane Ribbed Knit",
    careInstructions: "Machine wash at 30°C. Reshape and dry flat.",
    isFeatured: false,
    images: [
      { url: "https://picsum.photos/seed/rust1/800/1000", altText: "Rust Ribbed Bodycon Midi front", position: 0 },
      { url: "https://picsum.photos/seed/rust2/800/1000", altText: "Rust Ribbed Bodycon Midi back", position: 1 },
    ],
  },
  {
    name: "Forest Velvet Wrap Gown",
    slug: "forest-velvet-wrap-gown",
    description:
      "Deep forest green velvet wrap gown with dramatic puffed sleeves and a flowing A-line skirt. The ultimate winter formal.",
    price: 165.0,
    compareAtPrice: 210.0,
    category: Category.FORMAL,
    colour: "Forest Green",
    fabric: "Stretch Velvet",
    careInstructions: "Dry clean recommended. Steam to remove creases.",
    isFeatured: false,
    images: [
      { url: "https://picsum.photos/seed/forest1/800/1000", altText: "Forest Velvet Wrap Gown front", position: 0 },
      { url: "https://picsum.photos/seed/forest2/800/1000", altText: "Forest Velvet Wrap Gown sleeves detail", position: 1 },
    ],
  },
  {
    name: "Lilac Floral Casual Skater",
    slug: "lilac-floral-casual-skater",
    description:
      "A fun and flirty lilac floral skater dress with a sweetheart neckline and flared skirt. Perfect for brunch or a summer date.",
    price: 45.0,
    compareAtPrice: null,
    category: Category.CASUAL,
    colour: "Lilac",
    fabric: "65% Cotton, 35% Polyester",
    careInstructions: "Machine wash at 30°C. Tumble dry low.",
    isFeatured: false,
    images: [
      { url: "https://picsum.photos/seed/lilac1/800/1000", altText: "Lilac Floral Casual Skater front", position: 0 },
      { url: "https://picsum.photos/seed/lilac2/800/1000", altText: "Lilac Floral Casual Skater spinning", position: 1 },
    ],
  },
];

const sizes = ["UK 6", "UK 8", "UK 10", "UK 12", "UK 14", "UK 16", "UK 18"];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      email: "admin@dressshop.com",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created (admin@dressshop.com / admin123)");

  // Seed products
  for (const dress of dresses) {
    const { images, ...productData } = dress;
    const product = await prisma.product.create({
      data: {
        ...productData,
        price: productData.price,
        compareAtPrice: productData.compareAtPrice ?? undefined,
        images: {
          create: images,
        },
        variants: {
          create: sizes.map((size) => ({
            size,
            stock: Math.floor(Math.random() * 8) + 1,
          })),
        },
      },
    });
    console.log(`✅ Created: ${product.name}`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
