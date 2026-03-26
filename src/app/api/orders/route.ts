import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { onOrderCreatedForMlr } from "@/lib/mlr-hook";
import type { CreateOrderInput } from "@/lib/types";

const TAX_RATE = 0.07;
const SHIPPING_FEE = 5;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderInput;
    if (!body.fullName || !body.email || !body.zipCode || body.quantity < 1) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("customer_id")
      .eq("email", body.email)
      .maybeSingle();

    let customerId = existingCustomer?.customer_id as number | undefined;

    if (!customerId) {
      const { data: insertedCustomer, error: customerErr } = await supabase
        .from("customers")
        .insert({
          full_name: body.fullName,
          email: body.email,
          gender: "Non-binary",
          birthdate: "1990-01-01",
          created_at: new Date().toISOString(),
          zip_code: body.zipCode,
          customer_segment: "standard",
          loyalty_tier: "none",
          is_active: true
        })
        .select("customer_id")
        .single();

      if (customerErr || !insertedCustomer) {
        throw new Error(customerErr?.message ?? "Failed to create customer");
      }

      customerId = insertedCustomer.customer_id;
    }


    if (!customerId) {
      throw new Error("Failed to resolve customer id");
    }

    const { data: product, error: productErr } = await supabase
      .from("products")
      .select("product_id,price")
      .eq("product_id", body.productId)
      .single();

    if (productErr || !product) {
      throw new Error(productErr?.message ?? "Product not found");
    }

    const subtotal = Number(product.price) * body.quantity;
    const tax = Number((subtotal * TAX_RATE).toFixed(2));
    const total = Number((subtotal + SHIPPING_FEE + tax).toFixed(2));

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        customer_id: customerId,
        order_datetime: new Date().toISOString(),
        billing_zip: body.zipCode,
        shipping_zip: body.zipCode,
        shipping_state: "CA",
        payment_method: "demo",
        device_type: "desktop",
        ip_country: "US",
        promo_used: false,
        promo_code: null,
        order_subtotal: subtotal,
        shipping_fee: SHIPPING_FEE,
        tax_amount: tax,
        order_total: total,
        risk_score: 0,
        is_fraud: false
      })
      .select("order_id")
      .single();

    if (orderErr || !order) {
      throw new Error(orderErr?.message ?? "Failed to create order");
    }

    const { error: itemErr } = await supabase.from("order_items").insert({
      order_id: order.order_id,
      product_id: body.productId,
      quantity: body.quantity,
      unit_price: Number(product.price),
      line_total: subtotal
    });

    if (itemErr) {
      throw new Error(itemErr.message);
    }

    await onOrderCreatedForMlr({
      orderId: order.order_id,
      customerId,
      productId: body.productId,
      quantity: body.quantity,
      orderTotal: total,
      shippingState: "CA",
      promoUsed: false,
      deviceType: "desktop",
      ipCountry: "US"
    });

    return NextResponse.json({ orderId: order.order_id, total });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
