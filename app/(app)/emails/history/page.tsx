import { EmailHistoryLayout } from "@/components/app/emails/history/EmailHistoryLayout";
import { HydrateClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email History | CRM",
  description:
    "View your email sending history and track email campaign performance",
};

export default async function EmailHistoryPage() {
  // Pre-fetch initial email history data
  await trpc.emails.getEmailHistory.prefetch({
    page: 1,
    limit: 10,
  });

  return (
    <HydrateClient>
      <EmailHistoryLayout />
    </HydrateClient>
  );
}
