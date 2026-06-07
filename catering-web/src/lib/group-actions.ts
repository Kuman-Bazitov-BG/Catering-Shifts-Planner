"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createGroup, updateGroup, deleteGroup, type GroupWriteInput } from "@/services/groups";

// Shape returned to the create/edit forms via useActionState. `undefined` is the initial state.
export type GroupFormState =
  | {
      errors?: {
        title?: string[];
        description?: string[];
      };
      message?: string;
      // Used to repopulate inputs after a failed submit.
      values?: {
        title?: string;
        description?: string;
      };
    }
  | undefined;

type ParsedGroupForm =
  | { errors: NonNullable<GroupFormState>["errors"]; values: NonNullable<GroupFormState>["values"] }
  | { input: GroupWriteInput; values: NonNullable<GroupFormState>["values"] };

function parseGroupForm(formData: FormData): ParsedGroupForm {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  const values = { title, description };

  const errors: NonNullable<GroupFormState>["errors"] = {};
  if (title.length < 2) errors.title = ["Title must be at least 2 characters."];
  if (description.length > 1000) {
    errors.description = ["Description must be at most 1000 characters."];
  }

  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  return {
    input: { title, description: description || null },
    values,
  };
}

export async function createGroupAction(
  _prevState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const user = await verifySession();
  const parsed = parseGroupForm(formData);
  if ("errors" in parsed) return parsed;

  const res = await createGroup(user.id, parsed.input);
  if ("error" in res) return { message: res.error, values: parsed.values };

  revalidatePath("/groups");
  redirect(`/groups/${res.id}`);
}

export async function updateGroupAction(
  groupId: number,
  _prevState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const user = await verifySession();
  const parsed = parseGroupForm(formData);
  if ("errors" in parsed) return parsed;

  const res = await updateGroup(user.id, groupId, parsed.input);
  if ("error" in res) return { message: res.error, values: parsed.values };

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

export async function deleteGroupAction(groupId: number): Promise<void> {
  const user = await verifySession();
  await deleteGroup(user.id, groupId);

  revalidatePath("/groups");
  revalidatePath("/dashboard");
  redirect("/groups");
}
