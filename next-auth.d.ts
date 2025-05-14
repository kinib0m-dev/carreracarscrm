import { type DefaultSession } from "next-auth";

export type ExtendedUser = DefaultSession["user"] & {
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
};

// To add new data to the session
declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }

  interface JWT {
    securityVersion?: number;
    isTwoFactorEnabled?: boolean;
    isOAuth?: boolean;
  }
}

// This file is to declare the types that you want to extend from user, if you want to add a birthday for eg and keep it accessible in the session you can,
// But you have to declare the type here for type safety
