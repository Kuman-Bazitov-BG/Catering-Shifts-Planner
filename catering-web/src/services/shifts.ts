import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  shifts,
  groups,
  groupMembers,
  shiftJoins,
  shiftComments,
  users,
} from "@/db/schema";

const CURRENT_WINDOW_MS = 60 * 60 * 1000; // a shift is "current" for 1h after start

export type ShiftState = {
  temporal: "upcoming" | "current" | "past";
  capacity: "under" | "full" | "over";
  canceled: boolean;
  // Open to join/unjoin: upcoming or current, and not canceled.
  isActive: boolean;
};

export type ShiftSummary = {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  capacity: number;
  groupId: number;
  groupTitle: string;
  staffCount: number;
  commentCount: number;
  state: ShiftState;
};

export type ShiftStaff = {
  userId: number;
  name: string;
  extraSlots: number;
};

export type ShiftComment = {
  id: number;
  userId: number;
  authorName: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
};

export type ShiftDetail = ShiftSummary & {
  isMember: boolean;
  // Whether the current user manages the shift's group (can edit/delete any comment).
  currentUserIsManager: boolean;
  staff: ShiftStaff[];
  comments: ShiftComment[];
  // The current user's reserved extra slots, or null if they have not joined.
  currentUserExtraSlots: number | null;
};

// Combines a shift's `date` (YYYY-MM-DD) and `startTime` (HH:MM:SS) into a Date.
function shiftStart(date: string, startTime: string): Date {
  return new Date(`${date}T${startTime}`);
}

export function computeShiftState(
  date: string,
  startTime: string,
  capacity: number,
  canceled: boolean,
  staffCount: number,
  now: Date = new Date(),
): ShiftState {
  const start = shiftStart(date, startTime);
  const currentEnd = new Date(start.getTime() + CURRENT_WINDOW_MS);

  let temporal: ShiftState["temporal"];
  if (now < start) temporal = "upcoming";
  else if (now <= currentEnd) temporal = "current";
  else temporal = "past";

  let cap: ShiftState["capacity"];
  if (staffCount < capacity) cap = "under";
  else if (staffCount === capacity) cap = "full";
  else cap = "over";

  const isActive = !canceled && (temporal === "upcoming" || temporal === "current");

  return { temporal, capacity: cap, canceled, isActive };
}

