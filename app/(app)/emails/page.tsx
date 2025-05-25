import { EmailsLayout } from "@/components/app/emails/EmailsLayout";
import { HydrateClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Templates",
  description: "Manage your email templates and send communications to leads",
};

export default async function EmailsPage() {
  // Pre-fetch initial email templates data
  await trpc.emails.list.prefetch({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  return (
    <HydrateClient>
      <EmailsLayout />
    </HydrateClient>
  );
}
