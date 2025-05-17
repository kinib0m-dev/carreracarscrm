import { LeadNotesLayout } from "@/components/app/leads/notes/LeadNotesLayout";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function LeadNotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  void trpc.lead.getById.prefetch({ id });
  void trpc.leadNote.getByLeadId.prefetch({ leadId: id });

  return (
    <HydrateClient>
      <LeadNotesLayout id={id} />
    </HydrateClient>
  );
}
