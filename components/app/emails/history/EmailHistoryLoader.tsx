import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EmailHistoryLoader() {
  return (
    <div className="space-y-4 container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* History list */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 border-b pb-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-20 ml-auto" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-4 py-4 border-b last:border-0"
            >
              <Skeleton className="h-5 w-full max-w-[200px]" />
              <Skeleton className="h-5 w-full max-w-[250px]" />
              <Skeleton className="h-5 w-16" />
              <div className="flex justify-end">
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
