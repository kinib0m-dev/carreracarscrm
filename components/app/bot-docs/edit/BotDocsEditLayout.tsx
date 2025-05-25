"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { BotDocumentEditLoader } from "./BotDocsEditLoader";
import { BotDocumentNotFound } from "../detail/BotDocsNotFound";
import { BotDocumentEditView } from "./BotDocsEditView";
import { AlertTriangle } from "lucide-react";

export function BotDocumentEditLayout({ id }: { id: string }) {
  return (
    <Suspense fallback={<BotDocumentEditLoader />}>
      <ErrorBoundary fallback={<BotDocumentEditError />}>
        <BotDocumentEditLayoutSuspense id={id} />
      </ErrorBoundary>
    </Suspense>
  );
}

function BotDocumentEditLayoutSuspense({ id }: { id: string }) {
  const { data, error, isLoading } = trpc.botDocs.getById.useQuery(
    { id },
    {
      retry: 1, // Only retry once to avoid unnecessary retries on genuine 404s
      retryDelay: 500,
    }
  );

  if (isLoading) {
    return <BotDocumentEditLoader />;
  }

  if (error) {
    if (error.data?.code === "NOT_FOUND") {
      return <BotDocumentNotFound />;
    }
    return <BotDocumentEditError />;
  }

  if (!isLoading && !data?.document) {
    return <BotDocumentNotFound />;
  }

  if (data?.document) {
    return <BotDocumentEditView document={data.document} />;
  }

  return null;
}

function BotDocumentEditError() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center rounded-2xl border border-red-300/30 bg-red-50 dark:bg-red-950/10">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
            Error loading document
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            There was a problem loading your document. Please try again later.
          </p>
          <Button variant="outline" asChild>
            <Link href="/bot-docs">Return to docs list</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
