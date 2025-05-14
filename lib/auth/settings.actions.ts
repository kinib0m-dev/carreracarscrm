"use server";

import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revokeAllUserSessions } from "@/auth";
import { getUserById } from "./helpers/user";
import { currentUser } from "./server/auth";
import { revalidatePath } from "next/cache";

// Validation schemas
const updateNameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, { message: "Minimum 8 characters required" })
      .regex(/[a-z]/, { message: "At least one lowercase letter required" })
      .regex(/[A-Z]/, { message: "At least one uppercase letter required" })
      .regex(/[0-9]/, { message: "At least one number required" })
      .regex(/[!@#$%^&*]/, {
        message: "At least one special character required",
      }),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Update user name
export async function updateName(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      message: "You must be logged in to update your profile",
    };
  }

  // Ensure user.id is not undefined
  if (!user.id) {
    return {
      success: false,
      message: "Invalid user account",
    };
  }

  const validatedFields = updateNameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message:
        validatedFields.error.flatten().fieldErrors.name?.[0] || "Invalid name",
    };
  }

  const { name } = validatedFields.data;

  try {
    await db.update(users).set({ name }).where(eq(users.id, user.id));

    revalidatePath("/profile");
    revalidatePath("/settings");

    return {
      success: true,
      message: "Name updated successfully",
    };
  } catch (error) {
    console.error("Error updating name:", error);
    return {
      success: false,
      message: "Failed to update name. Please try again.",
    };
  }
}

// Update user password
export async function updatePassword(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      message: "You must be logged in to update your password",
    };
  }

  // Ensure user.id is not undefined
  if (!user.id) {
    return {
      success: false,
      message: "Invalid user account",
    };
  }

  // OAuth users don't have passwords
  const dbUser = await getUserById(user.id);
  if (!dbUser?.password) {
    return {
      success: false,
      message: "You cannot change password for accounts linked with Google",
    };
  }

  const validatedFields = updatePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    const { fieldErrors } = validatedFields.error.flatten();
    return {
      success: false,
      message:
        fieldErrors.currentPassword?.[0] ||
        fieldErrors.newPassword?.[0] ||
        fieldErrors.confirmPassword?.[0] ||
        "Invalid input",
    };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    dbUser.password
  );

  if (!isCurrentPasswordValid) {
    return {
      success: false,
      message: "Current password is incorrect",
    };
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    // Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Revoke all sessions for security
    await revokeAllUserSessions(user.id);

    return {
      success: true,
      message:
        "Password updated successfully. Please log in again with your new password.",
      requireReauth: true,
    };
  } catch (error) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: "Failed to update password. Please try again.",
    };
  }
}

// Toggle 2FA status
export async function toggleTwoFactor(enable: boolean) {
  const user = await currentUser();

  if (!user) {
    return {
      success: false,
      message: "You must be logged in to update 2FA settings",
    };
  }

  // Ensure user.id is not undefined
  if (!user.id) {
    return {
      success: false,
      message: "Invalid user account",
    };
  }

  try {
    await db
      .update(users)
      .set({
        isTwoFactorEnabled: enable,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Revoke all sessions for security when enabling or disabling 2FA
    await revokeAllUserSessions(user.id);

    return {
      success: true,
      message: enable
        ? "Two-factor authentication enabled successfully. Please log in again."
        : "Two-factor authentication disabled. Please log in again.",
      requireReauth: true,
    };
  } catch (error) {
    console.error("Error toggling 2FA:", error);
    return {
      success: false,
      message: "Failed to update two-factor authentication settings",
    };
  }
}
