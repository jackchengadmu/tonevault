import { queryProductById } from "@/src/lib/catalog/queries";
import { actionResultToResponse } from "@/src/lib/catalog/http";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!id) {
    return Response.json(
      { ok: false, code: "NOT_FOUND", error: "Instrument not found." },
      { status: 404 },
    );
  }

  const result = await queryProductById(id);
  return actionResultToResponse(result);
}
