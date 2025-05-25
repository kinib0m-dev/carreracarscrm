import { EmailHistoryDetailsLayout } from "@/components/app/emails/history/detail/EmailHistoryDetailLayout";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function EmailHistoryDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await trpc.emails.getEmailHistoryDetails.prefetch({ id });
  } catch (error) {
    console.error("Error prefetching email history details:", error);
  }

  return (
    <HydrateClient>
      <EmailHistoryDetailsLayout id={id} />
    </HydrateClient>
  );
}
