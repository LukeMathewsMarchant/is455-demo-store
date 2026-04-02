import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

type PatchBody = {
  is_fraud?: unknown;
};

export async function PATCH(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const { orderId: rawId } = await context.params;
  const orderId = Number(rawId);
  if (!Number.isFinite(orderId) || orderId < 1) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.is_fraud !== "boolean") {
    return NextResponse.json({ error: "Body must include is_fraud (boolean)" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();

  const { data: existing, error: findErr } = await supabase
    .from("orders")
    .select("order_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (findErr) {
    return NextResponse.json({ error: findErr.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { error: upErr } = await supabase.from("orders").update({ is_fraud: body.is_fraud }).eq("order_id", orderId);

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
