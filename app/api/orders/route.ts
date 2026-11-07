import { placeCatalogOrder } from "@/src/lib/catalog/queries";
import { actionResultToResponse } from "@/src/lib/catalog/http";
import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        ok: false,
        code: "VALIDATION_ERROR",
        error: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const result = await placeCatalogOrder(payload);

  if (result.ok) {
    revalidateTag("products", "max");
    revalidateTag(`product-${result.data.order.product_id}`, "max");
  }

  return actionResultToResponse(result, 201);
}
