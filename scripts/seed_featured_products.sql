-- Seed helper to ensure featured products are active and available
update public.products
set is_active = true
where product_id in (1,2,3,4,5,6);
