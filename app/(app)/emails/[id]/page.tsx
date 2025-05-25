import { EmailTemplateDetailLayout } from "@/components/app/emails/detail/EmailTemplateDetailLayout";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function EmailTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await trpc.emails.getById.prefetch({ id });
    await trpc.emails.countTargetLeads.prefetch({ id });
  } catch (error) {
    console.error("Error prefetching template data:", error);
  }

  return (
    <HydrateClient>
      <EmailTemplateDetailLayout id={id} />
    </HydrateClient>
  );
}
