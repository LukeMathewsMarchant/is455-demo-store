import { getSupabaseServerClient } from "@/lib/supabase";

const PAGE_SIZE = 1000;

export type WarehouseOrderRow = {
  order_id: number;
  customer_id: number;
  order_datetime: string;
  shipping_state: string | null;
  order_total: number;
  predicted_fraud: boolean | null;
  is_fraud: boolean;
};

export async function fetchAllOrdersNewestFirst(): Promise<WarehouseOrderRow[]> {
  const supabase = getSupabaseServerClient();
  const select =
    "order_id,customer_id,order_datetime,shipping_state,order_total,predicted_fraud,is_fraud";
  const rows: WarehouseOrderRow[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("orders")
      .select(select)
      .order("order_datetime", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    const batch = (data ?? []) as WarehouseOrderRow[];
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) {
      break;
    }
    from += PAGE_SIZE;
  }

  return rows;
}
