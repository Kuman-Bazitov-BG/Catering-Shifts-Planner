import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
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

export type ShiftDetail = ShiftSummary & {
  isMember: boolean;
  staff: ShiftStaff[];
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

// Total staff headcount = each joined member (1) plus the extra slots they reserve.
function staffFromJoins(joinCount: number, extraSum: number): number {
  return joinCount + extraSum;
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

// All shifts in the current user's groups, split into active and archive.
export async function getDashboardShifts(
  userId: number,
): Promise<{ active: ShiftSummary[]; archive: ShiftSummary[] }> {
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
    .innerJoin(
      groupMembers,
      and(
        eq(groupMembers.groupId, shifts.groupId),
        eq(groupMembers.userId, userId),
      ),
    );

  if (rows.length === 0) return { active: [], archive: [] };

  const ids = rows.map((r) => r.id);

  const joinAgg = await db
    .select({
      shiftId: shiftJoins.shiftId,
      joinCount: sql<number>`count(*)::int`,
      extraSum: sql<number>`coalesce(sum(${shiftJoins.extraSlots}), 0)::int`,
    })
    .from(shiftJoins)
    .where(inArray(shiftJoins.shiftId, ids))
    .groupBy(shiftJoins.shiftId);

  const commentAgg = await db
    .select({
      shiftId: shiftComments.shiftId,
      count: sql<number>`count(*)::int`,
    })
    .from(shiftComments)
    .where(inArray(shiftComments.shiftId, ids))
    .groupBy(shiftComments.shiftId);

  const staffMap = new Map(
    joinAgg.map((j) => [j.shiftId, staffFromJoins(j.joinCount, j.extraSum)]),
  );
  const commentMap = new Map(commentAgg.map((c) => [c.shiftId, c.count]));

  const now = new Date();
  const summaries: ShiftSummary[] = rows.map((r) => {
    const staffCount = staffMap.get(r.id) ?? 0;
    const commentCount = commentMap.get(r.id) ?? 0;
    return {
      id: r.id,
      title: r.title,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      location: r.location,
      capacity: r.capacity,
      groupId: r.groupId,
      groupTitle: r.groupTitle,
      staffCount,
      commentCount,
      state: computeShiftState(
        r.date,
        r.startTime,
        r.capacity,
        r.canceled,
        staffCount,
        now,
      ),
    };
  });

  const ts = (s: ShiftSummary) => shiftStart(s.date, s.startTime).getTime();

  const active = summaries
    .filter((s) => s.state.isActive)
    .sort((a, b) => ts(a) - ts(b)); // soonest first

  const archive = summaries
    .filter((s) => !s.state.isActive)
    .sort((a, b) => ts(b) - ts(a)); // most recent first

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
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, shift.groupId),
        eq(groupMembers.userId, userId),
      ),
    )
    .limit(1);
  const isMember = membership.length > 0;

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

  const commentRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shiftComments)
    .where(eq(shiftComments.shiftId, shiftId));
  const commentCount = commentRows[0]?.count ?? 0;

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
    commentCount,
    state: computeShiftState(
      shift.date,
      shift.startTime,
      shift.capacity,
      shift.canceled,
      staffCount,
    ),
    isMember,
    staff,
  };
}
