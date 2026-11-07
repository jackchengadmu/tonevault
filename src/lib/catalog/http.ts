import type { ActionResult, CatalogErrorCode } from "@/src/types";

const STATUS_BY_CODE: Record<CatalogErrorCode, number> = {
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  NOT_AVAILABLE: 409,
  CONFLICT: 409,
  FORBIDDEN: 403,
  INTERNAL_ERROR: 500,
};

export function actionResultToResponse<T>(result: ActionResult<T>, successStatus = 200) {
  if (result.ok) {
    return Response.json(result, { status: successStatus });
  }

  return Response.json(result, { status: STATUS_BY_CODE[result.code] });
}

export function httpStatusFor(result: ActionResult<unknown>, successStatus = 200) {
  if (result.ok) return successStatus;
  return STATUS_BY_CODE[result.code];
}
