import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { twoFactorConfirmation, users } from "@/db/schema";
import { getUserById } from "@/lib/auth/helpers/user";
import { getTwoFactorConfirmationByUserId } from "@/lib/auth/helpers/twoFactor";
import { getAccountById } from "@/lib/auth/helpers/account";

export type UserRole = "user" | "admin";

export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
    error: "/error",
  },
  events: {
    // This is to populate the emailVerified filed when it is signing in from an oauth
    async linkAccount({ user }) {
      await db
        .update(users)
        .set({
          emailVerified: new Date(),
        })
        .where(eq(users.id, user.id!));
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow OAuth without email verification
      if (account?.provider !== "credentials") return true;

      const existingUser = await getUserById(user.id as string);
      // If the auth is with credentials, make them verify the email
      if (!existingUser?.emailVerified) return false;

      // If 2FA is enabled
      if (existingUser.isTwoFactorEnabled) {
        const twoFAConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id
        );

        if (!twoFAConfirmation) return false;

        // Delete two factor confrimation for next signIn
        await db
          .delete(twoFactorConfirmation)
          .where(eq(twoFactorConfirmation.id, twoFAConfirmation.id));
      }

      // Reset failed login attempts on successful login
      await db
        .update(users)
        .set({
          failedLoginAttempts: 0,
          lockedUntil: null,
        })
        .where(eq(users.id, existingUser.id));

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      // We pass the user 2FA to the session
      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }

      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.isOAuth = token.isOAuth as boolean;
      }

      return session;
    },
    async jwt({ token }) {
      // That means that it is logged out (no user id).
      if (!token.sub) return token;

      // Since it is logged in, we fetch the user to extract the user role
      const existingUser = await getUserById(token.sub);
      // User doesn't exist
      if (!existingUser) return token;

      // Security version check for session revocation
      if (!token.securityVersion) {
        // First time initialization
        token.securityVersion = existingUser.securityVersion || 1;
      } else if (token.securityVersion !== existingUser.securityVersion) {
        // If versions don't match, invalidate the token
        return {}; // This will force a re-login
      }

      const existingAccount = await getAccountById(existingUser.id);
      token.isOAuth = !!existingAccount;

      // We extend the user for the fields we want to have
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      return token;
    },
  },
  adapter: DrizzleAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // Default: 1 hour in seconds
  },
  ...authConfig,
});

// Function to revoke all sessions for a user (increment security version)
export async function revokeAllUserSessions(userId: string) {
  const user = await getUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Increment the security version to invalidate all current sessions
  await db
    .update(users)
    .set({
      securityVersion: (user.securityVersion || 1) + 1,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { success: true };
}
