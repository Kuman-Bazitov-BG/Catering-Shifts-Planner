import type { NextRequest } from "next/server";
import { getUserFromBearer } from "@/lib/api-auth";
import { joinShiftForUser } from "@/services/shifts";
import { apiJson, apiError, apiOptions } from "@/lib/api";

export function OPTIONS() {
  return apiOptions();
}

// POST /api/shifts/[id]/join -> join the shift (Bearer auth)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromBearer(req);
  if (!user) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const shiftId = Number(id);
  if (!Number.isInteger(shiftId)) return apiError("Invalid shift id.", 400);

  const res = await joinShiftForUser(user.id, shiftId);
  if ("error" in res) return apiError(res.error, res.status);
  return apiJson({ ok: true });
}
