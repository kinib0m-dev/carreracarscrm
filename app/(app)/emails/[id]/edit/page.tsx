import { EmailTemplateEditLayout } from "@/components/app/emails/edit/EmailTemplateEditLayout";
import { HydrateClient, trpc } from "@/trpc/server";

export default async function EmailTemplateEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await trpc.emails.getById.prefetch({ id });
  } catch (error) {
    console.error("Error prefetching template data:", error);
  }

  return (
    <HydrateClient>
      <EmailTemplateEditLayout id={id} />
    </HydrateClient>
  );
}
