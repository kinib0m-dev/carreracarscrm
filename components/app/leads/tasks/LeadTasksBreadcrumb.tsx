"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";
import { useParams } from "next/navigation";
import { trpc } from "@/trpc/client";

export function LeadTasksBreadcrumb() {
  const params = useParams();
  const leadId = params.id as string;

  const { data } = trpc.lead.getById.useQuery(
    { id: leadId },
    {
      enabled: !!leadId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const leadName = data?.lead?.name || "Lead";

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-6">
      <Button variant="link" className="p-0 h-auto" asChild>
        <Link href="/leads">
          <Home className="h-4 w-4" />
          <span className="sr-only">Home</span>
        </Link>
      </Button>
      <ChevronRight className="h-4 w-4 mx-1" />
      <Button variant="link" className="p-0 h-auto" asChild>
        <Link href="/leads">Leads</Link>
      </Button>
      <ChevronRight className="h-4 w-4 mx-1" />
      <Button variant="link" className="p-0 h-auto" asChild>
        <Link href={`/leads/${leadId}`}>{leadName}</Link>
      </Button>
      <ChevronRight className="h-4 w-4 mx-1" />
      <Button variant="link" className="p-0 h-auto text-foreground font-medium">
        Tasks
      </Button>
    </nav>
  );
}
