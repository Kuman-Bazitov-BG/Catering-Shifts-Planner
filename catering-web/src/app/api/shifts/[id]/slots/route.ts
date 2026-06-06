import type { NextRequest } from "next/server";
import { getUserFromBearer } from "@/lib/api-auth";
import { setExtraSlotsForUser } from "@/services/shifts";
import { apiJson, apiError, apiOptions } from "@/lib/api";

export function OPTIONS() {
  return apiOptions();
}

// POST /api/shifts/[id]/slots  { extraSlots } -> set reserved extra slots (Bearer auth)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromBearer(req);
  if (!user) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const shiftId = Number(id);
  if (!Number.isInteger(shiftId)) return apiError("Invalid shift id.", 400);

  let body: { extraSlots?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const extraSlots = Number(body.extraSlots);
  if (!Number.isFinite(extraSlots)) {
    return apiError("`extraSlots` must be a number.", 400);
  }

  const res = await setExtraSlotsForUser(user.id, shiftId, extraSlots);
  if ("error" in res) return apiError(res.error, res.status);
  return apiJson({ ok: true });
}
