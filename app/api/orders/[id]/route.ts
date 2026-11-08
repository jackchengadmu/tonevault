import { createAdminClient } from "@/src/lib/supabase/admin";
import { productIdSchema } from "@/src/lib/validators/catalog";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = { "Cache-Control": "private, no-store" };
  const missing = () => Response.json({ ok: false, error: "Order not found." }, { status: 404, headers });
  if (!productIdSchema.safeParse(id).success) return missing();
  const accessToken = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!accessToken) return Response.json({ ok: false, error: "Sign in to view your order." }, { status: 401, headers });
  try {
    const supabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) return Response.json({ ok: false, error: "Invalid login." }, { status: 401, headers });
    // The admin client bypasses RLS, so scope every read to the verified buyer.
    const query = supabase.from("orders")
      .select("id, product_id, buyer_id, quantity, total_amount, escrow_status, tracking_number, created_at")
      .eq("id", id).eq("buyer_id", user.id);
    const { data: order, error } = await query.maybeSingle();
    if (error) throw error;
    if (!order) return missing();
    const { data: pricing, error: pricingError } = await supabase.from("order_pricing")
      .select("*").eq("order_id", order.id).maybeSingle();
    if (pricingError) throw pricingError;
    return Response.json({ ok: true, data: { pricing, order: {
      ...order, quantity: Number(order.quantity), total_amount: Number(order.total_amount),
    } } }, { headers });
  } catch {
    return Response.json({ ok: false, error: "Unable to retrieve order." }, { status: 500, headers });
  }
}
