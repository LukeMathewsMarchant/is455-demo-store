"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { OrderSuccess } from "./OrderSuccess";

type CheckoutFormProps = {
  product: Product;
};

type ApiResponse = {
  orderId: number;
  total: number;
};

export function CheckoutForm({ product }: CheckoutFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ApiResponse | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          zipCode,
          productId: product.product_id,
          quantity
        })
      });

      if (!response.ok) {
        // API returns JSON like: { error: "..." }
        let message = `Request failed with ${response.status}`;
        try {
          const data = (await response.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // ignore non-JSON responses
        }
        throw new Error(message);
      }

      const data = (await response.json()) as ApiResponse;
      setSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor={`name-${product.product_id}`}>Full name</label>
        <input id={`name-${product.product_id}`} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div className="form-row">
        <label htmlFor={`email-${product.product_id}`}>Email</label>
        <input id={`email-${product.product_id}`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-row">
        <label htmlFor={`zip-${product.product_id}`}>ZIP code</label>
        <input id={`zip-${product.product_id}`} value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
      </div>
      <div className="form-row">
        <label htmlFor={`qty-${product.product_id}`}>Quantity</label>
        <input id={`qty-${product.product_id}`} type="number" min={1} max={10} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Placing order..." : `Buy for $${(product.price * quantity).toFixed(2)}`}
      </button>
      {error ? <p className="error">{error}</p> : null}
      {success ? <OrderSuccess orderId={success.orderId} total={success.total} /> : null}
    </form>
  );
}
