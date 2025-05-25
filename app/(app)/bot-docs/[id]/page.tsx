import { BotDocumentDetailLayout } from "@/components/app/bot-docs/detail/BotDocsDetailLayout";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function BotDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await trpc.botDocs.getById.prefetch({ id });
  } catch (error) {
    console.error("Error prefetching document:", error);
  }

  return (
    <HydrateClient>
      <BotDocumentDetailLayout id={id} />
    </HydrateClient>
  );
}
