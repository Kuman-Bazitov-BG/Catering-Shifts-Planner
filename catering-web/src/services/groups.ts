import "server-only";
import { randomBytes } from "crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  groups,
  groupMembers,
  groupInvites,
  shifts,
  shiftJoins,
  shiftComments,
  users,
} from "@/db/schema";
import { computeShiftState, type ShiftSummary } from "./shifts";

async function ensureGroupManager(
  userId: number,
  groupId: number,
): Promise<{ ok: true } | { error: string; status: number }> {
  const membership = await db
    .select({ isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  if (membership.length === 0 || !membership[0].isManager) {
    return { error: "You must be a manager of this group to do that.", status: 403 };
  }
  return { ok: true };
}

export type GroupSummary = {
  id: number;
  title: string;
  description: string | null;
  memberCount: number;
  shiftCount: number;
  isManager: boolean;
};

// Groups the user is a member of, with member/shift counts and the user's role.
export async function getUserGroups(userId: number): Promise<GroupSummary[]> {
  const rows = await db
    .select({
      id: groups.id,
      title: groups.title,
      description: groups.description,
      isManager: groupMembers.isManager,
      memberCount: sql<number>`(select count(*)::int from ${groupMembers} where ${groupMembers.groupId} = ${groups.id})`,
      shiftCount: sql<number>`(select count(*)::int from ${shifts} where ${shifts.groupId} = ${groups.id})`,
    })
    .from(groups)
    .innerJoin(
      groupMembers,
      and(eq(groupMembers.groupId, groups.id), eq(groupMembers.userId, userId)),
    )
    .orderBy(groups.title);

  return rows;
}

export type GroupMemberInfo = {
  userId: number;
  name: string;
  isManager: boolean;
};

export type GroupDetail = {
  id: number;
  title: string;
  description: string | null;
  createdBy: number;
  isMember: boolean;
  isManager: boolean;
  managers: GroupMemberInfo[];
  members: GroupMemberInfo[];
  shifts: ShiftSummary[];
};

// Full group details, including managers, members, and shifts.
// Only members may see the roster and shifts; non-members get `isMember: false`.
export async function getGroupDetail(
  groupId: number,
  userId: number,
): Promise<GroupDetail | null> {
  const rows = await db
    .select({
      id: groups.id,
      title: groups.title,
      description: groups.description,
      createdBy: groups.createdBy,
    })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  const group = rows[0];
  if (!group) return null;

  const membership = await db
    .select({ userId: groupMembers.userId, isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  const isMember = membership.length > 0;
  const isManager = membership[0]?.isManager ?? false;

  if (!isMember) {
    return {
      ...group,
      isMember: false,
      isManager: false,
      managers: [],
      members: [],
      shifts: [],
    };
  }

  const allMembers = await db
    .select({
      userId: groupMembers.userId,
      name: users.name,
      isManager: groupMembers.isManager,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(users.name);

  const managers = allMembers.filter((m) => m.isManager);
  const members = allMembers.filter((m) => !m.isManager);

  const shiftRows = await db
    .select({
      id: shifts.id,
      title: shifts.title,
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      location: shifts.location,
      capacity: shifts.capacity,
      canceled: shifts.canceled,
      staffCount: sql<number>`(select coalesce(sum(1 + ${shiftJoins.extraSlots}), 0)::int from ${shiftJoins} where ${shiftJoins.shiftId} = ${shifts.id})`,
      commentCount: sql<number>`(select count(*)::int from ${shiftComments} where ${shiftComments.shiftId} = ${shifts.id})`,
    })
    .from(shifts)
    .where(eq(shifts.groupId, groupId))
    .orderBy(sql`(${shifts.date} + ${shifts.startTime}) desc`);

  const groupShifts: ShiftSummary[] = shiftRows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    location: r.location,
    capacity: r.capacity,
    groupId,
    groupTitle: group.title,
    staffCount: r.staffCount,
    commentCount: r.commentCount,
    state: computeShiftState(r.date, r.startTime, r.capacity, r.canceled, r.staffCount),
  }));

  return {
    ...group,
    isMember: true,
    isManager,
    managers,
    members,
    shifts: groupShifts,
  };
}

export type CreateInviteResult =
  | { ok: true; code: string }
  | { error: string; status: number };

// Generates a one-time invite code for the group. Managers only.
export async function createGroupInvite(
  userId: number,
  groupId: number,
): Promise<CreateInviteResult> {
  const check = await ensureGroupManager(userId, groupId);
  if ("error" in check) return check;

  const code = randomBytes(20).toString("hex");
  await db.insert(groupInvites).values({ groupId, token: code });

  return { ok: true, code };
}

export type AcceptInviteResult =
  | { ok: true; groupId: number; groupTitle: string }
  | { error: string };

// Redeems an invite code: joins the user to the group as a member.
// Each code is valid for exactly one person, regardless of who uses it.
export async function acceptGroupInvite(
  userId: number,
  groupId: number,
  code: string,
): Promise<AcceptInviteResult> {
  const groupRows = await db
    .select({ id: groups.id, title: groups.title })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  const group = groupRows[0];
  if (!group) return { error: "This invite link is invalid." };

  const inviteRows = await db
    .select()
    .from(groupInvites)
    .where(and(eq(groupInvites.groupId, groupId), eq(groupInvites.token, code)))
    .limit(1);
  const invite = inviteRows[0];
  if (!invite) return { error: "This invite link is invalid." };

  const membership = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  if (membership.length > 0) {
    return { error: "You are already a member of this group." };
  }

  // Atomically claim the invite: only succeeds if it hasn't been used yet.
  const claimed = await db
    .update(groupInvites)
    .set({ usedAt: new Date(), usedBy: userId })
    .where(and(eq(groupInvites.id, invite.id), isNull(groupInvites.usedAt)))
    .returning({ id: groupInvites.id });
  if (claimed.length === 0) {
    return { error: "This invite link has already been used by another person." };
  }

  await db.insert(groupMembers).values({ groupId, userId, isManager: false });

  return { ok: true, groupId: group.id, groupTitle: group.title };
}

async function countGroupManagers(groupId: number): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.isManager, true)));
  return rows[0]?.count ?? 0;
}

