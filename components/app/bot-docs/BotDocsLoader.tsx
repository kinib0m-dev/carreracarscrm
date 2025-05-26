import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BotDocsLoader() {
  return (
    <div className="space-y-6">
      {/* Filters Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* First row: Search and quick filters */}
            <div className="flex flex-wrap gap-x-4 gap-y-3 items-start sm:items-center">
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-1">
                <Skeleton className="h-10 w-full sm:w-64" />
                <Skeleton className="h-10 w-full sm:w-20" />
              </div>
              <Skeleton className="h-10 w-full sm:w-36" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full sm:w-40" />
              <Skeleton className="h-10 w-full sm:w-auto sm:ml-auto" />
            </div>

            {/* Second row: Detailed filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>

            {/* Third row: Additional range filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <div className="overflow-x-auto border rounded-md">
        <div className="w-full">
          {/* Table Header */}
          <div className="bg-muted/50 border-b">
            <div className="flex items-center p-4 gap-4">
              <Skeleton className="h-4 w-12" /> {/* Image column */}
              <Skeleton className="h-4 w-32" /> {/* Vehicle */}
              <Skeleton className="h-4 w-20" /> {/* Type */}
              <Skeleton className="h-4 w-24" /> {/* Details */}
              <Skeleton className="h-4 w-24" /> {/* Kilometers */}
              <Skeleton className="h-4 w-20" /> {/* Price */}
              <Skeleton className="h-4 w-16" /> {/* Status */}
              <Skeleton className="h-4 w-20" /> {/* Added */}
              <Skeleton className="h-4 w-16" /> {/* Actions */}
            </div>
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center p-4 gap-4 border-b last:border-0 hover:bg-muted/50"
            >
              {/* Image */}
              <Skeleton className="h-10 w-10 rounded-md" />

              {/* Vehicle Info */}
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
              </div>

              {/* Type Badge */}
              <Skeleton className="h-6 w-16 rounded-full" />

              {/* Details */}
              <div className="space-y-1 w-32">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>

              {/* Kilometers */}
              <Skeleton className="h-4 w-20" />

              {/* Price */}
              <Skeleton className="h-4 w-24" />

              {/* Status */}
              <Skeleton className="h-6 w-20 rounded-full" />

              {/* Added Date */}
              <div className="w-24">
                <Skeleton className="h-3 w-20" />
              </div>

              {/* Actions */}
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
