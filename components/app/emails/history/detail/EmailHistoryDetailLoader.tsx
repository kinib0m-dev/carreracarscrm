import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EmailHistoryDetailsLoader() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/emails/history">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to email history</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Email Campaign Details</h1>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-1/3" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-5 w-40 mt-1.5" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>

            <div className="flex gap-2 items-center">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>

            <div className="flex gap-2 items-center">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Content Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recipients Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-24" />
            </div>

            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
