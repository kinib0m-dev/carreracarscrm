"use client";

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { EmailsLoader } from "./EmailsLoader";
import { EmailsView } from "./EmailsView";
import { AlertTriangle } from "lucide-react";

export function EmailsLayout() {
  return (
    <Suspense fallback={<EmailsLoader />}>
      <ErrorBoundary fallback={<EmailsError />}>
        <EmailsLayoutSuspense />
      </ErrorBoundary>
    </Suspense>
  );
}

function EmailsLayoutSuspense() {
  // Fetch email templates
  const { data, isLoading } = trpc.emails.list.useQuery({
    page: 1,
    limit: 10,
  });

  if (isLoading) {
    return <EmailsLoader />;
  }

  return (
    <EmailsView
      templates={data?.templates || []}
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

function EmailsError() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center rounded-2xl border border-red-300/30 bg-red-50 dark:bg-red-950/10">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
            Error loading emails
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            There was a problem loading your emails. Please try again later.
          </p>
        </div>
      </div>
    </div>
  );
}
