"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EmailTemplateForm } from "./EmailTemplateForm";

export function NewEmailTemplateView() {
  return (
    <div className="container py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/emails">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to email templates</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Create Email Template</h1>
          </div>
        </div>

        <EmailTemplateForm />
      </div>
    </div>
  );
}