export type MemberActionResult = { ok: true } | { error: string };

// Removes the user from the group. The sole remaining manager cannot leave —
// they must promote someone else first so the group always keeps a manager.
export async function leaveGroup(userId: number, groupId: number): Promise<MemberActionResult> {
  const membership = await db
    .select({ isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  if (membership.length === 0) {
    return { error: "You are not a member of this group." };
  }

  if (membership[0].isManager && (await countGroupManagers(groupId)) <= 1) {
    return {
      error:
        "You are the only manager of this group. Promote another member to manager before leaving.",
    };
  }

  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

  return { ok: true };
}

// Removes another member from the group. Managers only; cannot remove yourself
// (use `leaveGroup`) or the group's only manager.
export async function removeGroupMember(
  actingUserId: number,
  groupId: number,
  targetUserId: number,
): Promise<MemberActionResult> {
  const check = await ensureGroupManager(actingUserId, groupId);
  if ("error" in check) return { error: check.error };

  if (actingUserId === targetUserId) {
    return { error: 'Use "Leave group" to remove yourself.' };
  }

  const target = await db
    .select({ isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)))
    .limit(1);
  if (target.length === 0) {
    return { error: "This person is not a member of the group." };
  }

  if (target[0].isManager && (await countGroupManagers(groupId)) <= 1) {
    return { error: "You can't remove the only manager of this group." };
  }

  await db
    .delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

  return { ok: true };
}

// Promotes a member to manager or demotes a manager to member. Managers only;
// the group's only manager cannot be demoted.
export async function setGroupMemberRole(
  actingUserId: number,
  groupId: number,
  targetUserId: number,
  isManager: boolean,
): Promise<MemberActionResult> {
  const check = await ensureGroupManager(actingUserId, groupId);
  if ("error" in check) return { error: check.error };

  const target = await db
    .select({ isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)))
    .limit(1);
  if (target.length === 0) {
    return { error: "This person is not a member of the group." };
  }
  if (target[0].isManager === isManager) {
    return { ok: true };
  }

  if (!isManager && (await countGroupManagers(groupId)) <= 1) {
    return { error: "You can't demote the only manager of this group." };
  }

  await db
    .update(groupMembers)
    .set({ isManager })
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

  return { ok: true };
}
