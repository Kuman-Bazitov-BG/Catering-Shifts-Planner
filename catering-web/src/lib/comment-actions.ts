"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  addCommentForUser,
  updateCommentForUser,
  deleteCommentForUser,
} from "@/services/shifts";

export type CommentActionResult = { ok: true } | { error: string };

function refresh(shiftId: number) {
  revalidatePath(`/shifts/${shiftId}`);
}

export async function postComment(
  shiftId: number,
  body: string,
): Promise<CommentActionResult> {
  const user = await verifySession();
  const res = await addCommentForUser(user.id, shiftId, body);
  if ("error" in res) return { error: res.error };
  refresh(shiftId);
  return { ok: true };
}

export async function editComment(
  shiftId: number,
  commentId: number,
  body: string,
): Promise<CommentActionResult> {
  const user = await verifySession();
  const res = await updateCommentForUser(user.id, shiftId, commentId, body);
  if ("error" in res) return { error: res.error };
  refresh(shiftId);
  return { ok: true };
}

export async function removeComment(
  shiftId: number,
  commentId: number,
): Promise<CommentActionResult> {
  const user = await verifySession();
  const res = await deleteCommentForUser(user.id, shiftId, commentId);
  if ("error" in res) return { error: res.error };
  refresh(shiftId);
  return { ok: true };
}
