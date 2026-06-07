import type { NextRequest } from "next/server";
import { getUserFromBearer } from "@/lib/api-auth";
import { updateCommentForUser, deleteCommentForUser } from "@/services/shifts";
import { apiJson, apiError, apiOptions } from "@/lib/api";

export function OPTIONS() {
  return apiOptions();
}

function parseIds(idParam: string, commentIdParam: string) {
  const shiftId = Number(idParam);
  const commentId = Number(commentIdParam);
  if (!Number.isInteger(shiftId) || !Number.isInteger(commentId)) return null;
  return { shiftId, commentId };
}

// PUT /api/shifts/[id]/comments/[commentId]  { body } -> edit own comment (or any, if manager)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const user = await getUserFromBearer(req);
  if (!user) return apiError("Unauthorized.", 401);

  const { id, commentId: commentIdParam } = await params;
  const ids = parseIds(id, commentIdParam);
  if (!ids) return apiError("Invalid shift or comment id.", 400);

  let body: { body?: unknown };
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }
  const text = typeof body.body === "string" ? body.body : "";

  const res = await updateCommentForUser(user.id, ids.shiftId, ids.commentId, text);
  if ("error" in res) return apiError(res.error, res.status);
  return apiJson({ ok: true });
}

// DELETE /api/shifts/[id]/comments/[commentId] -> delete own comment (or any, if manager)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  const user = await getUserFromBearer(req);
  if (!user) return apiError("Unauthorized.", 401);

  const { id, commentId: commentIdParam } = await params;
  const ids = parseIds(id, commentIdParam);
  if (!ids) return apiError("Invalid shift or comment id.", 400);

  const res = await deleteCommentForUser(user.id, ids.shiftId, ids.commentId);
  if ("error" in res) return apiError(res.error, res.status);
  return apiJson({ ok: true });
}
