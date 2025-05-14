/**
 * This file contains utility functions related to security features
 * such as session revocation, login activity monitoring, etc.
 */

import { db } from "@/db";
import { loginActivities, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { revokeAllUserSessions } from "@/auth";

/**
 * Detects suspicious login activity for a user
 * @param userId The user ID to check
 * @returns Object indicating if suspicious activity was detected and why
 */
export async function detectSuspiciousActivity(userId: string) {
  // Get the most recent 10 activities
  const recentActivities = await db
    .select()
    .from(loginActivities)
    .where(eq(loginActivities.userId, userId))
    .orderBy(desc(loginActivities.createdAt))
    .limit(10);

  if (recentActivities.length < 2) return { suspicious: false };

  // Check for rapid logins from different locations
  const lastActivity = recentActivities[0];
  const previousActivities = recentActivities.slice(1);

  // Check for multiple unique IPs in recent logins
  const uniqueIPs = new Set(
    previousActivities.map((activity) => activity.ipAddress)
  );

  // If there are more than 3 unique IPs in recent logins and current IP is new, flag as suspicious
  if (
    uniqueIPs.size > 3 &&
    !Array.from(uniqueIPs).includes(lastActivity.ipAddress)
  ) {
    return {
      suspicious: true,
      reason: "Multiple different IP addresses detected for recent logins",
    };
  }

  // Check for failed login attempts followed by successful login from a different IP
  const recentFailedLogins = previousActivities.filter((a) => !a.success);

  if (recentFailedLogins.length >= 3 && lastActivity.success) {
    // Check if successful login is from a different IP than failed attempts
    const failedIPs = new Set(recentFailedLogins.map((a) => a.ipAddress));
    if (!Array.from(failedIPs).includes(lastActivity.ipAddress)) {
      return {
        suspicious: true,
        reason: "Successful login from a new IP after multiple failed attempts",
      };
    }
  }

  return { suspicious: false };
}

/**
 * Handles detection and response to suspicious activity
 * @param userId The user ID to check and protect
 * @returns Information about any actions taken
 */
export async function handleSuspiciousActivity(userId: string) {
  const suspiciousCheck = await detectSuspiciousActivity(userId);

  if (suspiciousCheck.suspicious) {
    // Get the current user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .then((results) => results[0]);

    if (!user) {
      return {
        actionTaken: false,
        message: "User not found",
      };
    }

    // Revoke all sessions as a security measure
    await revokeAllUserSessions(userId);

    // Record the suspicious activity
    await db
      .update(users)
      .set({
        securityVersion: (user.securityVersion || 1) + 1,
      })
      .where(eq(users.id, userId));

    return {
      actionTaken: true,
      message:
        "Suspicious activity detected. All sessions have been revoked as a security measure.",
    };
  }

  return { actionTaken: false };
}

/**
 * Resets security-related fields for a user
 * @param userId The user ID to reset security for
 */
export async function resetUserSecurity(userId: string) {
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, userId));

  return { success: true, message: "User security status reset successfully" };
}
