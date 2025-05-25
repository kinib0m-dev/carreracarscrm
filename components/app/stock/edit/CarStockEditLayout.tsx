"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { trpc } from "@/trpc/client";
import { CarStockNotFound } from "../detail/CarStockNotFound";
import { CarStockEditLoader } from "./CarStockEditLoader";
import { CarStockEditView } from "./CarStockEditView";
import { AlertTriangle } from "lucide-react";

export function CarStockEditLayout({ id }: { id: string }) {
  return (
    <Suspense fallback={<CarStockEditLoader />}>
      <ErrorBoundary fallback={<CarStockEditError />}>
        <CarStockEditLayoutSuspense id={id} />
      </ErrorBoundary>
    </Suspense>
  );
}

function CarStockEditLayoutSuspense({ id }: { id: string }) {
  const { data, error, isLoading } = trpc.stock.getById.useQuery(
    { id },
    {
      retry: 1, // Only retry once to avoid unnecessary retries on genuine 404s
      retryDelay: 500,
    }
  );

  if (isLoading) {
    return <CarStockEditLoader />;
  }

  if (error) {
    if (error.data?.code === "NOT_FOUND") {
      return <CarStockNotFound />;
    }
    return <CarStockEditError />;
  }

  if (!isLoading && !data?.carStock) {
    return <CarStockNotFound />;
  }

  if (data?.carStock) {
    return <CarStockEditView carStock={data.carStock} />;
  }

  return null;
}

function CarStockEditError() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col items-center justify-center gap-4 p-6 text-center rounded-2xl border border-red-300/30 bg-red-50 dark:bg-red-950/10">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">
            Error loading stock
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            There was a problem loading your stock. Please try again later.
          </p>
          <Button variant="outline" asChild>
            <Link href="/stock">Return to stock</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
