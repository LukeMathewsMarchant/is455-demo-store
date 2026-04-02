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
