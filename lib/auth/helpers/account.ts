import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves an account from the database by user ID.
 *
 * @param {string} userId - The unique identifier of the user whose account to retrieve.
 * @returns {Promise<object|null>} The account data if found, or null if not found or if an error occurs.
 */
export async function getAccountById(userId: string) {
  try {
    const data = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, userId))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}
