"use client";

import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { PlaygroundLoader } from "./PlaygroundLoader";
import { PlaygroundView } from "./PlaygroundView";

export function PlaygroundLayout() {
  return (
    <Suspense fallback={<PlaygroundLoader />}>
      <ErrorBoundary fallback={<BotPlaygroundError />}>
        <BotPlaygroundLayoutSuspense />
      </ErrorBoundary>
    </Suspense>
  );
}

function BotPlaygroundLayoutSuspense() {
  const { data, isLoading } = trpc.playground.listConversations.useQuery();

  if (isLoading) {
    return <PlaygroundLoader />;
  }

  return <PlaygroundView conversations={data?.conversations || []} />;
}

function BotPlaygroundError() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-destructive/20 bg-destructive/5">
        <h3 className="text-lg font-semibold mb-2">Error loading playground</h3>
        <p className="text-muted-foreground mb-4">
          There was a problem loading the sales funnel playground. Please try
          again later.
        </p>
      </div>
    </div>
  );
}
