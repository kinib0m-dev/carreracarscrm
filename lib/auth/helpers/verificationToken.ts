import { db } from "@/db";
import { verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves a verification token record by the associated email address.
 *
 * @param {string} email - The email address associated with the verification token
 * @returns {Promise<Object|null>} A promise that resolves to the verification token record
 * if found, or null if not found or if an error occurs
 */
export async function getVerificationTokenByEmail(email: string) {
  try {
    const data = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.email, email))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}

/**
 * Retrieves a verification token record by its token string.
 *
 * @param {string} token - The token string to search for
 * @returns {Promise<Object|null>} A promise that resolves to the verification token record
 * if found, or null if not found or if an error occurs
 */
export async function getVerificationTokenByToken(token: string) {
  try {
    const data = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}
