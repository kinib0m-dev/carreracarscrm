import { LeadsDetailLayout } from "@/components/app/leads/detail/LeadsDetailLayout";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function LeadsIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  void trpc.lead.getById.prefetch({ id });
  return (
    <HydrateClient>
      <LeadsDetailLayout id={id} />
    </HydrateClient>
  );
}
