import { db } from "@/db";
import { twoFactorConfirmation, twoFactorTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves a two-factor confirmation record for a specific user.
 *
 * @param {string} userId - The ID of the user whose two-factor confirmation to retrieve
 * @returns {Promise<Object|null>} A promise that resolves to the two-factor confirmation
 * record if found, or null if not found or if an error occurs
 */
export async function getTwoFactorConfirmationByUserId(userId: string) {
  try {
    const data = await db
      .select()
      .from(twoFactorConfirmation)
      .where(eq(twoFactorConfirmation.userId, userId))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}

/**
 * Retrieves a two-factor token record by its token string.
 *
 * @param {string} token - The token string to search for
 * @returns {Promise<Object|null>} A promise that resolves to the two-factor token
 * record if found, or null if not found or if an error occurs
 */
export async function getTwoFactorTokenByToken(token: string) {
  try {
    const data = await db
      .select()
      .from(twoFactorTokens)
      .where(eq(twoFactorTokens.token, token))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}

/**
 * Retrieves a two-factor token record by the associated email address.
 *
 * @param {string} email - The email address associated with the two-factor token
 * @returns {Promise<Object|null>} A promise that resolves to the two-factor token
 * record if found, or null if not found or if an error occurs
 */
export async function getTwoFactorTokenByEmail(email: string) {
  try {
    const data = await db
      .select()
      .from(twoFactorTokens)
      .where(eq(twoFactorTokens.email, email))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}
