import { BotDocsLayout } from "@/components/app/bot-docs/BotDocsLayout";
import { HydrateClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bot Documentation",
  description: "Manage your bot's knowledge base and documentation",
};

export default async function BotDocsPage() {
  // Pre-fetch initial documents data
  await trpc.botDocs.list.prefetch({
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  return (
    <HydrateClient>
      <BotDocsLayout />
    </HydrateClient>
  );
}
