import NextAuth from "next-auth";
import authConfig from "@/auth.config";
import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
} from "@/lib/auth/routes/routes";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  // Add check for tRPC routes to be bypassed from authentication
  const isTrpcRoute = nextUrl.pathname.startsWith("/api/trpc");

  // Add check for webhook routes to bypass authentication
  const isWebhook = nextUrl.pathname.startsWith("/api/webhooks");

  // Add check for cron routes to bypass authentication
  const isCron = nextUrl.pathname.startsWith("/api/cron");

  // Add check for test routes to bypass authentication
  const isTest = nextUrl.pathname.startsWith("/api/test");

  // Skip middleware for API auth routes, tRPC routes, and webhooka
  if (isApiAuthRoute || isTrpcRoute || isWebhook || isCron || isTest) {
    return;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return;
  }

  if (!isLoggedIn && !isPublicRoute) {
    return Response.redirect(new URL("/login", nextUrl));
  }

  return;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
