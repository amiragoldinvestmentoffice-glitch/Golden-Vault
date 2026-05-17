# 🥇 Aurum — Gold Store & Investment Platform

A premium e-commerce and investment platform for buying physical gold products and managing a gold investment portfolio.

**Stack:** Express 5 · Drizzle ORM · Neon PostgreSQL · Clerk Auth · React · Vite · Tailwind CSS · Recharts  
**Hosting:** Render (API + frontend) · Neon (database) · Netlify (sleep-redirect page)

---

## Project Structure

```
golden-vault/
├── server/                  # Express API (Node.js)
│   ├── src/
│   │   ├── db/
│   │   │   ├── index.ts     # Neon DB connection
│   │   │   └── schema.ts    # Drizzle table definitions
│   │   ├── lib/
│   │   │   └── goldPrice.ts # Simulated gold spot price
│   │   ├── middleware/
│   │   │   └── auth.ts      # Clerk auth middleware
│   │   ├── routes/
│   │   │   ├── products.ts
│   │   │   ├── cart.ts
│   │   │   ├── orders.ts
│   │   │   ├── investments.ts
│   │   │   └── price.ts
│   │   ├── index.ts         # Express entry point
│   │   └── seed.ts          # DB seed script (10 products)
│   ├── drizzle.config.ts
│   └── package.json
│
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.tsx
│   │   ├── lib/
│   │   │   └── api.ts       # Axios instance + Clerk token injection
│   │   ├── pages/
│   │   │   ├── ShopPage.tsx
│   │   │   ├── ProductPage.tsx
│   │   │   ├── CartPage.tsx
│   │   │   ├── CheckoutPage.tsx
│   │   │   ├── OrdersPage.tsx
│   │   │   ├── OrderDetailPage.tsx
│   │   │   ├── InvestPage.tsx
│   │   │   ├── PortfolioPage.tsx
│   │   │   └── SignInPage.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── netlify-redirect/        # Static wake-up page (deploy to Netlify)
│   ├── index.html           # Pings Render /health, redirects when alive
│   └── netlify.toml
│
├── render.yaml              # Render deploy config
└── README.md
```

---

## Features

| Feature | Description |
|---|---|
| **Shop** | Browse 10 gold products (bars, coins, jewelry) with category + search filters |
| **Cart** | Server-side cart persisted per Clerk user across sessions |
| **Checkout** | Shipping info + payment method → confirmed order |
| **Orders** | Full order history and detail pages |
| **Invest** | Buy gold by USD amount, tracked as grams at spot price |
| **Portfolio** | Dashboard with Recharts 30-day price chart, gain/loss KPIs |
| **Auth** | Clerk sign-in/sign-up (modal or page) |
| **Health** | `GET /health` endpoint for Render uptime checks + Netlify wake detection |

---

## Deploy Guide

### Step 1 — Set up Neon (Database)

