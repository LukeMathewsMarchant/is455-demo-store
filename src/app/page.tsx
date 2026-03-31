export default function HomePage() {
  return (
    <main>
      <header className="header">
        <h1>IS455 Demo Store</h1>
        <p className="subtitle">End-to-end class demo: customer ops, ordering, and warehouse queue.</p>
      </header>

      <section className="grid two-col">
        <article className="card">
          <h3>Select Customer</h3>
          <p className="subtitle">Choose a customer to view dashboard, place orders, and inspect history.</p>
          <a className="linkButton" href="/customers">Open customer screen</a>
        </article>

        <article className="card">
          <h3>Warehouse Priority Queue</h3>
          <p className="subtitle">Top 50 orders by predicted late-delivery probability for operations review.</p>
          <a className="linkButton" href="/warehouse">Open warehouse page</a>
        </article>
      </section>
    </main>
  );
}
