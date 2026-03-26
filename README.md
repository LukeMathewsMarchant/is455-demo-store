# IS455 Demo Store

Simple professional storefront for class demonstration. Built with Next.js + Supabase and ready for Vercel deployment.

## 1) Create Supabase project

Create a Supabase project named `IS455_Example` in the Supabase dashboard.

## 2) Apply database schema

Run the SQL from `supabase/migrations/001_init_shop_schema.sql` in the Supabase SQL Editor.

## 3) Import data from `shop.db`

1. Copy `.env.example` to `.env.local` and fill keys.
2. Export SQLite data:
   - `python3 scripts/export_sqlite.py`
3. Load into Supabase:
   - `npx tsx scripts/load_to_supabase.ts`
4. Optional featured product seed:
   - Run `scripts/seed_featured_products.sql` in SQL Editor.
5. (If needed) Fix identity sequences
   - If you get errors like `duplicate key value violates unique constraint "customers_pkey"` after import, run:
     - `supabase/migrations/002_fix_identity_sequences.sql` in the Supabase SQL Editor.

## 4) Run locally

- `npm install`
- `npm run dev`

## 5) Deploy to Vercel

1. Import this project in Vercel.
2. Add environment variables from `.env.example`.
3. Deploy.

## MLR pipeline readiness

`src/lib/mlr-hook.ts` defines an extension hook (`onOrderCreatedForMlr`) where a future model scoring call can be inserted without changing the checkout UI.
