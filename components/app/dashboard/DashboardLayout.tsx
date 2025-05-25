"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertTriangle } from "lucide-react";
import { DashboardView } from "./DashboardView";
import { DashboardLoader } from "./DashboardLoader";

export function DashboardLayout() {
  return (
    <Suspense fallback={<DashboardLoader />}>
      <ErrorBoundary fallback={<DashboardError />}>
        <DashboardLayoutSuspense />
      </ErrorBoundary>
    </Suspense>
  );
}

function DashboardLayoutSuspense() {
  return <DashboardView />;
}

function DashboardError() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center rounded-2xl border border-red-300/30 bg-red-50 dark:bg-red-950/10">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
            Error loading dashboard
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            There was a problem loading your dashboard data. Please try again
            later.
          </p>
        </div>
      </div>
    </div>
  );
}
