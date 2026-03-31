import { RunScoringButton } from "@/components/RunScoringButton";
import { getSupabaseServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type QueueRow = {
  order_id: number;
  customer_id: number;
  order_datetime: string;
  shipping_state: string | null;
  risk_score: number;
  order_total: number;
};

async function getQueueRows(): Promise<QueueRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("orders")
    .select("order_id,customer_id,order_datetime,shipping_state,risk_score,order_total")
    .order("risk_score", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as QueueRow[];
}

function toProbabilityPercent(riskScore: number): string {
  const percent = Math.min(99, Math.max(1, Math.round(Number(riskScore))));
  return `${percent}%`;
}

export default async function WarehousePage() {
  const queue = await getQueueRows();

  return (
    <main>
      <header className="header split">
        <div>
          <h1>Late Delivery Priority Queue</h1>
          <p className="subtitle">Top 50 orders ranked by predicted late-delivery probability.</p>
        </div>
        <RunScoringButton />
      </header>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Predicted Late Probability</th>
                <th>Order Total</th>
                <th>State</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((row, idx) => (
                <tr key={row.order_id}>
                  <td>{idx + 1}</td>
                  <td>{row.order_id}</td>
                  <td>
                    <a href={`/customers/${row.customer_id}`}>#{row.customer_id}</a>
                  </td>
                  <td>{toProbabilityPercent(Number(row.risk_score))}</td>
                  <td>${Number(row.order_total).toFixed(2)}</td>
                  <td>{row.shipping_state ?? "-"}</td>
                  <td>{new Date(row.order_datetime).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
