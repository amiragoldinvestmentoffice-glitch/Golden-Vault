import "dotenv/config";
import { db } from "./db";
import { products } from "./db/schema";

const seedProducts = [
  {
    name: "1oz Gold Bar – PAMP Suisse",
    description: "Iconic PAMP Suisse Lady Fortuna 1 troy oz gold bar. Finest Swiss craftsmanship with assay certificate.",
    priceUsd: "3345.00",
    weightGrams: "31.103",
    purity: "999.9",
    category: "bar",
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400",
  },
  {
    name: "100g Gold Bar – Valcambi",
    description: "Valcambi 100 gram gold bar with unique serial number and assay card. Investment-grade purity.",
    priceUsd: "10850.00",
    weightGrams: "100.000",
    purity: "999.9",
    category: "bar",
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400",
  },
  {
    name: "10oz Gold Bar – Credit Suisse",
    description: "Credit Suisse 10 troy oz gold bar. Secure, liquid and universally recognized.",
    priceUsd: "33450.00",
    weightGrams: "311.035",
    purity: "999.9",
    category: "bar",
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400",
  },
  {
    name: "American Gold Eagle 1oz Coin",
    description: "Official U.S. Mint gold bullion coin. Legal tender, 91.67% gold with copper and silver alloy for durability.",
    priceUsd: "3420.00",
    weightGrams: "33.931",
    purity: "916.7",
    category: "coin",
    stock: 75,
    imageUrl: "https://images.unsplash.com/photo-1621870410898-bf20fc02aa3d?w=400",
  },
  {
    name: "Canadian Maple Leaf 1oz Coin",
    description: "Royal Canadian Mint flagship coin. World-renowned for its iconic maple leaf design and 24-karat purity.",
    priceUsd: "3380.00",
    weightGrams: "31.103",
    purity: "999.9",
    category: "coin",
    stock: 60,
    imageUrl: "https://images.unsplash.com/photo-1621870410898-bf20fc02aa3d?w=400",
  },
  {
    name: "South African Krugerrand 1oz",
    description: "The original gold bullion coin (1967). Contains exactly 1 troy oz of gold in 22-karat alloy.",
    priceUsd: "3360.00",
    weightGrams: "33.930",
    purity: "916.6",
    category: "coin",
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1621870410898-bf20fc02aa3d?w=400",
  },
  {
    name: "Australian Kangaroo 1oz Coin",
    description: "Perth Mint annual release featuring the iconic kangaroo. New design each year makes it a collector's favorite.",
    priceUsd: "3395.00",
    weightGrams: "31.103",
    purity: "999.9",
    category: "coin",
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1621870410898-bf20fc02aa3d?w=400",
  },
  {
    name: "22K Gold Rope Chain Necklace",
    description: "Hand-crafted 22-karat gold rope chain, 18 inches. Timeless design with a secure lobster clasp.",
    priceUsd: "1850.00",
    weightGrams: "12.500",
    purity: "916",
    category: "jewelry",
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
  },
  {
    name: "18K Gold Diamond Solitaire Ring",
    description: "Elegant 18-karat gold solitaire ring set with a 0.25ct VS1 diamond. Perfect as an investment piece.",
    priceUsd: "2750.00",
    weightGrams: "4.200",
    purity: "750",
    category: "jewelry",
    stock: 8,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
  },
  {
    name: "24K Gold Bangle Bracelet",
    description: "Pure 24-karat gold bangle, handcrafted in the traditional style. 20 grams of investment-grade gold.",
    priceUsd: "2180.00",
    weightGrams: "20.000",
    purity: "999.9",
    category: "jewelry",
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
  },
];

async function seed() {
  console.log("🌱 Seeding database...");
  await db.delete(products);
  await db.insert(products).values(seedProducts);
  console.log(`✅ Seeded ${seedProducts.length} products`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
