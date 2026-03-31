# IS455 Demo Store - Build Context Handoff

This document captures the key context from the build and debugging work so the next teammate can add the machine learning pipeline efficiently.

## Project Goal

Class demonstration app with:
- Customer selection (no auth)
- Customer dashboard (order summary metrics)
- New order placement (writes to Supabase)
- Customer order history
- Warehouse "Late Delivery Priority Queue"
- A `Run Scoring` button (currently UI-only placeholder; ML API to be added later)

Tech stack:
- Next.js App Router + TypeScript
- Supabase Postgres (live)
- Vercel deployment target

## Current App Routes

- `/` - landing page linking to customer ops + warehouse
- `/customers` - select customer screen
- `/customers/[customerId]` - customer dashboard + place new order
- `/customers/[customerId]/orders` - order history page
- `/warehouse` - top 50 queue by predicted late-delivery probability proxy
- `/api/orders` - API route for creating orders/order_items (and optional customer creation path)

## Important Files

- App pages/components:
  - `src/app/page.tsx`
  - `src/app/customers/page.tsx`
  - `src/app/customers/[customerId]/page.tsx`
  - `src/app/customers/[customerId]/orders/page.tsx`
  - `src/app/warehouse/page.tsx`
  - `src/components/NewOrderForm.tsx`
  - `src/components/RunScoringButton.tsx`
  - `src/components/OrderSuccess.tsx`

- API/data layer:
  - `src/app/api/orders/route.ts`
  - `src/lib/supabase.ts`
  - `src/lib/types.ts`
  - `src/lib/mlr-hook.ts` (explicit ML extension point)

- DB migration/import:
  - `supabase/migrations/001_init_shop_schema.sql`
  - `supabase/migrations/002_fix_identity_sequences.sql`
  - `scripts/export_sqlite.py`
  - `scripts/load_to_supabase.ts`
  - `scripts/seed_featured_products.sql`

## Supabase Environment Variables

Expected env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Local dev:
- Use `.env.local` at repo root.
- `npx tsx scripts/load_to_supabase.ts` does not auto-load `.env.local` unless exported in shell first.

Security:
- Never commit secrets from `.env.local`.

## Database Notes (Current Usage)

Main tables used by app right now:
- `customers`
- `products`
- `orders`
- `order_items`

ML-relevant existing fields already in schema:
- In `orders`: `risk_score`, `is_fraud`
- In `shipments`: `late_delivery`

Warehouse queue currently uses:
- `orders.risk_score` sorted descending as a proxy for "predicted late-delivery probability"

## Implemented Behavior

### Customer selection
- No auth required.
- User chooses an existing customer from `/customers`.

### Customer dashboard
- Shows:
  - Total Orders
  - Total Spent
  - Average Order
- Includes new order form and link to full order history.

### New order flow
- New order form posts to `/api/orders` with:
  - `customerId`, `productId`, `quantity`, `zipCode`
- `/api/orders`:
  - validates payload
  - loads product price
  - computes subtotal, tax, shipping, total
  - inserts into `orders`
  - inserts into `order_items`
  - calls `onOrderCreatedForMlr(...)` hook

### Order history
- `/customers/[customerId]/orders` reads recent orders for selected customer.

### Warehouse queue
- `/warehouse` shows top 50 orders by `risk_score desc`.
- `Run Scoring` button is currently UI-only:
  - no external API call
  - no DB updates
  - shows placeholder message + `router.refresh()`

## Important Fixes Already Made

1. **Order API 500 after import (`customers_pkey` duplicate)**
   - Cause: identity sequence mismatch after bulk insert from SQLite.
   - Fix: run `supabase/migrations/002_fix_identity_sequences.sql`.

2. **Dashboard cards not refreshing after purchase**
   - Fix: `router.refresh()` added in `src/components/NewOrderForm.tsx` after successful order.

3. **`Total Orders` stuck for high-volume customers**
   - Cause: Supabase row pagination default (count inferred from paged rows).
   - Fix in `src/app/customers/[customerId]/page.tsx`:
     - exact count query (`count: "exact", head: true`)
     - paginated aggregation for total spent across all rows.

## ML Integration Points (Where to Add Pipeline)

### 1) Post-order scoring hook
- File: `src/lib/mlr-hook.ts`
- Current function:
  - `onOrderCreatedForMlr(features)`
- Intended use:
  - call ML inference service after new order creation
  - persist returned score(s) to DB (likely `orders.risk_score` and/or a new predictions table)

### 2) Run scoring action from warehouse screen
- File: `src/components/RunScoringButton.tsx` (UI trigger)
- Recommended backend addition:
  - create route: `src/app/api/scoring/run/route.ts`
  - `POST /api/scoring/run` triggers batch inference job
  - update queue source fields in DB
  - return job summary (processed rows, errors, duration)
- Then replace placeholder logic in `RunScoringButton` with API call and refresh.

### 3) Queue data model
- Current queue reads from `orders.risk_score`.
- Recommended ML-ready direction:
  - keep `orders.risk_score` as latest score for fast UI
  - optionally add a dedicated table for versioned predictions, e.g.:
    - `order_predictions(order_id, model_version, predicted_late_probability, scored_at, feature_snapshot, ...)`

## Suggested ML API Contract (Proposed)

For single-order scoring (during checkout hook):
- Input:
  - order/customer/product features (already assembled in `onOrderCreatedForMlr`)
- Output:
  - `{ predictedLateProbability: number, modelVersion: string }`

For batch scoring (`Run Scoring`):
- Input:
  - optional filters/time window/model version
- Output:
  - `{ processed: number, updated: number, failed: number, modelVersion: string }`

## Deployment Notes

GitHub -> Vercel flow is intended.

Before deployment:
- ensure Supabase migrations/data are applied
- ensure Vercel env vars are set (same 3 vars above)
- verify live app can read products and write orders

Recommended `.gitignore` additions:
- `shop.db`
- `shop.db.zip`

## Local Validation Commands

- Build:
  - `npm run build`
- Dev server:
  - `npm run dev`
- SQLite export:
  - `python3 scripts/export_sqlite.py`
- Supabase load:
  - `npx tsx scripts/load_to_supabase.ts`

## Open Work for ML Teammate

1. Implement real scoring service integration in `src/lib/mlr-hook.ts`.
2. Add backend scoring route (`/api/scoring/run`) and wire `RunScoringButton`.
3. Decide whether to store only latest score in `orders` or add versioned prediction history table.
4. Add monitoring/logging for scoring failures and model version tracking.
5. Add tests for:
   - order creation + score write
   - scoring-run endpoint
   - warehouse queue ordering correctness.

