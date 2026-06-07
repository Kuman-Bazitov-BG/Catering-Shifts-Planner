"use server";

import { verifySession } from "@/lib/dal";
import { createGroupInvite } from "@/services/groups";

export type CreateInviteActionResult = { ok: true; code: string } | { error: string };

// Generates a fresh one-time invite code for the group. Managers only.
export async function createInviteAction(groupId: number): Promise<CreateInviteActionResult> {
  const user = await verifySession();
  const res = await createGroupInvite(user.id, groupId);
  if ("error" in res) return { error: res.error };
  return { ok: true, code: res.code };
}
