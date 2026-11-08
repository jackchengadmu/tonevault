import { z } from "zod";

const orderSchema = z.object({
  id: z.uuid(), product_id: z.uuid(), buyer_id: z.uuid(), quantity: z.number().int().positive(),
  total_amount: z.number().nonnegative().finite(), escrow_status: z.enum(["pending","paid","awaiting_shipment","shipped","delivered","approved","payout_released"]),
  tracking_number: z.string().nullable(), created_at: z.iso.datetime({offset:true}),
});
export type SavedOrder = z.infer<typeof orderSchema>;
export class OrderReadError extends Error {
  constructor(public readonly kind: "unavailable" | "missing" | "denied" | "invalid", message: string) { super(message); }
}

/** Proposed Member 3 read envelope. No server key, direct DB access or write fallback. */
export async function fetchSavedOrder(id: string, signal?: AbortSignal, fetcher: typeof fetch = fetch): Promise<SavedOrder> {
  if (!z.uuid().safeParse(id).success) throw new OrderReadError("invalid","Enter a valid saved order reference.");
  const response = await fetcher(`/api/orders/${encodeURIComponent(id)}`,{signal,cache:"no-store",headers:{Accept:"application/json"}});
  if ([401,403].includes(response.status)) throw new OrderReadError("denied","Sign in with an account authorized to view this order. Account access is not connected yet.");
  if (!response.headers.get("content-type")?.includes("application/json") || response.status===405 || response.status===501) throw new OrderReadError("unavailable","Saved order lookup is not connected yet. No confirmation can be verified.");
  const body = await response.json();
  if (response.status===404 && body?.code==="NOT_FOUND") throw new OrderReadError("missing","No accessible saved order was found for this reference.");
  if (!response.ok) throw new OrderReadError("unavailable","Unable to load this order. Try again later.");
  const parsed = z.object({ok:z.literal(true),data:z.object({order:orderSchema})}).safeParse(body);
  if (!parsed.success || parsed.data.data.order.id!==id) throw new OrderReadError("invalid","The order response could not be verified. No confirmation is displayed.");
  return parsed.data.data.order;
}
