import { backendFetch, apiSuccess, apiError } from "@/lib/api-config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const auth = request.headers.get("Authorization") ?? "";

  const query = new URLSearchParams();
  if (searchParams.get("route_id"))
    query.set("route_id", searchParams.get("route_id")!);

  const result = await backendFetch(`/tracking/active?${query}`, {
    headers: { Authorization: auth },
  });
  if (!result.ok) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
