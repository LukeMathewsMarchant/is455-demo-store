import { ProductCard } from "@/components/ProductCard";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("product_id,sku,product_name,category,price,is_active")
      .eq("is_active", true)
      .order("product_id", { ascending: true })
      .limit(6);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <main>
      <header className="header">
        <h1>IS455 Demo Store</h1>
        <p className="subtitle">Professional class demo storefront powered by Supabase and Vercel.</p>
      </header>
      {products.length === 0 ? (
        <article className="card">
          <h3>No products loaded yet</h3>
          <p className="subtitle">Run the migration and data import steps in README to load products.</p>
        </article>
      ) : (
        <section className="grid">
          {products.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </section>
      )}
    </main>
  );
}
