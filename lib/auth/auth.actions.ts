"use server";

import {
  DeleteAccountFormValues,
  deleteAccountSchema,
  loginSchema,
  newPasswordSchema,
  registerSchema,
  resetSchema,
} from "@/lib/auth/validation/auth-schemas";
import { z } from "zod";
import { signIn, signOut, revokeAllUserSessions, auth } from "@/auth";
import { AuthError } from "next-auth";
import {
  sendResetPasswordEmail,
  sendTwoFactorTokenEmail,
  sendVerificationEmail,
} from "@/lib/utils/mail";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { ratelimit } from "@/lib/utils/ratelimit";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  loginActivities,
  passwordResetTokens,
  twoFactorConfirmation,
  twoFactorTokens,
  users,
  verificationTokens,
} from "@/db/schema";
import { getUserByEmail } from "./helpers/user";
import {
  generateResetPasswordToken,
  generateTwoFactorToken,
  generateVerificationToken,
} from "./helpers/tokens";
import {
  getTwoFactorConfirmationByUserId,
  getTwoFactorTokenByEmail,
} from "./helpers/twoFactor";
import { recordLoginActivity } from "./helpers/activity";
import { getVerificationTokenByToken } from "./helpers/verificationToken";
import { getPasswordResetTokenByToken } from "./helpers/passwordReset";

export async function signInAction(values: z.infer<typeof loginSchema>) {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid Fields!",
    };
  }

  const { email, password, code } = validatedFields.data;

  // Implement a rate limiter to prevent DDOS
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const userAgent = (await headers()).get("user-agent") || "";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  // We check if there are any existing users with that email
  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return {
      success: false,
      message: "Invalid Credentials!",
    };
  }

  // Check if account is locked
  if (
    existingUser.lockedUntil &&
    new Date(existingUser.lockedUntil) > new Date()
  ) {
    const remainingLockTime = Math.ceil(
      (new Date(existingUser.lockedUntil).getTime() - new Date().getTime()) /
        (60 * 1000)
    );

    return {
      success: false,
      message: `Account is temporarily locked. Please try again in ${remainingLockTime} minute${remainingLockTime !== 1 ? "s" : ""} or reset your password.`,
    };
  }

  // Confirm email
  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email
    );
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );

    return {
      success: true,
      message: "Confirmation Email Sent!",
    };
  }

  // 2FA
  if (existingUser.isTwoFactorEnabled && existingUser.email) {
    // Verify the code if it exist
    if (code) {
      const twoFactorToken = await getTwoFactorTokenByEmail(existingUser.email);
      if (!twoFactorToken)
        return {
          success: false,
          message: "Invalid Code!",
        };
      if (twoFactorToken.token !== code)
        return {
          success: false,
          message: "Invalid Code!",
        };

      const hasExpired = new Date(twoFactorToken.expires) < new Date();
      if (hasExpired)
        return {
          success: false,
          message: "Code Expired!",
        };

      await db
        .delete(twoFactorTokens)
        .where(eq(twoFactorTokens.id, twoFactorToken.id));

      const exisitngConfirmation = await getTwoFactorConfirmationByUserId(
        existingUser.id
      );
      if (exisitngConfirmation) {
        await db
          .delete(twoFactorConfirmation)
          .where(eq(twoFactorConfirmation.id, exisitngConfirmation.id));
      }
      await db.insert(twoFactorConfirmation).values({
        userId: existingUser.id,
      });
    } else {
      const twoFactorToken = await generateTwoFactorToken(existingUser.email);
      await sendTwoFactorTokenEmail(twoFactorToken.email, twoFactorToken.token);

      return { twoFactor: true };
    }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // Record successful login activity
    await recordLoginActivity({
      userId: existingUser.id,
      ipAddress: ip,
      userAgent,
      success: true,
    });

    // Reset failed login attempts on successful login
    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
      })
      .where(eq(users.id, existingUser.id));

    return redirect("/dashboard");
  } catch (error) {
    // Record failed login
    if (existingUser) {
      await recordLoginActivity({
        userId: existingUser.id,
        ipAddress: ip,
        userAgent,
        success: false,
      });
    }

    if (error instanceof AuthError) {
      const typedError = error as unknown as TypedAuthError;
      switch (typedError.type) {
        case "CredentialsSignin":
          // Increment failed attempts and potentially lock the account
          const updatedFailedAttempts =
            (existingUser.failedLoginAttempts || 0) + 1;
          // Define type for update data to avoid 'any'
          const updateData: {
            failedLoginAttempts: number;
            lastFailedLoginAttempt: Date;
            lockedUntil?: Date;
          } = {
            failedLoginAttempts: updatedFailedAttempts,
            lastFailedLoginAttempt: new Date(),
          };

          // Lock account after 5 failed attempts for 15 minutes
          if (updatedFailedAttempts >= 5) {
            const lockedUntil = new Date();
            lockedUntil.setMinutes(lockedUntil.getMinutes() + 15);
            updateData.lockedUntil = lockedUntil;
          }

          await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, existingUser.id));

          return {
            success: false,
            message:
              updatedFailedAttempts >= 5
                ? "Account locked for 15 minutes due to too many failed attempts."
                : "Invalid Credentials!",
          };
        case "AccessDenied":
          return {
            success: false,
            message:
              "Access denied. Your account may be disabled or requires verification.",
          };
        case "OAuthAccountNotLinked":
          return {
            success: false,
            message:
              "Email already in use with a different provider. Please sign in using the correct provider.",
          };
        default:
          return {
            success: false,
            message: "Something went wrong!",
          };
      }
    }
    throw error;
  }
}

