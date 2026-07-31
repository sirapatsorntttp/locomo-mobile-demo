import { backendFetch, apiSuccess, apiError } from "@/lib/api-config";

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const auth = request.headers.get("Authorization") ?? "";

  const query = new URLSearchParams();
  if (searchParams.get("employee_id"))
    query.set("employee_id", searchParams.get("employee_id")!);

  const result = await backendFetch(`/notifications/read-all?${query}`, {
    method: "PATCH",
    headers: { Authorization: auth },
  });
  if (!result.ok) return apiError(result.error, result.status);
  return apiSuccess(result.data);
}
