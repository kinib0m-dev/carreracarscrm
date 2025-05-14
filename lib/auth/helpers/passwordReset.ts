import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves a password reset token record by its token string.
 *
 * @param {string} token - The unique token string to search for
 * @returns {Promise<Object|null>} A promise that resolves to the password reset token record
 * if found, or null if not found or if an error occurs
 */
export async function getPasswordResetTokenByToken(token: string) {
  try {
    const data = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}

/**
 * Retrieves a password reset token record by the associated email address.
 *
 * @param {string} email - The email address associated with the reset token
 * @returns {Promise<Object|null>} A promise that resolves to the password reset token record
 * if found, or null if not found or if an error occurs
 */
export async function getPasswordResetTokenByEmail(email: string) {
  try {
    const data = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.email, email))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}
