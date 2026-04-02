import { NewOrderForm } from "@/components/NewOrderForm";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { Customer, OrderSummary, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getCustomer(customerId: number): Promise<Customer | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("customer_id,full_name,email,zip_code,city,state")
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? null) as Customer | null;
}

async function getSummary(customerId: number): Promise<OrderSummary> {
  const supabase = getSupabaseServerClient();
  const { count, error: countError } = await supabase
    .from("orders")
    .select("order_id", { count: "exact", head: true })
    .eq("customer_id", customerId);

  if (countError) {
    throw new Error(countError.message);
  }

  const { data: latestOrderRows, error: latestError } = await supabase
    .from("orders")
    .select("order_datetime")
    .eq("customer_id", customerId)
    .order("order_datetime", { ascending: false })
    .limit(1);

  if (latestError) {
    throw new Error(latestError.message);
  }

  // Supabase defaults to a max row page size. Paginate to sum all orders.
  let totalSpent = 0;
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const to = from + pageSize - 1;
    const { data: rows, error: pageError } = await supabase
      .from("orders")
      .select("order_total")
      .eq("customer_id", customerId)
      .range(from, to);

    if (pageError) {
      throw new Error(pageError.message);
    }

    const pageRows = rows ?? [];
    totalSpent += pageRows.reduce((sum, row) => sum + Number(row.order_total), 0);

    if (pageRows.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  const orderCount = count ?? 0;

  return {
    orderCount,
    totalSpent,
    avgOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
    latestOrderAt: latestOrderRows?.[0]?.order_datetime ?? null
  };
}

async function getProducts(): Promise<Product[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("product_id,sku,product_name,category,price,is_active")
    .eq("is_active", true)
    .order("product_id", { ascending: true })
    .limit(12);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Product[];
}

export default async function CustomerDashboardPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId: customerIdParam } = await params;
  const customerId = Number(customerIdParam);

  if (!Number.isFinite(customerId)) {
    return (
      <main>
        <article className="card"><p>Invalid customer id.</p></article>
      </main>
    );
  }

  const [customer, summary, products] = await Promise.all([
    getCustomer(customerId),
    getSummary(customerId),
    getProducts()
  ]);

  if (!customer) {
    return (
      <main>
        <article className="card"><p>Customer not found.</p></article>
      </main>
    );
  }

  return (
    <main>
      <header className="header split">
        <div>
          <h1>{customer.full_name}</h1>
          <p className="subtitle">{customer.email}</p>
        </div>
        <a className="linkButton small" href="/warehouse">View order history</a>
      </header>

      <section className="grid three-col">
        <article className="card"><h3>Total Orders</h3><p className="metric">{summary.orderCount}</p></article>
        <article className="card"><h3>Total Spent</h3><p className="metric">${summary.totalSpent.toFixed(2)}</p></article>
        <article className="card"><h3>Average Order</h3><p className="metric">${summary.avgOrderValue.toFixed(2)}</p></article>
      </section>

      <section className="card spacedTop">
        <h2>Place New Order</h2>
        <p className="subtitle">This writes directly to Supabase `orders` and `order_items`.</p>
        <NewOrderForm
          customerId={customer.customer_id}
          defaultZipCode={customer.zip_code ?? "00000"}
          products={products.map((p) => ({ product_id: p.product_id, product_name: p.product_name, price: Number(p.price) }))}
        />
      </section>
    </main>
  );
}
