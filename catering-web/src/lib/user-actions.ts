"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { updateUserProfile, updateUserPassword } from "@/services/users";

// Shape returned to the profile form via useActionState. `undefined` is the initial state.
export type ProfileFormState =
  | {
      errors?: {
        name?: string[];
        photoUrl?: string[];
      };
      message?: string;
      success?: boolean;
      // Used to repopulate inputs after a submit.
      values?: {
        name?: string;
        photoUrl?: string;
      };
    }
  | undefined;

const URL_RE = /^https?:\/\/.+/i;

export async function updateProfileAction(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await verifySession();

  const name = String(formData.get("name") ?? "").trim();
  const photoUrl = String(formData.get("photoUrl") ?? "").trim();
  const values = { name, photoUrl };

  const errors: NonNullable<ProfileFormState>["errors"] = {};
  if (name.length < 2) errors.name = ["Name must be at least 2 characters."];
  if (photoUrl && !URL_RE.test(photoUrl)) {
    errors.photoUrl = ["Please enter a valid http(s) URL, or leave this blank."];
  }
  if (Object.keys(errors).length > 0) {
    return { errors, values };
  }

  const res = await updateUserProfile(user.id, { name, photoUrl: photoUrl || null });
  if ("error" in res) return { message: res.error, values };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, message: "Profile updated.", values };
}

// Shape returned to the password form via useActionState. `undefined` is the initial state.
export type PasswordFormState =
  | {
      errors?: {
        currentPassword?: string[];
        newPassword?: string[];
        confirmPassword?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export async function updatePasswordAction(
  _prevState: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const user = await verifySession();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const errors: NonNullable<PasswordFormState>["errors"] = {};
  if (!currentPassword) errors.currentPassword = ["Current password is required."];
  if (newPassword.length < 6) {
    errors.newPassword = ["New password must be at least 6 characters."];
  }
  if (confirmPassword !== newPassword) {
    errors.confirmPassword = ["Passwords do not match."];
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const res = await updateUserPassword(user.id, currentPassword, newPassword);
  if ("error" in res) return { message: res.error };

  return { success: true, message: "Password changed." };
}
