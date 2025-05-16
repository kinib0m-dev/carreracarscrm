import { LeadsEditLayout } from "@/components/app/leads/edit/LeadsEditLayout";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function LeadsIdEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  void trpc.lead.getById.prefetch({ id });
  return (
    <HydrateClient>
      <LeadsEditLayout id={id} />
    </HydrateClient>
  );
}
