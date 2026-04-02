import { NextResponse } from "next/server";

export const maxDuration = 300;
import { getSupabaseServerClient } from "@/lib/supabase";
import {
  parseBatchFraudScoreApiResponse,
  payloadToScoreRow,
  type MlrFraudFeaturePayload
} from "@/lib/mlr-fraud";

const PAGE_SIZE = 500;

type OrderWithItems = {
  order_id: number;
  customer_id: number;
  order_datetime: string;
  billing_zip: string | null;
  shipping_zip: string | null;
  shipping_state: string | null;
  payment_method: string;
  device_type: string;
  ip_country: string;
  promo_used: boolean;
  promo_code: string | null;
  order_subtotal: number;
  shipping_fee: number;
  tax_amount: number;
  order_total: number;
  risk_score: number;
  order_items: { product_id: number; quantity: number; unit_price: number }[] | null;
};

function toPayload(row: OrderWithItems): MlrFraudFeaturePayload {
  const items = (row.order_items ?? []).map((it) => ({
    productId: it.product_id,
    quantity: it.quantity,
    unitPrice: Number(it.unit_price)
  }));

  return {
    orderId: row.order_id,
    customerId: row.customer_id,
    orderDatetime: row.order_datetime,
    billingZip: row.billing_zip,
    shippingZip: row.shipping_zip,
    shippingState: row.shipping_state,
    paymentMethod: row.payment_method,
    deviceType: row.device_type,
    ipCountry: row.ip_country,
    promoUsed: row.promo_used,
    promoCode: row.promo_code,
    orderSubtotal: Number(row.order_subtotal),
    shippingFee: Number(row.shipping_fee),
    taxAmount: Number(row.tax_amount),
    orderTotal: Number(row.order_total),
    riskScore: Number(row.risk_score),
    items
  };
}

async function fetchAllOrdersWithItems(supabase: ReturnType<typeof getSupabaseServerClient>) {
  const rows: OrderWithItems[] = [];
  let from = 0;
  const select = `
    order_id,
    customer_id,
    order_datetime,
    billing_zip,
    shipping_zip,
    shipping_state,
    payment_method,
    device_type,
    ip_country,
    promo_used,
    promo_code,
    order_subtotal,
    shipping_fee,
    tax_amount,
    order_total,
    risk_score,
    order_items ( product_id, quantity, unit_price )
  `;

  for (;;) {
    const { data, error } = await supabase
      .from("orders")
      .select(select)
      .order("order_datetime", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as OrderWithItems[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return rows;
}

export async function POST() {
  const baseUrl = process.env.MLR_API_URL?.trim();
  if (!baseUrl) {
    return NextResponse.json({ error: "MLR_API_URL is not configured" }, { status: 500 });
  }

  const scoreUrl = `${baseUrl.replace(/\/$/, "")}/score`;

  const supabase = getSupabaseServerClient();
  let orders: OrderWithItems[];
  try {
    orders = await fetchAllOrdersWithItems(supabase);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  let processed = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  const CHUNK_SIZE = 100;

  for (let i = 0; i < orders.length; i += CHUNK_SIZE) {
    const chunk = orders.slice(i, i + CHUNK_SIZE);
    processed += chunk.length;

    try {
      const payloads = chunk.map((c) => payloadToScoreRow(toPayload(c)));
      
      const res = await fetch(scoreUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: payloads,
          top_n: 1
        }),
        cache: "no-store"
      });

      const text = await res.text();
      let json: unknown;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        failed += chunk.length;
        errors.push(`Batch starting with order ${chunk[0].order_id}: response is not JSON`);
        continue;
      }

      if (!res.ok) {
        failed += chunk.length;
        errors.push(`Batch starting with order ${chunk[0].order_id}: ML returned ${res.status}`);
        continue;
      }

      const predictedBatch = parseBatchFraudScoreApiResponse(json);
      if (!predictedBatch) {
        failed += chunk.length;
        errors.push(`Batch starting with order ${chunk[0].order_id}: could not parse fraud predictions`);
        continue;
      }

      // Concurrently update all elements in the chunk
      await Promise.all(predictedBatch.map(async (prediction) => {
        const { error: upErr } = await supabase
          .from("orders")
          .update({ predicted_fraud: prediction.predicted_fraud })
          .eq("order_id", prediction.order_id);

        if (upErr) {
          errors.push(`order ${prediction.order_id}: ${upErr.message}`);
        } else {
          updated += 1;
        }
      }));

    } catch (err) {
      failed += chunk.length;
      const msg = err instanceof Error ? err.message : "request failed";
      errors.push(`Batch starting with order ${chunk[0].order_id}: ${msg}`);
    }
  }

  return NextResponse.json({
    processed,
    updated,
    failed,
    errors: errors.slice(0, 20)
  });
}

export async function GET() {
  return POST();
}
