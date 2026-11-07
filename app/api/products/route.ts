import { queryProducts } from "@/src/lib/catalog/queries";
import { actionResultToResponse } from "@/src/lib/catalog/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = Object.fromEntries(url.searchParams.entries());

  if (filters.search && !filters.query) {
    filters.query = filters.search;
  }

  const result = await queryProducts(filters);

  if (!result.ok) {
    return actionResultToResponse(result);
  }

  // Challenge 1: unmatched keyword search is 200 with an empty list, not 404.
  return Response.json(
    {
      ok: true,
      data: result.data.products,
      products: result.data.products,
      count: result.data.count,
    },
    { status: 200 },
  );
}