1. Go to [neon.tech](https://neon.tech) → Create account → New project
2. Name it `golden-vault`
3. Copy the **Connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`)
4. Keep it handy — you'll add it to Render as `DATABASE_URL`

---

### Step 2 — Set up Clerk (Auth)

1. Go to [clerk.com](https://clerk.com) → Create account → New application
2. Name it `Aurum` — enable **Email** and/or **Google** sign-in
3. Go to **API Keys** and copy:
   - `CLERK_SECRET_KEY` → for the server
   - `CLERK_PUBLISHABLE_KEY` → for both server and client (`VITE_CLERK_PUBLISHABLE_KEY`)

---

### Step 3 — Deploy to Render

1. Push this repo to GitHub (or fork it)
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml` — or set manually:
   - **Build Command:** `cd server && npm install && npm run build && cd ../client && npm install && npm run build`
   - **Start Command:** `cd server && npm start`
   - **Health Check Path:** `/health`
5. Add **Environment Variables** in the Render dashboard:
   ```
   DATABASE_URL       = (your Neon connection string)
   CLERK_SECRET_KEY   = (your Clerk secret key)
   CLERK_PUBLISHABLE_KEY = (your Clerk publishable key)
   FRONTEND_URL       = (your Netlify URL — set after Step 4)
   NODE_ENV           = production
   ```
6. Deploy. Once live, note your Render URL: `https://golden-vault-xxxx.onrender.com`

---

### Step 4 — Seed the Database

After Render deploys, run the seed script once to populate 10 gold products:

```bash
# Locally — copy your Neon DATABASE_URL into server/.env first
cd server
cp .env.example .env
# Edit .env and paste your DATABASE_URL

npm install
npm run db:push    # Push Drizzle schema to Neon
npm run db:seed    # Insert 10 seed products
```

Or trigger it via Render's **Shell** tab:
```bash
cd server && npm run db:push && npm run db:seed
```

---

### Step 5 — Deploy Netlify Wake-Up Page

The `netlify-redirect/` folder is a standalone static site. It shows a gold-themed loading screen while pinging your Render service to wake it up (Render free tier sleeps after 15 min of inactivity), then auto-redirects once the server responds.

1. **Edit the redirect page** — open `netlify-redirect/index.html` and replace:
   ```js
   const RENDER_URL = "YOUR_RENDER_URL_HERE";
   ```
   with your actual Render URL, e.g.:
   ```js
   const RENDER_URL = "https://golden-vault-xxxx.onrender.com";
   ```

2. Go to [netlify.com](https://netlify.com) → New site → **Deploy manually**
3. Drag and drop the `netlify-redirect/` **folder** into the Netlify deploy box
4. Note your Netlify URL: `https://your-app.netlify.app`

5. Go back to Render → your service → **Environment** → update:
   ```
   FRONTEND_URL = https://your-app.netlify.app
   ```

6. **Share the Netlify URL** as your app's public link. Visitors see the gold loading screen while Render wakes up, then get auto-redirected to the live app.

---

### Step 6 — (Optional) Build Frontend Separately

If you want the frontend served from Netlify directly (instead of Render), build the client and deploy `client/dist/` to Netlify:

```bash
cd client
cp .env.example .env
# Set:
#   VITE_API_URL=https://golden-vault-xxxx.onrender.com
#   VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx

npm install
npm run build
# Deploy client/dist/ to Netlify
```

Then update your Clerk dashboard → **Allowed Origins** to include your Netlify domain.

---

## Local Development

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Set up server env
cd server
cp .env.example .env
# Fill in DATABASE_URL, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY

# 3. Set up client env
cd ../client
cp .env.example .env
# Fill in VITE_CLERK_PUBLISHABLE_KEY
# Leave VITE_API_URL empty for local proxy

# 4. Push DB schema + seed
cd ../server
npm run db:push
npm run db:seed

# 5. Run both (from root)
cd ..
npm install        # installs concurrently
npm run dev        # starts server (8080) + client (5173)
```

Visit: http://localhost:5173

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Health check |
| GET | `/api/price` | — | Current gold spot price |
| GET | `/api/products` | — | List products (`?category=bar&search=pamp`) |
| GET | `/api/products/:id` | — | Single product |
| GET | `/api/cart` | ✅ | Get user's cart |
| POST | `/api/cart` | ✅ | Add item `{ productId, quantity }` |
| PATCH | `/api/cart/:id` | ✅ | Update quantity `{ quantity }` |
| DELETE | `/api/cart/:id` | ✅ | Remove item |
| POST | `/api/orders/checkout` | ✅ | Place order from cart |
| GET | `/api/orders` | ✅ | Order history |
| GET | `/api/orders/:id` | ✅ | Order detail with items |
| GET | `/api/investments` | ✅ | Portfolio summary + investments |
| GET | `/api/investments/price-history` | — | 30-day price history |
| POST | `/api/investments` | ✅ | New investment `{ amountUsd }` |

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend secret key |
| `CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `FRONTEND_URL` | ✅ | Allowed CORS origin |
| `PORT` | — | Server port (default 8080, set by Render) |
| `NODE_ENV` | — | `production` or `development` |

### Client (`client/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk publishable key |
| `VITE_API_URL` | — | API base URL (empty = Vite proxy in dev) |

---

## How the Netlify Wake-Up Page Works

```
User visits Netlify URL
        │
        ▼
netlify-redirect/index.html loads
  • Shows gold-themed loading screen
  • Starts polling GET /health on Render every 5 seconds
  • Updates status message + progress bar
        │
        ▼ (Render wakes up, /health returns 200)
  • Shows "Server is ready! Redirecting…"
  • Auto-redirects to RENDER_URL after 1.5 seconds
        │
        ▼
User lands on the live Aurum app
```

Free Render services sleep after ~15 minutes of inactivity. Wake-up typically takes 30–90 seconds.

---

## License

MIT
