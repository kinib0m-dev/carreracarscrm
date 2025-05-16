import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function LeadsDetailLoader() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Lead Details</h1>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Information Card */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </span>
              <Skeleton className="h-6 w-24 rounded-full" />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {/* Contact Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Details Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-28" />
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-14 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Follow-up Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>
              <Skeleton className="h-6 w-24" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <div className="flex items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 ml-2 rounded-full" />
              </div>
            </div>

            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <div className="flex items-center">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20 ml-2 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content area */}
      <Tabs defaultValue="emails" className="space-y-4">
        <TabsList>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>
        <TabsContent value="emails">
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="flex justify-end">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
