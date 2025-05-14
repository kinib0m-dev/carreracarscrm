import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Retrieves a user record by their email address.
 *
 * @param {string} email - The email address of the user to retrieve
 * @returns {Promise<Object|null>} A promise that resolves to the user record
 * if found, or null if not found or if an error occurs
 */
export async function getUserByEmail(email: string) {
  try {
    const data = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}

/**
 * Retrieves a user record by their unique identifier.
 *
 * @param {string} userId - The ID of the user to retrieve
 * @returns {Promise<Object|null>} A promise that resolves to the user record
 * if found, or null if not found or if an error occurs
 */
export async function getUserById(userId: string) {
  try {
    const data = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((result) => result[0] || null);

    return data;
  } catch {
    return null;
  }
}
