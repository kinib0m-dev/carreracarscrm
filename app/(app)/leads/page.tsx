import { HydrateClient } from "@/trpc/server";
import { LeadsLayout } from "@/components/app/leads/LeadsLayout";
import { trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leads",
  description: "Manage your leads and track sales opportunities",
};

export default async function LeadsPage() {
  // Pre-fetch initial leads data
  await trpc.lead.list.prefetch({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  return (
    <HydrateClient>
      <LeadsLayout />
    </HydrateClient>
  );
}
