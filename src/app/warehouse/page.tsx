import { OrderFraudCheckbox } from "@/components/OrderFraudCheckbox";
import { RunScoringButton } from "@/components/RunScoringButton";
import { fetchAllOrdersNewestFirst } from "@/lib/warehouse-orders";

export const dynamic = "force-dynamic";

function formatPredictedFraud(value: boolean | null): string {
  if (value === null) {
    return "—";
  }
  return value ? "Yes" : "No";
}

export default async function WarehousePage() {
  const queue = await fetchAllOrdersNewestFirst();

  return (
    <main>
      <header className="header split">
        <div>
          <h1>Fraud review queue</h1>
          <p className="subtitle">
            All orders, newest first. Run scoring to fill model predictions; use the checkbox for admin fraud
            flags.
          </p>
        </div>
        <RunScoringButton />
      </header>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Predicted fraud</th>
                <th>Admin: fraud</th>
                <th>Order total</th>
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
                  <td>{formatPredictedFraud(row.predicted_fraud)}</td>
                  <td className="tableCheckbox">
                    <OrderFraudCheckbox orderId={row.order_id} initialChecked={row.is_fraud} />
                  </td>
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
