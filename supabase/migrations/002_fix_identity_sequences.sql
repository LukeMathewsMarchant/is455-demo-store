-- Fix Supabase identity sequences after bulk import with explicit IDs.
-- If you see errors like:
--   duplicate key value violates unique constraint "customers_pkey"
-- it usually means the identity/sequence value is behind MAX(id).

-- customers.customer_id
select setval(
  pg_get_serial_sequence('public.customers', 'customer_id'),
  coalesce((select max(customer_id) from public.customers), 0),
  true
);

-- products.product_id
select setval(
  pg_get_serial_sequence('public.products', 'product_id'),
  coalesce((select max(product_id) from public.products), 0),
  true
);

-- orders.order_id
select setval(
  pg_get_serial_sequence('public.orders', 'order_id'),
  coalesce((select max(order_id) from public.orders), 0),
  true
);

-- order_items.order_item_id
select setval(
  pg_get_serial_sequence('public.order_items', 'order_item_id'),
  coalesce((select max(order_item_id) from public.order_items), 0),
  true
);

-- shipments.shipment_id
select setval(
  pg_get_serial_sequence('public.shipments', 'shipment_id'),
  coalesce((select max(shipment_id) from public.shipments), 0),
  true
);

-- product_reviews.review_id
select setval(
  pg_get_serial_sequence('public.product_reviews', 'review_id'),
  coalesce((select max(review_id) from public.product_reviews), 0),
  true
);

