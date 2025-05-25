"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { SettingsView } from "./SettingsView";
import { SettingsLoader } from "./SettingsLoader";

export function SettingsLayout() {
  return (
    <Suspense fallback={<SettingsLoader />}>
      <ErrorBoundary fallback={<SettingsPageError />}>
        <SettingsView />
      </ErrorBoundary>
    </Suspense>
  );
}

function SettingsPageError() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-destructive/20 bg-destructive/5">
        <h3 className="text-lg font-semibold mb-2">Error loading settings</h3>
        <p className="text-muted-foreground mb-4">
          There was a problem loading your settings. Please try again later.
        </p>
      </div>
    </div>
  );
}
