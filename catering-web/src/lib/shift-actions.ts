"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  joinShiftForUser,
  leaveShiftForUser,
  setExtraSlotsForUser,
} from "@/services/shifts";

export type ShiftActionResult = { ok: true } | { error: string };

// Refresh the affected server-rendered routes so the UI updates without a reload.
function refresh(shiftId: number) {
  revalidatePath(`/shifts/${shiftId}`);
  revalidatePath("/dashboard");
}

export async function joinShift(shiftId: number): Promise<ShiftActionResult> {
  const user = await verifySession();
  const res = await joinShiftForUser(user.id, shiftId);
  if ("error" in res) return { error: res.error };
  refresh(shiftId);
  return { ok: true };
}

export async function leaveShift(shiftId: number): Promise<ShiftActionResult> {
  const user = await verifySession();
  const res = await leaveShiftForUser(user.id, shiftId);
  if ("error" in res) return { error: res.error };
  refresh(shiftId);
  return { ok: true };
}

export async function setExtraSlots(
  shiftId: number,
  extraSlots: number,
): Promise<ShiftActionResult> {
  const user = await verifySession();
  const res = await setExtraSlotsForUser(user.id, shiftId, extraSlots);
  if ("error" in res) return { error: res.error };
  refresh(shiftId);
  return { ok: true };
}
