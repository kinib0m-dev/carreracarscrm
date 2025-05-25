import { PlaygroundLayout } from "@/components/app/playground/PlaygroundLayout";
import { HydrateClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playground",
  description: "Test your bot and simulate customer interactions",
};

export default async function PlaygroundPage() {
  // Pre-fetch initial conversations
  await trpc.playground.listConversations.prefetch();

  return (
    <HydrateClient>
      <PlaygroundLayout />
    </HydrateClient>
  );
}
