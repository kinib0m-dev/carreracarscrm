import { HydrateClient, trpc } from "@/trpc/server";
import { LeadTasksLayout } from "@/components/app/leads/tasks/LeadTasksLayout";

export default async function LeadTasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  void trpc.lead.getById.prefetch({ id });
  void trpc.leadTask.getByLeadId.prefetch({ leadId: id });

  return (
    <HydrateClient>
      <LeadTasksLayout id={id} />
    </HydrateClient>
  );
}
