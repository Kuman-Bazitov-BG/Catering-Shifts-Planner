"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  leaveGroup,
  removeGroupMember,
  setGroupMemberRole,
  type MemberActionResult,
} from "@/services/groups";

export type MemberActionState = { error: string } | { ok: true };

// Removes the current user from the group, then sends them back to their groups list.
export async function leaveGroupAction(groupId: number): Promise<{ error: string } | undefined> {
  const user = await verifySession();
  const res = await leaveGroup(user.id, groupId);
  if ("error" in res) return { error: res.error };

  revalidatePath("/groups");
  redirect("/groups");
}

export async function removeMemberAction(
  groupId: number,
  targetUserId: number,
): Promise<MemberActionResult> {
  const user = await verifySession();
  const res = await removeGroupMember(user.id, groupId, targetUserId);
  if ("error" in res) return res;

  revalidatePath(`/groups/${groupId}/members`);
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}

export async function setMemberRoleAction(
  groupId: number,
  targetUserId: number,
  isManager: boolean,
): Promise<MemberActionResult> {
  const user = await verifySession();
  const res = await setGroupMemberRole(user.id, groupId, targetUserId, isManager);
  if ("error" in res) return res;

  revalidatePath(`/groups/${groupId}/members`);
  revalidatePath(`/groups/${groupId}`);
  return { ok: true };
}
