import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PlaygroundLoader() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>

        {/* Chat area */}
        <Card className="border p-4 h-[calc(100vh-200px)] flex flex-col">
          <div className="flex-1 overflow-auto space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
              >
                <Skeleton
                  className={`h-12 w-2/3 rounded-lg ${i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"}`}
                />
              </div>
            ))}
          </div>
          <div className="pt-4 border-t mt-4">
            <Skeleton className="h-12 w-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}
