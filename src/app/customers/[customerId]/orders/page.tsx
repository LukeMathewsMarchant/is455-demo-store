import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type OrderRow = {
  order_id: number;
  order_datetime: string;
  order_total: number;
  shipping_fee: number;
  tax_amount: number;
  is_fraud: boolean;
};

async function getOrders(customerId: number): Promise<OrderRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("order_id,order_datetime,order_total,shipping_fee,tax_amount,is_fraud")
    .eq("customer_id", customerId)
    .order("order_datetime", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OrderRow[];
}

export default async function CustomerOrderHistoryPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId: customerIdParam } = await params;
  const customerId = Number(customerIdParam);
  const orders = await getOrders(customerId);

  return (
    <main>
      <header className="header split">
        <div>
          <h1>Order History</h1>
          <p className="subtitle">Customer #{customerId}</p>
        </div>
        <a className="linkButton small" href={`/customers/${customerId}`}>Back to dashboard</a>
      </header>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Shipping</th>
                <th>Tax</th>
                <th>Risk Label</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td>{order.order_id}</td>
                  <td>{new Date(order.order_datetime).toLocaleString()}</td>
                  <td>${Number(order.order_total).toFixed(2)}</td>
                  <td>${Number(order.shipping_fee).toFixed(2)}</td>
                  <td>${Number(order.tax_amount).toFixed(2)}</td>
                  <td>{order.is_fraud ? "Fraud flag" : "Normal"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
