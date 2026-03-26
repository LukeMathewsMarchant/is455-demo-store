import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const tables = ["customers", "products", "orders", "order_items", "shipments", "product_reviews"] as const;

function normalizeRow(table: (typeof tables)[number], row: Record<string, unknown>) {
  const copy = { ...row };

  if (table === "customers" || table === "products") {
    if ("is_active" in copy) copy.is_active = Boolean(copy.is_active);
  }
  if (table === "orders") {
    if ("promo_used" in copy) copy.promo_used = Boolean(copy.promo_used);
    if ("is_fraud" in copy) copy.is_fraud = Boolean(copy.is_fraud);
  }
  if (table === "shipments") {
    if ("late_delivery" in copy) copy.late_delivery = Boolean(copy.late_delivery);
  }

  return copy;
}

for (const table of tables) {
  const payload = JSON.parse(readFileSync(`shop_export/${table}.json`, "utf-8")) as Record<string, unknown>[];
  const normalized = payload.map((row) => normalizeRow(table, row));
  const batchSize = 500;

  for (let i = 0; i < normalized.length; i += batchSize) {
    const chunk = normalized.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(chunk);
    if (error) {
      throw new Error(`Failed loading ${table} rows ${i}-${i + chunk.length - 1}: ${error.message}`);
    }
  }

  console.log(`Loaded ${table}: ${normalized.length}`);
}
