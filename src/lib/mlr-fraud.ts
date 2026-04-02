export type MlrFraudFeaturePayload = {
  orderId: number;
  customerId: number;
  orderDatetime: string;
  billingZip: string | null;
  shippingZip: string | null;
  shippingState: string | null;
  paymentMethod: string;
  deviceType: string;
  ipCountry: string;
  promoUsed: boolean;
  promoCode: string | null;
  orderSubtotal: number;
  shippingFee: number;
  taxAmount: number;
  orderTotal: number;
  riskScore: number;
  items: { productId: number; quantity: number; unitPrice: number }[];
};

/** Build one model row (snake_case) for POST /score — missing columns are filled server-side. */
export function payloadToScoreRow(p: MlrFraudFeaturePayload): Record<string, unknown> {
  const totalQty = p.items.reduce((s, i) => s + i.quantity, 0);
  return {
    order_id: p.orderId,
    customer_id: p.customerId,
    order_datetime: p.orderDatetime,
    billing_zip: p.billingZip,
    shipping_zip: p.shippingZip,
    shipping_state: p.shippingState,
    payment_method: p.paymentMethod,
    device_type: p.deviceType,
    ip_country: p.ipCountry,
    promo_used: p.promoUsed,
    promo_code: p.promoCode,
    order_subtotal: p.orderSubtotal,
    shipping_fee: p.shippingFee,
    tax_amount: p.taxAmount,
    order_total: p.orderTotal,
    risk_score: p.riskScore,
    total_qty: totalQty,
    item_count: p.items.length
  };
}

/** Parses FastAPI /score JSON — prefers `predicted_fraud` (yes/no), else `fraud_risk` threshold. */
export function parseFraudScoreApiResponse(body: unknown): boolean | null {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    const results = o.results;
    if (Array.isArray(results) && results.length > 0) {
      const first = results[0];
      if (first && typeof first === "object") {
        const row = first as Record<string, unknown>;
        if (typeof row.predicted_fraud === "boolean") {
          return row.predicted_fraud;
        }
        const fr = row.fraud_risk;
        if (typeof fr === "number" && !Number.isNaN(fr)) {
          return fr >= 0.5;
        }
      }
    }
  }
  return parseFraudPrediction(body);
}

/** Parses ML service JSON into a boolean fraud label. Returns null if unknown. */
export function parseFraudPrediction(body: unknown): boolean | null {
  if (body === null || body === undefined) {
    return null;
  }
  if (typeof body === "boolean") {
    return body;
  }
  if (typeof body === "object" && body !== null) {
    const o = body as Record<string, unknown>;
    const boolKeys = ["predictedFraud", "predicted_fraud", "fraud", "isFraud", "is_fraud"] as const;
    for (const k of boolKeys) {
      if (typeof o[k] === "boolean") {
        return o[k];
      }
    }
    const numKeys = ["probability", "score", "prediction", "predictedFraudProbability"] as const;
    for (const k of numKeys) {
      const v = o[k];
      if (typeof v === "number" && !Number.isNaN(v)) {
        return v >= 0.5;
      }
    }
  }
  return null;
}

/** Parses FastAPI /score JSON when multiple rows are returned and extracts the order_id. */
export function parseBatchFraudScoreApiResponse(body: unknown): { order_id: number; predicted_fraud: boolean }[] | null {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    const results = o.results;
    if (Array.isArray(results)) {
      return results.map(row => {
        let pf = false;
        if (typeof row.predicted_fraud === "boolean") {
          pf = row.predicted_fraud;
        } else if (typeof row.fraud_risk === "number" && !Number.isNaN(row.fraud_risk)) {
          pf = row.fraud_risk >= 0.5;
        }
        return { order_id: Number(row.order_id), predicted_fraud: pf };
      }).filter(r => !Number.isNaN(r.order_id));
    }
  }
  return null;
}
