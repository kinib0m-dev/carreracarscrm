import { BotDocumentEditLayout } from "@/components/app/bot-docs/edit/BotDocsEditLayout";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function BotDocumentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  void trpc.botDocs.getById.prefetch({ id });
  return (
    <HydrateClient>
      <BotDocumentEditLayout id={id} />
    </HydrateClient>
  );
}
