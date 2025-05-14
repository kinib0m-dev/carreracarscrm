import { db } from "@/db";
import { loginActivities } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * Records a new login activity entry for a user in the database.
 *
 * @param {Object} params - The login activity data
 * @param {string} params.userId - The ID of the user logging in
 * @param {string} params.ipAddress - The IP address from which the login attempt was made
 * @param {string} params.userAgent - The user agent string of the browser/device used
 * @param {boolean} params.success - Whether the login attempt was successful
 * @returns {Promise<void>} A promise that resolves when the activity is recorded
 */
export async function recordLoginActivity({
  userId,
  ipAddress,
  userAgent,
  success,
}: {
  userId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}) {
  await db.insert(loginActivities).values({
    userId,
    ipAddress,
    userAgent,
    success,
  });
}

/**
 * Retrieves login activity history for a specific user.
 *
 * @param {string} userId - The ID of the user whose login activities to retrieve
 * @param {number} [limit=10] - Maximum number of records to return
 * @returns {Promise<Array>} A promise that resolves to an array of login activity records
 */
export async function getLoginActivitiesForUser(userId: string, limit = 10) {
  return db
    .select()
    .from(loginActivities)
    .where(eq(loginActivities.userId, userId))
    .orderBy(desc(loginActivities.createdAt))
    .limit(limit);
}

/**
 * Gets the most recent login activity for a specific user.
 *
 * @param {string} userId - The ID of the user whose last login to retrieve
 * @returns {Promise<Object|null>} A promise that resolves to the most recent login activity
 * or null if no activities exist
 */
export async function getLastLoginActivity(userId: string) {
  const activities = await db
    .select()
    .from(loginActivities)
    .where(eq(loginActivities.userId, userId))
    .orderBy(desc(loginActivities.createdAt))
    .limit(1);

  return activities.length > 0 ? activities[0] : null;
}

/**
 * Checks if there's any suspicious login activity for a user based on simple heuristics.
 * Currently detects multiple different IP addresses in recent logins.
 *
 * @param {string} userId - The ID of the user to check for suspicious activity
 * @returns {Promise<Object|boolean>} A promise that resolves to either:
 *   - false: if no suspicious activity is detected
 *   - An object with properties:
 *     - suspicious: boolean indicating if activity is suspicious (true)
 *     - reason: string explaining why the activity was flagged
 */
export async function detectSuspiciousActivity(userId: string) {
  // Get the most recent 5 activities
  const recentActivities = await db
    .select()
    .from(loginActivities)
    .where(eq(loginActivities.userId, userId))
    .orderBy(desc(loginActivities.createdAt))
    .limit(5);

  if (recentActivities.length < 2) return false;

  // Check for login from multiple different IP addresses in a short time
  const uniqueIPs = new Set(
    recentActivities.map((activity) => activity.ipAddress)
  );

  // If there are more than 2 unique IPs in the last 5 logins, flag as suspicious
  if (uniqueIPs.size > 2) {
    return {
      suspicious: true,
      reason: "Multiple different IP addresses detected for recent logins",
    };
  }

  // More detection logic can be added here

  return { suspicious: false };
}
