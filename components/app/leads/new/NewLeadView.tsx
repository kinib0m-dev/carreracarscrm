"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ManualLeadForm } from "./ManualLeadForm";
import { CSVLeadUpload } from "./CSVLeadUpload";
import { useRouter } from "next/navigation";

export function NewLeadView() {
  const router = useRouter();
  return (
    <div className="py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Create New Lead</h1>
          </div>
        </div>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="manual" className="flex-1">
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex-1">
              CSV Upload
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual">
            <ManualLeadForm />
          </TabsContent>
          <TabsContent value="csv">
            <CSVLeadUpload />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