export function formatShiftDateTime(date: string, startTime: string): string {
  return shiftStart(date, startTime).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Dashboard shifts with server-side paging ────────────────────────────────

export type PagedShiftSummaries = {
  items: ShiftSummary[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

// A shift counts as "active" (open for joining) when it is not canceled and its
// current window (start + 1h) has not yet passed; "archive" is the complement.
const ACTIVE_SHIFT_SQL = sql`${shifts.canceled} = false and (${shifts.date} + ${shifts.startTime} + interval '1 hour') >= now()::timestamp`;
const ARCHIVE_SHIFT_SQL = sql`not (${shifts.canceled} = false and (${shifts.date} + ${shifts.startTime} + interval '1 hour') >= now()::timestamp)`;

// One page of a user's group shifts matching `condition`, ordered by `orderBy`.
// Filtering, ordering, and paging all happen in SQL so large datasets stay fast.
async function getGroupShiftsPage(
  userId: number,
  condition: ReturnType<typeof sql>,
  orderBy: ReturnType<typeof sql>,
  page: number,
  pageSize: number,
): Promise<PagedShiftSummaries> {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const safeSize = Math.min(50, Math.max(1, Math.trunc(pageSize) || 9));
  const offset = (safePage - 1) * safeSize;

  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shifts)
    .innerJoin(
      groupMembers,
      and(
        eq(groupMembers.groupId, shifts.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .where(condition);
  const total = totalRows[0]?.count ?? 0;

  const rows = await db
    .select({
      id: shifts.id,
      title: shifts.title,
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      location: shifts.location,
      capacity: shifts.capacity,
      canceled: shifts.canceled,
      groupId: shifts.groupId,
      groupTitle: groups.title,
      staffCount: sql<number>`(select coalesce(sum(1 + ${shiftJoins.extraSlots}), 0)::int from ${shiftJoins} where ${shiftJoins.shiftId} = ${shifts.id})`,
      commentCount: sql<number>`(select count(*)::int from ${shiftComments} where ${shiftComments.shiftId} = ${shifts.id})`,
    })
    .from(shifts)
    .innerJoin(groups, eq(groups.id, shifts.groupId))
    .innerJoin(
      groupMembers,
      and(
        eq(groupMembers.groupId, shifts.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .where(condition)
    .orderBy(orderBy)
    .limit(safeSize)
    .offset(offset);

  const items: ShiftSummary[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    location: r.location,
    capacity: r.capacity,
    groupId: r.groupId,
    groupTitle: r.groupTitle,
    staffCount: r.staffCount,
    commentCount: r.commentCount,
    state: computeShiftState(r.date, r.startTime, r.capacity, r.canceled, r.staffCount),
  }));

  return {
    items,
    page: safePage,
    pageSize: safeSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

// Active and archive shifts for the dashboard, each paged independently.
export async function getDashboardShiftsPaged(
  userId: number,
  opts: { activePage: number; archivePage: number; pageSize: number },
): Promise<{ active: PagedShiftSummaries; archive: PagedShiftSummaries }> {
  const [active, archive] = await Promise.all([
    getGroupShiftsPage(
      userId,
      ACTIVE_SHIFT_SQL,
      sql`(${shifts.date} + ${shifts.startTime}) asc`, // soonest first
      opts.activePage,
      opts.pageSize,
    ),
    getGroupShiftsPage(
      userId,
      ARCHIVE_SHIFT_SQL,
      sql`(${shifts.date} + ${shifts.startTime}) desc`, // most recent first
      opts.archivePage,
      opts.pageSize,
    ),
  ]);

  return { active, archive };
}

// Full details for a single shift, including the joined staff list.
export async function getShiftDetail(
  shiftId: number,
  userId: number,
): Promise<ShiftDetail | null> {
  const rows = await db
    .select({
      id: shifts.id,
      title: shifts.title,
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      location: shifts.location,
      capacity: shifts.capacity,
      canceled: shifts.canceled,
      groupId: shifts.groupId,
      groupTitle: groups.title,
    })
    .from(shifts)
    .innerJoin(groups, eq(groups.id, shifts.groupId))
    .where(eq(shifts.id, shiftId))
    .limit(1);

  const shift = rows[0];
  if (!shift) return null;

  const membership = await db
    .select({ userId: groupMembers.userId, isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, shift.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);
  const isMember = membership.length > 0;
  const currentUserIsManager = membership[0]?.isManager ?? false;

  const staff = await db
    .select({
      userId: shiftJoins.userId,
      name: users.name,
      extraSlots: shiftJoins.extraSlots,
    })
    .from(shiftJoins)
    .innerJoin(users, eq(users.id, shiftJoins.userId))
    .where(eq(shiftJoins.shiftId, shiftId));

  const staffCount = staff.reduce((sum, s) => sum + 1 + s.extraSlots, 0);
  const mine = staff.find((s) => s.userId === userId);
  const currentUserExtraSlots = mine ? mine.extraSlots : null;

  const comments = await db
    .select({
      id: shiftComments.id,
      userId: shiftComments.userId,
      authorName: users.name,
      body: shiftComments.body,
      createdAt: shiftComments.createdAt,
      editedAt: shiftComments.editedAt,
    })
    .from(shiftComments)
    .innerJoin(users, eq(users.id, shiftComments.userId))
    .where(eq(shiftComments.shiftId, shiftId))
    .orderBy(shiftComments.createdAt);

  return {
    id: shift.id,
    title: shift.title,
    date: shift.date,
    startTime: shift.startTime,
    endTime: shift.endTime,
    location: shift.location,
    capacity: shift.capacity,
    groupId: shift.groupId,
    groupTitle: shift.groupTitle,
    staffCount,
    commentCount: comments.length,
    state: computeShiftState(
      shift.date,
      shift.startTime,
      shift.capacity,
      shift.canceled,
      staffCount,
    ),
    isMember,
    currentUserIsManager,
    staff,
    comments,
    currentUserExtraSlots,
  };
}

// ── Active shifts with server-side paging (REST API) ────────────────────────

export type PagedActiveShifts = {
  items: (ShiftSummary & { isJoined: boolean })[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

// A shift is "active" (open for joining) when it is not canceled and its current
// window (start + 1h) has not yet passed. Filtered, ordered, and paged in SQL.
export async function getActiveShiftsPaged(
  userId: number,
  page: number,
  pageSize: number,
): Promise<PagedActiveShifts> {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const safeSize = Math.min(50, Math.max(1, Math.trunc(pageSize) || 10));
  const offset = (safePage - 1) * safeSize;

  const activeCondition = sql`${shifts.canceled} = false and (${shifts.date} + ${shifts.startTime} + interval '1 hour') >= now()::timestamp`;

  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shifts)
    .innerJoin(
      groupMembers,
      and(
        eq(groupMembers.groupId, shifts.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .where(activeCondition);
  const total = totalRows[0]?.count ?? 0;

  const rows = await db
    .select({
      id: shifts.id,
      title: shifts.title,
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      location: shifts.location,
      capacity: shifts.capacity,
      canceled: shifts.canceled,
      groupId: shifts.groupId,
      groupTitle: groups.title,
      staffCount: sql<number>`(select coalesce(sum(1 + ${shiftJoins.extraSlots}), 0)::int from ${shiftJoins} where ${shiftJoins.shiftId} = ${shifts.id})`,
      commentCount: sql<number>`(select count(*)::int from ${shiftComments} where ${shiftComments.shiftId} = ${shifts.id})`,
      isJoined: sql<boolean>`exists(select 1 from ${shiftJoins} where ${shiftJoins.shiftId} = ${shifts.id} and ${shiftJoins.userId} = ${userId})`,
    })
    .from(shifts)
    .innerJoin(groups, eq(groups.id, shifts.groupId))
    .innerJoin(
      groupMembers,
      and(
        eq(groupMembers.groupId, shifts.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .where(activeCondition)
    .orderBy(sql`(${shifts.date} + ${shifts.startTime}) asc`)
    .limit(safeSize)
    .offset(offset);

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date,
    startTime: r.startTime,
    endTime: r.endTime,
    location: r.location,
    capacity: r.capacity,
    groupId: r.groupId,
    groupTitle: r.groupTitle,
    staffCount: r.staffCount,
    commentCount: r.commentCount,
    state: computeShiftState(
      r.date,
      r.startTime,
      r.capacity,
      r.canceled,
      r.staffCount,
    ),
    isJoined: r.isJoined,
  }));

  return {
    items,
    page: safePage,
    pageSize: safeSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

// ── Participation mutations (shared by Server Actions + REST API) ────────────

export type MutationResult = { ok: true } | { error: string; status: number };

const MAX_EXTRA_SLOTS = 3;

// The user must be a member of the shift's group and the shift must be active.
async function ensureCanParticipate(
  userId: number,
  shiftId: number,
): Promise<MutationResult> {
  const rows = await db
    .select({
      groupId: shifts.groupId,
      date: shifts.date,
      startTime: shifts.startTime,
      capacity: shifts.capacity,
      canceled: shifts.canceled,
    })
    .from(shifts)
    .where(eq(shifts.id, shiftId))
    .limit(1);

  const shift = rows[0];
  if (!shift) return { error: "Shift not found.", status: 404 };

  const member = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, shift.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);
  if (member.length === 0) {
    return { error: "You are not a member of this group.", status: 403 };
  }

  const state = computeShiftState(
    shift.date,
    shift.startTime,
    shift.capacity,
    shift.canceled,
    0,
  );
  if (!state.isActive) {
    return {
      error: "This shift is not open for joining or leaving.",
      status: 409,
    };
  }

  return { ok: true };
}

export async function joinShiftForUser(
  userId: number,
  shiftId: number,
): Promise<MutationResult> {
  const check = await ensureCanParticipate(userId, shiftId);
  if ("error" in check) return check;

  const existing = await db
    .select({ id: shiftJoins.id })
    .from(shiftJoins)
    .where(and(eq(shiftJoins.shiftId, shiftId), eq(shiftJoins.userId, userId)))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(shiftJoins).values({ shiftId, userId, extraSlots: 0 });
  }

  return { ok: true };
}

export async function leaveShiftForUser(
  userId: number,
  shiftId: number,
): Promise<MutationResult> {
  const check = await ensureCanParticipate(userId, shiftId);
  if ("error" in check) return check;

  await db
    .delete(shiftJoins)
    .where(and(eq(shiftJoins.shiftId, shiftId), eq(shiftJoins.userId, userId)));

  return { ok: true };
}

export async function setExtraSlotsForUser(
  userId: number,
  shiftId: number,
  extraSlots: number,
): Promise<MutationResult> {
  const check = await ensureCanParticipate(userId, shiftId);
  if ("error" in check) return check;

  const clamped = Math.max(0, Math.min(MAX_EXTRA_SLOTS, Math.trunc(extraSlots)));

  const updated = await db
    .update(shiftJoins)
    .set({ extraSlots: clamped })
    .where(and(eq(shiftJoins.shiftId, shiftId), eq(shiftJoins.userId, userId)))
    .returning({ id: shiftJoins.id });

  if (updated.length === 0) {
    return { error: "You have not joined this shift yet.", status: 409 };
  }

  return { ok: true };
}

// ── Shift comments (group members can post; owners and managers can edit/delete) ──

const MAX_COMMENT_LENGTH = 1000;

function validateCommentBody(body: string): { error: string; status: number } | null {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Comment cannot be empty.", status: 400 };
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return {
      error: `Comment is too long (max ${MAX_COMMENT_LENGTH} characters).`,
      status: 400,
    };
  }
  return null;
}

// Resolves the user's membership (and manager status) in a shift's group.
async function getShiftMembership(
  userId: number,
  shiftId: number,
): Promise<{ ok: true; isManager: boolean } | { error: string; status: number }> {
  const rows = await db
    .select({ groupId: shifts.groupId })
    .from(shifts)
    .where(eq(shifts.id, shiftId))
    .limit(1);

  const shift = rows[0];
  if (!shift) return { error: "Shift not found.", status: 404 };

  const member = await db
    .select({ isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, shift.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);
  if (member.length === 0) {
    return { error: "You are not a member of this group.", status: 403 };
  }

  return { ok: true, isManager: member[0].isManager };
}

export async function addCommentForUser(
  userId: number,
  shiftId: number,
  body: string,
): Promise<MutationResult> {
  const invalid = validateCommentBody(body);
  if (invalid) return invalid;

  const membership = await getShiftMembership(userId, shiftId);
  if ("error" in membership) return membership;

  await db.insert(shiftComments).values({ shiftId, userId, body: body.trim() });
  return { ok: true };
}

export async function updateCommentForUser(
  userId: number,
  shiftId: number,
  commentId: number,
  body: string,
): Promise<MutationResult> {
  const invalid = validateCommentBody(body);
  if (invalid) return invalid;

  const membership = await getShiftMembership(userId, shiftId);
  if ("error" in membership) return membership;

  const rows = await db
    .select({ userId: shiftComments.userId })
    .from(shiftComments)
    .where(and(eq(shiftComments.id, commentId), eq(shiftComments.shiftId, shiftId)))
    .limit(1);
  const comment = rows[0];
  if (!comment) return { error: "Comment not found.", status: 404 };
  if (comment.userId !== userId && !membership.isManager) {
    return { error: "You can only edit your own comments.", status: 403 };
  }

  await db
    .update(shiftComments)
    .set({ body: body.trim(), editedAt: new Date() })
    .where(eq(shiftComments.id, commentId));

  return { ok: true };
}

// ── Shift management (group managers can create / edit / cancel / delete) ────

// Verifies the user manages the given group; used by shift create/edit/delete.
async function ensureGroupManager(
  userId: number,
  groupId: number,
): Promise<{ ok: true } | { error: string; status: number }> {
  const member = await db
    .select({ isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  if (member.length === 0 || !member[0].isManager) {
    return { error: "You must be a manager of this group to do that.", status: 403 };
  }
  return { ok: true };
}

export type ShiftWriteInput = {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  capacity: number;
};

export type ShiftEditInfo = {
  id: number;
  groupId: number;
  groupTitle: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string | null;
  capacity: number;
  canceled: boolean;
  isManager: boolean;
};

// Shift info for the edit/delete pages, including whether the current user
// manages the shift's group (the pages show "access denied" when false).
export async function getShiftEditInfo(
  shiftId: number,
  userId: number,
): Promise<ShiftEditInfo | null> {
  const rows = await db
    .select({
      id: shifts.id,
      groupId: shifts.groupId,
      groupTitle: groups.title,
      title: shifts.title,
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      location: shifts.location,
      capacity: shifts.capacity,
      canceled: shifts.canceled,
    })
    .from(shifts)
    .innerJoin(groups, eq(groups.id, shifts.groupId))
    .where(eq(shifts.id, shiftId))
    .limit(1);

  const shift = rows[0];
  if (!shift) return null;

  const membership = await db
    .select({ isManager: groupMembers.isManager })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, shift.groupId), eq(groupMembers.userId, userId)))
    .limit(1);

  return { ...shift, isManager: membership[0]?.isManager ?? false };
}

export type CreateShiftResult =
  | { ok: true; shiftId: number }
  | { error: string; status: number };

export async function createShiftForGroup(
  userId: number,
  groupId: number,
  input: ShiftWriteInput,
): Promise<CreateShiftResult> {
  const check = await ensureGroupManager(userId, groupId);
  if ("error" in check) return check;

  const inserted = await db
    .insert(shifts)
    .values({
      groupId,
      title: input.title,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      capacity: input.capacity,
      createdBy: userId,
    })
    .returning({ id: shifts.id });

  return { ok: true, shiftId: inserted[0].id };
}

export async function updateShiftForGroup(
  userId: number,
  shiftId: number,
  input: ShiftWriteInput & { canceled: boolean },
): Promise<MutationResult> {
  const rows = await db
    .select({ groupId: shifts.groupId })
    .from(shifts)
    .where(eq(shifts.id, shiftId))
    .limit(1);
  const shift = rows[0];
  if (!shift) return { error: "Shift not found.", status: 404 };

  const check = await ensureGroupManager(userId, shift.groupId);
  if ("error" in check) return check;

  await db
    .update(shifts)
    .set({
      title: input.title,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      location: input.location,
      capacity: input.capacity,
      canceled: input.canceled,
    })
    .where(eq(shifts.id, shiftId));

  return { ok: true };
}

export async function deleteShiftForGroup(
  userId: number,
  shiftId: number,
): Promise<MutationResult> {
  const rows = await db
    .select({ groupId: shifts.groupId })
    .from(shifts)
    .where(eq(shifts.id, shiftId))
    .limit(1);
  const shift = rows[0];
  if (!shift) return { error: "Shift not found.", status: 404 };

  const check = await ensureGroupManager(userId, shift.groupId);
  if ("error" in check) return check;

  // Remove dependent rows first — there is no cascade on the FKs.
  await db.delete(shiftJoins).where(eq(shiftJoins.shiftId, shiftId));
  await db.delete(shiftComments).where(eq(shiftComments.shiftId, shiftId));
  await db.delete(shifts).where(eq(shifts.id, shiftId));

  return { ok: true };
}

export async function deleteCommentForUser(
  userId: number,
  shiftId: number,
  commentId: number,
): Promise<MutationResult> {
  const membership = await getShiftMembership(userId, shiftId);
  if ("error" in membership) return membership;

  const rows = await db
    .select({ userId: shiftComments.userId })
    .from(shiftComments)
    .where(and(eq(shiftComments.id, commentId), eq(shiftComments.shiftId, shiftId)))
    .limit(1);
  const comment = rows[0];
  if (!comment) return { error: "Comment not found.", status: 404 };
  if (comment.userId !== userId && !membership.isManager) {
    return { error: "You can only delete your own comments.", status: 403 };
  }

  await db.delete(shiftComments).where(eq(shiftComments.id, commentId));
  return { ok: true };
}
