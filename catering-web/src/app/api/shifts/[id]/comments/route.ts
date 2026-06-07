import type { NextRequest } from "next/server";
import { getUserFromBearer } from "@/lib/api-auth";
import { getShiftDetail, addCommentForUser } from "@/services/shifts";
import { apiJson, apiError, apiOptions } from "@/lib/api";

export function OPTIONS() {
  return apiOptions();
}

// GET /api/shifts/[id]/comments -> chronological list of comments (Bearer auth, members only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromBearer(req);
  if (!user) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const shiftId = Number(id);
  if (!Number.isInteger(shiftId)) return apiError("Invalid shift id.", 400);

  const shift = await getShiftDetail(shiftId, user.id);
  if (!shift) return apiError("Shift not found.", 404);
  if (!shift.isMember) {
    return apiError("You are not a member of this group.", 403);
  }

  return apiJson({ items: shift.comments });
}

// POST /api/shifts/[id]/comments  { body } -> add a comment (Bearer auth, members only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromBearer(req);
  if (!user) return apiError("Unauthorized.", 401);

  const { id } = await params;
  const shiftId = Number(id);
  if (!Number.isInteger(shiftId)) return apiError("Invalid shift id.", 400);

  let body: { body?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }
  const text = typeof body.body === "string" ? body.body : "";

  const res = await addCommentForUser(user.id, shiftId, text);
  if ("error" in res) return apiError(res.error, res.status);
  return apiJson({ ok: true }, 201);
}
