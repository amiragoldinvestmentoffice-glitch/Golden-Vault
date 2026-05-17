#!/bin/bash
# Run this ONCE in Render's shell tab after first deploy to push schema + seed data
# Render shell: go to your service → Shell tab → paste this

set -e
echo "📦 Pushing Drizzle schema to Neon..."
cd server
npx drizzle-kit push

echo "🌱 Seeding 10 gold products..."
npx tsx src/seed.ts

echo "✅ Done! Your database is ready."
