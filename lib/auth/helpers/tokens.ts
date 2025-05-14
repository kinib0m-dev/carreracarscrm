import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/db";
import {
  passwordResetTokens,
  twoFactorTokens,
  verificationTokens,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { getVerificationTokenByEmail } from "./verificationToken";
import { getPasswordResetTokenByEmail } from "./passwordReset";
import { getTwoFactorTokenByEmail } from "./twoFactor";

/**
 * Generates a verification token for email verification processes.
 *
 * @param {string} email - The email address to associate with the verification token
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 *   - email: The email address associated with the token
 *   - token: The generated verification token (UUID)
 *   - expires: The expiration date (1 hour from creation)
 */
export async function generateVerificationToken(email: string) {
  // Generate the token
  const token = uuidv4();

  // Expire the token in an hour
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.id, existingToken.id));
  }

  // Insert and explicitly return the inserted values
  await db.insert(verificationTokens).values({
    email,
    token,
    expires,
  });

  // Retrieve the inserted token
  return { email, token, expires };
}

/**
 * Generates a password reset token to facilitate password reset processes.
 *
 * @param {string} email - The email address to associate with the password reset token
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 *   - email: The email address associated with the token
 *   - token: The generated password reset token (UUID)
 *   - expires: The expiration date (1 hour from creation)
 */
export async function generateResetPasswordToken(email: string) {
  // Generate the token
  const token = uuidv4();

  // Expire the token in an hour
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getPasswordResetTokenByEmail(email);

  if (existingToken) {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, existingToken.id));
  }

  db.insert(passwordResetTokens).values({
    email,
    token,
    expires,
  });

  return { email, token, expires };
}

/**
 * Generates a two-factor authentication token.
 *
 * @param {string} email - The email address to associate with the two-factor token
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 *   - email: The email address associated with the token
 *   - token: The generated two-factor token (6-digit number)
 *   - expires: The expiration date (5 minutes from creation)
 */
export async function generateTwoFactorToken(email: string) {
  // Generate a 6 digit code
  const token = crypto.randomInt(100_000, 1_000_000).toString();
  // Expire the token in 5 minutes
  const expires = new Date(new Date().getTime() + 5 * 60 * 1000);

  const existingToken = await getTwoFactorTokenByEmail(email);

  if (existingToken) {
    await db
      .delete(twoFactorTokens)
      .where(eq(twoFactorTokens.id, existingToken.id));
  }

  await db.insert(twoFactorTokens).values({
    email,
    token,
    expires,
  });

  return { email, token, expires };
}
