alter table public.orders add column if not exists predicted_fraud boolean;

create index if not exists idx_orders_predicted_fraud_true
  on public.orders (order_datetime desc)
  where predicted_fraud is true;
