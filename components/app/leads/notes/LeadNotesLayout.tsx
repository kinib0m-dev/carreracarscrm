"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { LeadNotesView } from "./LeadNotesView";
import { LeadsNotFound } from "../detail/LeadsNotFound";
import { ArrowLeft } from "lucide-react";
import { LeadNotesBreadcrumb } from "./LeadNotesBreadcrumb";

export function LeadNotesLayout({ id }: { id: string }) {
  return (
    <Suspense fallback={<LeadNotesLoader />}>
      <ErrorBoundary fallback={<LeadNotesError id={id} />}>
        <LeadNotesLayoutSuspense id={id} />
      </ErrorBoundary>
    </Suspense>
  );
}

function LeadNotesLayoutSuspense({ id }: { id: string }) {
  const { data, error, isLoading } = trpc.lead.getById.useQuery(
    { id },
    {
      retry: 1, // Only retry once to avoid unnecessary retries on genuine 404s
      retryDelay: 500,
    }
  );

  if (isLoading) {
    return <LeadNotesLoader />;
  }

  if (error) {
    if (error.data?.code === "NOT_FOUND") {
      return <LeadsNotFound />;
    }
    return <LeadNotesError id={id} />;
  }

  if (!isLoading && !data?.lead) {
    return <LeadsNotFound />;
  }

  if (data?.lead) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <LeadNotesBreadcrumb />

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/leads/${id}`}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to lead details</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Notes for {data.lead.name}</h1>
          </div>
        </div>

        <LeadNotesView leadId={id} />
      </div>
    );
  }

  return null;
}

function LeadNotesError({ id }: { id: string }) {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-destructive/20 bg-destructive/5">
        <h3 className="text-lg font-semibold mb-2">Error loading lead notes</h3>
        <p className="text-muted-foreground mb-4">
          There was a problem loading the lead with ID: {id}. Please try again
          later.
        </p>
        <Button variant="outline" asChild>
          <Link href="/leads">Return to Leads List</Link>
        </Button>
      </div>
    </div>
  );
}

function LeadNotesLoader() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-40 w-full bg-muted animate-pulse rounded-md" />
        <div className="h-6 w-32 bg-muted animate-pulse rounded mt-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 w-full bg-muted animate-pulse rounded-md"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
