import { getSupabaseServerClient } from "@/lib/supabase";
import type { Customer } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getCustomers(): Promise<Customer[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("customer_id,full_name,email,zip_code,city,state")
    .eq("is_active", true)
    .order("customer_id", { ascending: true })
    .limit(150);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Customer[];
}

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <main>
      <header className="header">
        <h1>Select Customer</h1>
        <p className="subtitle">No login needed. Pick a customer profile to continue.</p>
      </header>

      <section className="card">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Location</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customer_id}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.full_name}</td>
                  <td>{customer.email}</td>
                  <td>{[customer.city, customer.state].filter(Boolean).join(", ") || "-"}</td>
                  <td>
                    <a className="linkButton small" href={`/customers/${customer.customer_id}`}>
                      View dashboard
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
