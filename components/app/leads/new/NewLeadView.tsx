"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ManualLeadForm } from "./ManualLeadForm";
import { CSVLeadUpload } from "./CSVLeadUpload";

export function NewLeadView() {
  return (
    <div className="container py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/leads">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to leads</span>
              </Link>
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
