import { backendFetch, apiSuccess, apiError } from "@/lib/api-config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const auth = request.headers.get("Authorization") ?? "";

  const query = new URLSearchParams();
  if (searchParams.get("employee_id"))
    query.set("employee_id", searchParams.get("employee_id")!);
  if (searchParams.get("is_status"))
    query.set("is_status", searchParams.get("is_status")!);
  if (searchParams.get("type")) query.set("type", searchParams.get("type")!);
  query.set("per_page", searchParams.get("per_page") ?? "50");
  query.set("page", searchParams.get("page") ?? "1");

  const result = await backendFetch(`/notifications?${query}`, {
    headers: { Authorization: auth },
  });
  if (!result.ok) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
