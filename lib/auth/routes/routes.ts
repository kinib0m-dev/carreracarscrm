/**
 * An array of routes that are accessible to the public.
 * These routes do not require authentication.
 * @type {string[]}
 */
export const publicRoutes = [
  "/",
  "/new-verification",
  "/too-fast",
  "/terms",
  "/privacy",
];

/**
 * An array of routes that are used for authentication.
 * The login will redirect logged in users to /dashboard
 * @type {string[]}
 */
export const authRoutes = [
  "/login",
  "/register",
  "/error",
  "/reset",
  "/new-password",
  "/too-fast",
];

/**
 * An array of routes that are used after authentication.
 * @type {string[]}
 */
export const privateRoutes = ["/dashboard"];

/**
 * The prefix for authentication routes.
 * Routes that start with this prefix are used for API authentication purposes and trpc.
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The default redirect path after logging in.
 * @type {string}
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
