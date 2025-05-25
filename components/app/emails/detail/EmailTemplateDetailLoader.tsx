import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EmailTemplateDetailLoader() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/emails">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to emails</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Email Template Details</h1>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Template Overview Card */}
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

            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-40" />
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

      {/* Send Email Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
