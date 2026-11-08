import { placeCatalogOrder } from "@/src/lib/catalog/queries";
import { placeCheckoutOrder } from "@/src/lib/catalog/checkout-orders";
import { createAdminClient } from "@/src/lib/supabase/admin";
import { actionResultToResponse } from "@/src/lib/catalog/http";
import { revalidateTag } from "next/cache";
import type { Order } from "@/src/types";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ ok: false, code: "VALIDATION_ERROR", error: "Request body must be valid JSON." }, { status: 400 });
  }
  const token = request.headers.get("authorization")?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return Response.json({ ok: false, error: "Sign in before placing an order." }, { status: 401 });
  try {
    const { data: { user }, error } = await createAdminClient().auth.getUser(token);
    if (error || !user) return Response.json({ ok: false, error: "Invalid login. Please sign in again." }, { status: 401 });
    const checkout = typeof payload === "object" && payload !== null && "customer" in payload;
    // Derive buyer identity from the verified token; never trust a browser-supplied buyer_id.
    const input = typeof payload === "object" && payload !== null && !Array.isArray(payload)
      ? { ...payload, buyer_id: user.id } : payload;
    const result = checkout ? await placeCheckoutOrder(input, user.id) : await placeCatalogOrder(input);
    if (result.ok) {
      revalidateTag("products", "max");
      revalidateTag(`product-${result.data.order.product_id}`, "max");
    }
    const response = actionResultToResponse<{ order: Order }>(result, 201);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return Response.json({ ok: false, error: "Unable to save your order." }, { status: 500 });
  }
}
