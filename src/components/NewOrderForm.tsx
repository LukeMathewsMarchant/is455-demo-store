"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderSuccess } from "./OrderSuccess";

type ProductOption = {
  product_id: number;
  product_name: string;
  price: number;
};

type Props = {
  customerId: number;
  defaultZipCode: string;
  products: ProductOption[];
};

type ApiResponse = {
  orderId: number;
  total: number;
};

export function NewOrderForm({ customerId, defaultZipCode, products }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState<number>(products[0]?.product_id ?? 0);
  const [zipCode, setZipCode] = useState(defaultZipCode);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ApiResponse | null>(null);

  const selectedProduct = useMemo(
    () => products.find((p) => p.product_id === productId) ?? products[0],
    [productId, products]
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, productId, quantity, zipCode })
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Could not place order");
      }

      const data = (await response.json()) as ApiResponse;
      setSuccess(data);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="form-row">
        <label htmlFor="product">Product</label>
        <select id="product" value={productId} onChange={(e) => setProductId(Number(e.target.value))}>
          {products.map((p) => (
            <option key={p.product_id} value={p.product_id}>
              {p.product_name} - ${p.price.toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label htmlFor="zip">Shipping ZIP</label>
        <input id="zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} required />
      </div>

      <div className="form-row">
        <label htmlFor="qty">Quantity</label>
        <input id="qty" type="number" min={1} max={10} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
      </div>

      <button type="submit" disabled={loading || !selectedProduct}>
        {loading ? "Placing order..." : `Place order ($${((selectedProduct?.price ?? 0) * quantity).toFixed(2)})`}
      </button>
      {error ? <p className="error">{error}</p> : null}
      {success ? <OrderSuccess orderId={success.orderId} total={success.total} /> : null}
    </form>
  );
}
