import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const seedProducts = [
  {
    name: "Gold Charm Bracelets — Dubai Collection",
    description: "Delicate 18K gold chain bracelets with assorted charms — evil eye, stars, infinity, and more. Handcrafted in Dubai.",
    price_usd: "380.00",
    weight_grams: "3.5",
    purity: "750",
    category: "jewelry",
    in_stock: true,
    image_url: "https://i.imgur.com/dfaNHce.jpeg",
  },
  {
    name: "Cuban Link Gold Chain & Bracelet Set",
    description: "Bold 18K gold Cuban link necklace and matching bracelet set. Heavy-gauge links with signature clasp detail.",
    price_usd: "2800.00",
    weight_grams: "28.0",
    purity: "750",
    category: "jewelry",
    in_stock: true,
    image_url: "https://i.imgur.com/3r6Rd1N.jpeg",
  },
  {
    name: "18K Cuban Link Set — Diamond Cut Detail",
    description: "Premium 18K gold Cuban link necklace and bracelet with pavé-set diamond-cut centerpiece. Certified 750 purity.",
    price_usd: "3200.00",
    weight_grams: "32.0",
    purity: "750",
    category: "jewelry",
    in_stock: true,
    image_url: "https://i.imgur.com/vlbOQCN.jpeg",
  },
  {
    name: "Lion Medallion Gold Set — Necklace, Bracelet & Ring",
    description: "Statement 18K gold set featuring a bold lion head medallion with pavé stones on black enamel. Includes necklace, bracelet, and matching ring.",
    price_usd: "4200.00",
    weight_grams: "42.0",
    purity: "750",
    category: "jewelry",
    in_stock: true,
    image_url: "https://i.imgur.com/gK8G3aD.jpeg",
  },
  {
    name: "Medusa Medallion Gold Set — 66.28g",
    description: "Spectacular 18K gold Medusa head medallion set, 66.28 grams. Includes large pendant necklace, bracelet, and ring with full pavé stone setting.",
    price_usd: "8900.00",
    weight_grams: "66.28",
    purity: "750",
    category: "jewelry",
    in_stock: true,
    image_url: "https://i.imgur.com/dfgddKU.jpeg",
  },
  {
    name: "18K Gold Statement Rings — Luxury Collection",
    description: "Bold 18K gold statement rings in various designs. Each ring is handcrafted with high-polish finish. Sold individually — contact us to select your design.",
    price_usd: "950.00",
    weight_grams: "9.0",
    purity: "750",
    category: "jewelry",
    in_stock: true,
    image_url: "https://i.imgur.com/iqupM2M.jpeg",
  },
  {
    name: "Gold Cat & Heart Ring Set",
    description: "Playful 18K gold cat figurine ring and chunky heart ring. A perfect gift pairing, sold as a set.",
    price_usd: "1200.00",
    weight_grams: "11.0",
    purity: "750",
    category: "jewelry",
    in_stock: true,
    image_url: "https://i.imgur.com/0nceCH6.jpeg",
  },
  {
    name: "Gold Crown Charm Necklace",
    description: "Elegant 18K gold chain necklace with cascading crown charms. Lightweight and delicate — perfect for everyday wear.",
    price_usd: "520.00",
    weight_grams: "5.0",
    purity: "750",
    category: "jewelry",
    in_stock: true,
    image_url: "https://i.imgur.com/S7riK50.jpeg",
  },
  {
    name: "Ottoman Hand Chain — Gold Coin Bracelet",
    description: "Traditional Ottoman-style 18K gold hand chain with circular medallion and dangling coin drops. A statement piece rooted in Arab heritage.",
    price_usd: "1800.00",
    weight_grams: "18.0",
    purity: "750",
    category: "jewelry",
    in_stock: true,
    image_url: "https://i.imgur.com/qD8rRPP.jpeg",
  },
  {
    name: "1kg Investment Gold Bar — Amira Aldahab Certified",
    description: "1 kilogram of 999.9 Fine Gold. Investment-grade bar certified by Amira Aldahab Precious Metals. Serial No. AA01357. Comes with Gold Ownership Certificate.",
    price_usd: "95000.00",
    weight_grams: "1000.0",
    purity: "999.9",
    category: "bar",
    in_stock: true,
    image_url: "https://i.imgur.com/9tCXK2A.jpeg",
  },
];

async function seed() {
  console.log("🌱 Checking database...");

  // ── GUARD: only seed if the products table is empty ──────────────────────
  // This prevents wiping real products on every deploy.
  const { data: existing, error: checkError } = await supabase
    .from("products")
    .select("id")
    .limit(1);

  if (checkError) {
    console.error("Error checking products table:", checkError);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    console.log("✅ Products already exist — skipping seed. No changes made.");
    process.exit(0);
  }
  // ─────────────────────────────────────────────────────────────────────────

  console.log("📦 Table is empty — inserting real products...");

  const { error } = await supabase.from("products").insert(seedProducts);

  if (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }

  console.log(`✅ Seeded ${seedProducts.length} products successfully`);
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
