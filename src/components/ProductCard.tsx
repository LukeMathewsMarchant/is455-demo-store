import type { Product } from "@/lib/types";
import { CheckoutForm } from "./CheckoutForm";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      <span className="badge">{product.category}</span>
      <h3>{product.product_name}</h3>
      <p className="price">${product.price.toFixed(2)}</p>
      <p className="subtitle">SKU: {product.sku}</p>
      <CheckoutForm product={product} />
    </article>
  );
}
