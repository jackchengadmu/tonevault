# ToneVault

ToneVault is a high-end marketplace for pre-owned and vintage guitars. Every listing is meant to be **inspectable**, **graded**, and **paid through escrow** so a buyer is not wiring money against a forum post.

Sellers publish instruments with photography and condition notes. Luthiers and ToneVault staff attach a verification grade (`Unverified`, `Remote Verified`, or `Fully Verified`) and an optional **ToneVault Score (1–100)**. When a buyer checks out, the listing is marked sold, funds are intended to sit with **PayMongo** until shipment, delivery, and buyer approval, then a payout is released to the seller.

## Member roster and ownership

Update names as the team finalizes them. Reviews should be requested from the owner of the files you change.

| Member | Owns | Paths |
| --- | --- | --- |
| **Member 1** | Domain model, Postgres schema, RLS, typed Supabase client | `src/types/`, `src/lib/supabase/`, `supabase/migrations/` |
| **Member 2** | Catalog queries, Zod validation, server actions, order RPC | `src/lib/catalog/`, `src/lib/validators/`, `src/actions/`, `app/api/` |
| **Member 3** | App Router storefront (home, browse, product detail), Tailwind UI | `app/page.tsx`, `app/browse/`, `app/products/`, `src/components/` |
| **Member 4** | Repo hygiene, env templates, PayMongo escrow integration | `.env.example`, `README.md`, `CONTRIBUTING.md`, `.github/`, future `src/lib/paymongo/` |

`main` is shared. Do not expand another member’s surface in the same PR without them on review.

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | **Next.js 16** (App Router) | Server Components, Server Actions, and Route Handlers in one repo |
| UI | **React 19** + **Tailwind CSS 4** | Fast layout work for a catalog and PDP without a heavy design system |
| Data | **Supabase** (Postgres, Auth, RLS) | Row-level security around sellers, listings, and orders |
| Validation | **Zod** | Shared schemas for filters, product ids, and `createOrder` |
| Payments | **PayMongo** | PHP-native checkout and a path to escrow-style capture/payout |
| Hosting | **Vercel** | Native Next.js deploys, env vars, and preview URLs per PR |

## Local setup

### Prerequisites

- Node.js 20+
- npm
- A Supabase project (URL, publishable/anon key, service role key)
- Optional: [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) for `db push`

### Install

```bash
git clone https://github.com/<org>/tonevault.git
cd tonevault
npm install
cp .env.example .env.local
```

Fill `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYMONGO_SECRET_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is **server-only**. It bypasses RLS and must never be prefixed with `NEXT_PUBLIC_`. `PAYMONGO_SECRET_KEY` is also server-only.

### Database

Apply migrations to the linked project (from the repo root):

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push --yes --remote
```

Or paste the files in `supabase/migrations/` into the Supabase SQL editor, in timestamp order.

Seed **exactly eight** vintage/pre-owned listings (PHP prices, `stock: 1` per slot). Re-running the script **refreshes** existing rows (price, verification, stock, and `available` status) so Challenge 1 orders can be reset:

```bash
npm run seed
```

Copy the printed `Postman buyer_id=…` into the Postman collection variable `buyerId`. The seed buyer is `buyer@tonevault.dev`.

| # | Instrument | Finish | Verification | Score | Price (PHP) | Stock |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 1965 Fender Stratocaster | Olympic White | Fully Verified | 94 | ₱485,000 | 1 |
| 2 | 1959 Gibson Les Paul Standard | Cherry Sunburst | Fully Verified | 96 | ₱2,850,000 | 1 |
| 3 | 1972 Fender Telecaster | Olympic White | Remote Verified | — | ₱265,000 | 1 |
| 4 | 1964 Gibson ES-335 | Cherry | Fully Verified | 91 | ₱195,000 | 1 |
| 5 | 2016 PRS Custom 24 | Cobalt Blue | Unverified | — | ₱168,000 | 1 |
| 6 | 1968 Fender Jazzmaster | Aquamarine Blue | Fully Verified | 92 | ₱325,000 | 1 |
| 7 | 1954 Fender Stratocaster | Sunburst | Fully Verified | 98 | ₱3,450,000 | 1 |
| 8 | 1961 Gibson SG Standard | Cherry | Remote Verified | — | ₱420,000 | 1 |

### Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Route | Purpose |
| --- | --- |
| `/` | Brand, value props, featured collection |
| `/browse` | Filters + catalog grid |
| `/products/[id]` | Instrument detail, verification, cart actions |
| `GET /api/products` | Filtered catalog JSON |
| `GET /api/products/:id` | Product + seller + inspection metrics |
| `POST /api/orders` | Create pending escrow order and mark listing sold |

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run seed` | Insert or refresh the 8 demo listings and print a Postman `buyer_id` |

## Verify the API (Challenge 1)

1. Apply migrations and seed (`npx supabase db push --yes --remote` then `npm run seed`).
2. Start the app (`npm run dev`) or use your Vercel URL.
3. In Postman: **Import** → `docs/postman_collection.json`.
4. Set collection variables:
   - `baseUrl` — `http://localhost:3000` or `https://<your-app>.vercel.app`
   - `buyerId` — value printed by `npm run seed`
5. Send **Catalog → GET /api/products** first (it stores an available `productId`).
6. Run the **Challenge 1** folder. Suggested order so you do not sell the test listing early: **1, 5, 4, 4b, 3, 6, then 2**.

| # | Request | Expected |
| --- | --- | --- |
| 1 | POST `/api/orders` with `"quantity": -3` (or `0`) | **400** |
| 2 | POST `/api/orders` with `"quantity": 1` and `"total": 1` | **201** with `total_amount` = catalog price × qty, or **400** |
| 3 | POST `/api/orders` with `"quantity": 3` (stock is 1) | **409** |
| 4 | POST `/api/orders` or GET `/api/products/:id` with a UUID not in Supabase | **404** |
| 5 | POST `/api/orders` without `quantity` | **400** |
| 6 | GET `/api/products?search=zzzz-no-such-guitar-xyz` | **200** and `"data": []` |

If case 2 returns **409**, the listing is already sold — run `npm run seed` again (it restocks) or pick another id from GET `/api/products`.

Each seed guitar is a **single slot** (`stock = 1`). Case 2 persists a real order; re-seed before repeating the collection.

## Database architecture

Postgres lives in Supabase. Auth identities are in `auth.users`; public profile rows live in `public.users` (`id` → `auth.users.id`).

```
auth.users
    └── public.users (buyer | seller | admin | luthier)
            ├── public.products.seller_id
            └── public.orders.buyer_id
                    └── public.orders.product_id → public.products.id
```

### Tables

- **`users`** — `id`, `email`, `full_name`, `role`, `created_at`. New Auth users sync in as `buyer`. Role upgrades are admin-only.
- **`products`** — listing file: brand, model, year, finish, price (PHP), `verification_status`, `tonevault_score` (1–100 or null), `condition_notes`, `status` (`available` \| `sold`), `stock` (seed listings use 1), `images[]`.
- **`orders`** — `product_id`, `buyer_id`, `quantity`, `total_amount` (always `price × quantity` from the database), `escrow_status`, `tracking_number`. Escrow starts at `pending`, then `paid` → `awaiting_shipment` → `shipped` → `delivered` → `approved` → `payout_released`.

Checkout uses `place_catalog_order(product_id, buyer_id, quantity)`: lock the listing, reject invalid quantity / self-purchase / missing product, refuse oversell with **409**, insert a pending order with the **server** total, decrement `stock`, and set `sold` when stock hits 0. PayMongo capture and payout are not wired yet; keep `PAYMONGO_SECRET_KEY` ready for that work.

### RLS (summary)

- Available listings are publicly readable; sold listings are visible to the seller, the buyer on the order, and admins.
- Seller/luthier/admin profiles are readable; buyers only see their own row.
- Sellers insert unverified listings. Verification status and score cannot be self-assigned (trigger).
- Orders are visible to the buyer, the listing seller, and admins.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Pull requests must use [.github/pull_request_template.md](./.github/pull_request_template.md), including the AI-assisted development disclosure.
