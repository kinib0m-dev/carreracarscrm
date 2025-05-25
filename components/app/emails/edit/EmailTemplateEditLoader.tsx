import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EmailTemplateEditLoader() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/emails">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to email templates</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Email Template</h1>
      </div>

      {/* Edit Form Skeleton */}
      <Card className="shadow-sm">
        <CardHeader>
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-5 w-40 mt-1.5" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Template Information Section */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-48" />

              <div className="space-y-4">
                {/* Template Name Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Target Statuses Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Email Content Section */}
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />

              <div className="space-y-4">
                {/* Email Subject Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Email Content Field */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-40 w-full" />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
