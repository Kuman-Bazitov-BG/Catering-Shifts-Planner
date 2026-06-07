"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import {
  createShiftForGroup,
  updateShiftForGroup,
  deleteShiftForGroup,
  type ShiftWriteInput,
} from "@/services/shifts";

// Shape returned to the create/edit forms via useActionState. `undefined` is the initial state.
export type ShiftFormState =
  | {
      errors?: {
        title?: string[];
        date?: string[];
        startTime?: string[];
        endTime?: string[];
        location?: string[];
        capacity?: string[];
      };
      message?: string;
      // Used to repopulate inputs after a failed submit.
      values?: {
        title?: string;
        date?: string;
        startTime?: string;
        endTime?: string;
        location?: string;
        capacity?: string;
        canceled?: boolean;
      };
    }
  | undefined;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

type ParsedShiftForm =
  | { errors: NonNullable<ShiftFormState>["errors"]; values: NonNullable<ShiftFormState>["values"] }
  | { input: ShiftWriteInput; canceled: boolean; values: NonNullable<ShiftFormState>["values"] };

function parseShiftForm(formData: FormData): ParsedShiftForm {
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("startTime") ?? "").trim();
  const endTime = String(formData.get("endTime") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const capacityRaw = String(formData.get("capacity") ?? "").trim();
  const canceled = formData.get("canceled") === "on";

  const values = {
    title,
    date,
    startTime,
    endTime,
    location,
    capacity: capacityRaw,
    canceled,
  };

  const errors: NonNullable<ShiftFormState>["errors"] = {};
  if (title.length < 2) errors.title = ["Title must be at least 2 characters."];
  if (!DATE_RE.test(date)) errors.date = ["Please enter a valid date."];
  if (!TIME_RE.test(startTime)) errors.startTime = ["Please enter a valid start time."];
  if (!TIME_RE.test(endTime)) {
    errors.endTime = ["Please enter a valid end time."];
  } else if (TIME_RE.test(startTime) && endTime <= startTime) {
    errors.endTime = ["End time must be after the start time."];
  }
  const capacity = Number(capacityRaw);
  if (!Number.isInteger(capacity) || capacity < 1) {
    errors.capacity = ["Capacity must be a whole number of at least 1."];
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  return {
    input: {
      title,
      date,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      location: location || null,
      capacity,
    },
    canceled,
    values,
  };
}

export async function createShiftAction(
  groupId: number,
  _prevState: ShiftFormState,
  formData: FormData,
): Promise<ShiftFormState> {
  const user = await verifySession();
  const parsed = parseShiftForm(formData);
  if ("errors" in parsed) return parsed;

  const res = await createShiftForGroup(user.id, groupId, parsed.input);
  if ("error" in res) return { message: res.error, values: parsed.values };

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function updateShiftAction(
  groupId: number,
  shiftId: number,
  _prevState: ShiftFormState,
  formData: FormData,
): Promise<ShiftFormState> {
  const user = await verifySession();
  const parsed = parseShiftForm(formData);
  if ("errors" in parsed) return parsed;

  const res = await updateShiftForGroup(user.id, shiftId, {
    ...parsed.input,
    canceled: parsed.canceled,
  });
  if ("error" in res) return { message: res.error, values: parsed.values };

  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/shifts/${shiftId}`);
  revalidatePath("/dashboard");
  redirect(`/groups/${groupId}`);
}

export async function deleteShiftAction(groupId: number, shiftId: number): Promise<void> {
  const user = await verifySession();
  await deleteShiftForGroup(user.id, shiftId);

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  redirect(`/groups/${groupId}`);
}
