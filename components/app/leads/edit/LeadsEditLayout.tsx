"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { LeadsNotFound } from "../detail/LeadsNotFound";
import { LeadsEditLoader } from "./LeadsEditLoader";
import { LeadsEditView } from "./LeadsEditView";
import { AlertTriangle } from "lucide-react";

export function LeadsEditLayout({ id }: { id: string }) {
  return (
    <Suspense fallback={<LeadsEditLoader />}>
      <ErrorBoundary fallback={<LeadsEditError />}>
        <LeadsEditLayoutSuspense id={id} />
      </ErrorBoundary>
    </Suspense>
  );
}

function LeadsEditLayoutSuspense({ id }: { id: string }) {
  const { data, error, isLoading } = trpc.lead.getById.useQuery(
    { id },
    {
      retry: 1, // Only retry once to avoid unnecessary retries on genuine 404s
      retryDelay: 500,
    }
  );

  if (isLoading) {
    return <LeadsEditLoader />;
  }

  if (error) {
    if (error.data?.code === "NOT_FOUND") {
      return <LeadsNotFound />;
    }
    return <LeadsEditError />;
  }

  if (!isLoading && !data?.lead) {
    return <LeadsNotFound />;
  }

  if (data?.lead) {
    return <LeadsEditView lead={data.lead} />;
  }

  return null;
}

function LeadsEditError() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center rounded-2xl border border-red-300/30 bg-red-50 dark:bg-red-950/10">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
            Error loading leads
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            There was a problem loading your leads. Please try again later.
          </p>
          <Button variant="outline" asChild>
            <Link href="/leads">Return to leads List</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