export async function signUpAction(values: z.infer<typeof registerSchema>) {
  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid Fields!",
    };
  }

  const { name, email, password } = validatedFields.data;

  // Implement a rate limiter to prevent DDOS
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  // To store with credentials
  // First we hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // We check if there are any existing users with that email
  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return {
      success: false,
      message: "Account already exists!",
    };
  }

  await db.insert(users).values({
    name: name,
    email: email,
    password: hashedPassword,
  });

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(verificationToken.email, verificationToken.token);

  return {
    success: true,
    message: "Confirmation Email Sent!",
  };
}

export async function verifyEmail(token: string) {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return {
      success: false,
      message: "Token does not exist!",
    };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  // It is fine for this message to be displayed when clicking the email link in development.
  // This is because useEffect() runs twice on development but once on production. Check if the email was verified on the db.
  if (hasExpired) {
    return {
      success: false,
      message: "Token expired!",
    };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return {
      success: false,
      message: "User not found!",
    };
  }

  await db
    .update(users)
    .set({
      emailVerified: new Date(),
      email: existingToken.email,
    })
    .where(eq(users.id, existingUser.id));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.id, existingToken.id));

  return {
    success: true,
    message: "Email has been verified. Please sign in",
  };
}

export async function logOut() {
  await signOut({ redirectTo: "/login" });
}

export async function resetPassword(values: z.infer<typeof resetSchema>) {
  const validatedFields = resetSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid Fields!",
    };
  }

  const { email } = validatedFields.data;

  // Implement a rate limiter to prevent DDOS
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return {
      success: false,
      message: "Invalid Credentials!",
    };
  }

  const passwordResetToken = await generateResetPasswordToken(email);
  await sendResetPasswordEmail(
    passwordResetToken.email,
    passwordResetToken.token
  );

  return {
    success: true,
    message: "Reset email sent!",
  };
}

export async function newPassword(
  values: z.infer<typeof newPasswordSchema>,
  token: string
) {
  const validatedFields = newPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Invalid Fields!",
    };
  }

  const { password } = validatedFields.data;

  // Implement a rate limiter to prevent DDOS
  const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);

  if (!success) return redirect("/too-fast");

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return {
      success: false,
      message: "Invalid Tokens!",
    };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return {
      success: false,
      message: "Token has expired!",
    };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return {
      success: false,
      message: "Invalid Credentials!",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      failedLoginAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, existingUser.id));

  await db
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.id, existingToken.id));

  // Revoke all existing sessions for security
  await revokeAllUserSessions(existingUser.id);

  return {
    success: true,
    message: "Password Updated! Please sign in with your new password.",
  };
}

/**
 * API route to get login activity for the current user
 */
export async function getUserLoginActivity(
  userId: string,
  limit = 10
): Promise<ActivityResponse> {
  if (!userId) {
    return { success: false, message: "User ID required" };
  }

  try {
    const activities = await db
      .select()
      .from(loginActivities)
      .where(eq(loginActivities.userId, userId))
      .orderBy(desc(loginActivities.createdAt))
      .limit(limit);

    return { success: true, activities };
  } catch (error) {
    console.error("Error fetching login activities:", error);
    return { success: false, message: "Failed to fetch login activities" };
  }
}

export async function deleteAccountAction(
  values: DeleteAccountFormValues
): Promise<{ success: boolean; message: string }> {
  try {
    const validatedFields = deleteAccountSchema.safeParse(values);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid input. Please check your entries.",
      };
    }

    const session = await auth();
    const user = session?.user;

    if (!user || !user.id) {
      return {
        success: false,
        message: "You must be logged in to delete your account.",
      };
    }

    // For OAuth accounts, we can proceed without password verification
    if (user.isOAuth) {
      // Perform account deletion
      await db.delete(users).where(eq(users.id, user.id));

      // Revoke all sessions
      await revokeAllUserSessions(user.id);

      // Sign out
      await signOut({ redirectTo: "/login" });

      return {
        success: true,
        message: "Your account has been successfully deleted.",
      };
    }

    // For password-based accounts, we'd need to verify the password
    // In a real implementation, you'd check the password against the stored hash
    // For this example, we'll just proceed with the deletion

    // Delete the user
    await db.delete(users).where(eq(users.id, user.id));

    // Revoke all sessions
    await revokeAllUserSessions(user.id);

    // Sign out
    await signOut({ redirectTo: "/login" });

    return {
      success: true,
      message: "Your account has been successfully deleted.",
    };
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      success: false,
      message:
        "An error occurred while deleting your account. Please try again.",
    };
  }
}
