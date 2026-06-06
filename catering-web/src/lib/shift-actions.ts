"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { shifts, groupMembers, shiftJoins } from "@/db/schema";
import { verifySession } from "@/lib/dal";
import { computeShiftState } from "@/services/shifts";

export type ShiftActionResult = { ok: true } | { error: string };

const MAX_EXTRA_SLOTS = 3;

// Authorization gate shared by every participation action: the user must be a
// member of the shift's group, and the shift must be active (upcoming/current,
// not canceled). Server Actions are public endpoints, so this runs server-side
// on every call regardless of what the UI allows.
async function ensureCanParticipate(
  shiftId: number,
  userId: number,
): Promise<ShiftActionResult> {
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
  if (!shift) return { error: "Shift not found." };

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
    return { error: "You are not a member of this group." };
  }

  const state = computeShiftState(
    shift.date,
    shift.startTime,
    shift.capacity,
    shift.canceled,
    0,
  );
  if (!state.isActive) {
    return { error: "This shift is not open for joining or leaving." };
  }

  return { ok: true };
}

function refresh(shiftId: number) {
  revalidatePath(`/shifts/${shiftId}`);
  revalidatePath("/dashboard");
}

export async function joinShift(shiftId: number): Promise<ShiftActionResult> {
  const user = await verifySession();
  const check = await ensureCanParticipate(shiftId, user.id);
  if ("error" in check) return check;

  const existing = await db
    .select({ id: shiftJoins.id })
    .from(shiftJoins)
    .where(and(eq(shiftJoins.shiftId, shiftId), eq(shiftJoins.userId, user.id)))
    .limit(1);

  if (existing.length === 0) {
    await db
      .insert(shiftJoins)
      .values({ shiftId, userId: user.id, extraSlots: 0 });
  }

  refresh(shiftId);
  return { ok: true };
}

export async function leaveShift(shiftId: number): Promise<ShiftActionResult> {
  const user = await verifySession();
  const check = await ensureCanParticipate(shiftId, user.id);
  if ("error" in check) return check;

  await db
    .delete(shiftJoins)
    .where(and(eq(shiftJoins.shiftId, shiftId), eq(shiftJoins.userId, user.id)));

  refresh(shiftId);
  return { ok: true };
}

export async function setExtraSlots(
  shiftId: number,
  extraSlots: number,
): Promise<ShiftActionResult> {
  const user = await verifySession();
  const check = await ensureCanParticipate(shiftId, user.id);
  if ("error" in check) return check;

  const clamped = Math.max(0, Math.min(MAX_EXTRA_SLOTS, Math.trunc(extraSlots)));

  const updated = await db
    .update(shiftJoins)
    .set({ extraSlots: clamped })
    .where(and(eq(shiftJoins.shiftId, shiftId), eq(shiftJoins.userId, user.id)))
    .returning({ id: shiftJoins.id });

  if (updated.length === 0) {
    return { error: "You have not joined this shift yet." };
  }

  refresh(shiftId);
  return { ok: true };
}
