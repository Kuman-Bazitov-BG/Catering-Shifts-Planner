import type { NextRequest } from "next/server";
import { getUserFromBearer } from "@/lib/api-auth";
import { getActiveShiftsPaged } from "@/services/shifts";
import { apiJson, apiError, apiOptions } from "@/lib/api";

export function OPTIONS() {
  return apiOptions();
}

// GET /api/shifts?page=1&pageSize=10 -> paged active shifts (Bearer auth)
export async function GET(req: NextRequest) {
  const user = await getUserFromBearer(req);
  if (!user) return apiError("Unauthorized.", 401);

  const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
  const pageSize = Number(req.nextUrl.searchParams.get("pageSize") ?? "10");
  const search = req.nextUrl.searchParams.get("search") ?? undefined;

  const result = await getActiveShiftsPaged(user.id, page, pageSize, search);
  return apiJson(result);
}
