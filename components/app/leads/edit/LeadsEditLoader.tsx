"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function LeadsEditLoader() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Lead</h1>
            <Skeleton className="h-5 w-48 mt-1" />
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <Separator />

      {/* Edit Form Card Skeleton */}
      <div className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  <Skeleton className="h-7 w-40" />
                </CardTitle>
                <TabsList className="grid grid-cols-2 w-[300px]">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Lead Details</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>
                <Skeleton className="h-5 w-full max-w-md" />
              </CardDescription>
            </CardHeader>

            <CardContent>
              <TabsContent value="basic" className="mt-0 space-y-5">
                {/* Name Field Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Email Field Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>

                {/* Phone Field Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Type Field Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </TabsContent>

              <TabsContent value="details" className="mt-0 space-y-5">
                {/* Status Field Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-3/5" />
                </div>

                {/* Timeframe Field Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>

                {/* Budget Field Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Next Follow-up Date Skeleton */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </TabsContent>
            </CardContent>

            <CardFooter className="flex justify-end border-t pt-6">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-36" />
              </div>
            </CardFooter>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
