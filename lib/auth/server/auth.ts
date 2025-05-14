// This is to fetch the user to server components and API Routes

import { auth } from "@/auth";

export async function currentUser() {
  const session = await auth();

  return session?.user;
}
