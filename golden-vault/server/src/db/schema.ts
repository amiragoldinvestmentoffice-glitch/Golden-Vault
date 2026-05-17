import {
  pgTable,
  serial,
  text,
  numeric,
  integer,
  timestamp,
  boolean,
  varchar,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priceUsd: numeric("price_usd", { precision: 12, scale: 2 }).notNull(),
  weightGrams: numeric("weight_grams", { precision: 10, scale: 3 }).notNull(),
  purity: text("purity").notNull(), // e.g. "999.9", "916"
  category: text("category").notNull(), // "bar" | "coin" | "jewelry"
  imageUrl: text("image_url"),
  stock: integer("stock").notNull().default(100),
  inStock: boolean("in_stock").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Clerk userId
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("confirmed"),
  totalUsd: numeric("total_usd", { precision: 12, scale: 2 }).notNull(),
  shippingName: text("shipping_name").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  shippingCountry: text("shipping_country").notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceUsd: numeric("price_usd", { precision: 12, scale: 2 }).notNull(),
  productName: text("product_name").notNull(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  amountUsd: numeric("amount_usd", { precision: 12, scale: 2 }).notNull(),
  gramsAcquired: numeric("grams_acquired", {
    precision: 14,
    scale: 6,
  }).notNull(),
  spotPriceAtPurchase: numeric("spot_price_at_purchase", {
    precision: 12,
    scale: 2,
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type Product = typeof products.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Investment = typeof investments.$inferSelect;
