"use client";

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { EmailHistoryLoader } from "./EmailHistoryLoader";
import { EmailHistoryView } from "./EmailHistoryView";
import { AlertTriangle } from "lucide-react";

export function EmailHistoryLayout() {
  return (
    <Suspense fallback={<EmailHistoryLoader />}>
      <ErrorBoundary fallback={<EmailHistoryError />}>
        <EmailHistoryLayoutSuspense />
      </ErrorBoundary>
    </Suspense>
  );
}

function EmailHistoryLayoutSuspense() {
  // Fetch email history
  const { data, isLoading } = trpc.emails.getEmailHistory.useQuery({
    page: 1,
    limit: 10,
  });

  if (isLoading) {
    return <EmailHistoryLoader />;
  }

  return (
    <EmailHistoryView
      history={data?.history || []}
      pagination={
        data?.pagination || {
          page: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 0,
        }
      }
    />
  );
}

function EmailHistoryError() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center rounded-2xl border border-red-300/30 bg-red-50 dark:bg-red-950/10">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
            Error loading emails history
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            There was a problem loading your emails history. Please try again
            later.
          </p>
        </div>
      </div>
    </div>
  );
}
