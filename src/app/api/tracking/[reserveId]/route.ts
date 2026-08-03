import { backendFetch, apiSuccess, apiError } from "@/lib/api-config";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reserveId: string }> },
) {
  const { reserveId } = await params;
  const auth = request.headers.get("Authorization") ?? "";

  const result = await backendFetch(`/tracking/reserve/${reserveId}`, {
    headers: { Authorization: auth },
  });
  if (!result.ok) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
