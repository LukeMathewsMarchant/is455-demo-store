import { getSupabaseServerClient } from "@/lib/supabase";

export type MlrOrderFeatures = {
  orderId: number;
  customerId: number;
  productId: number;
  quantity: number;
  orderTotal: number;
  shippingState: string;
  promoUsed: boolean;
  deviceType: string;
  ipCountry: string;
};

/** Map app fields to snake_case column names used by the fraud model (see Deployment.ipynb / fraud_features.pkl). */
function featuresToModelRow(f: MlrOrderFeatures): Record<string, unknown> {
  return {
    order_id: f.orderId,
    customer_id: f.customerId,
    product_id: f.productId,
    quantity: f.quantity,
    order_total: f.orderTotal,
    shipping_state: f.shippingState,
    promo_used: f.promoUsed,
    device_type: f.deviceType,
    ip_country: f.ipCountry,
  };
}

/**
 * Calls the deployed fraud scoring API after an order is created.
 * Errors are logged only — checkout must still succeed if the API is down or misconfigured.
 */
export async function onOrderCreatedForMlr(features: MlrOrderFeatures): Promise<void> {
  const baseUrl = process.env.MLR_API_URL?.trim();
  if (!baseUrl) {
    console.warn("MLR_API_URL is not set; skipping fraud scoring.");
    return;
  }

  const url = `${baseUrl.replace(/\/$/, "")}/score`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: [featuresToModelRow(features)],
        top_n: 1,
      }),
      cache: "no-store",
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("Fraud API error:", res.status, text);
      return;
    }

    try {
      const data = JSON.parse(text) as any;
      console.log("Fraud score response:", data);
      
      if (data && Array.isArray(data.results) && data.results.length > 0) {
        const predictedFraud = data.results[0].predicted_fraud;
        
        if (typeof predictedFraud === "boolean") {
          const supabase = getSupabaseServerClient();
          const { error } = await supabase
            .from("orders")
            .update({ predicted_fraud: predictedFraud })
            .eq("order_id", features.orderId);
            
          if (error) {
            console.error("Failed to update predicted_fraud in orders table:", error);
          } else {
            console.log(`Successfully updated order ${features.orderId} with predicted_fraud: ${predictedFraud}`);
          }
        }
      }
    } catch (parseErr) {
      console.log("Fraud score response (raw):", text);
    }
  } catch (err) {
    console.error("Fraud scoring request failed:", err);
  }
}
