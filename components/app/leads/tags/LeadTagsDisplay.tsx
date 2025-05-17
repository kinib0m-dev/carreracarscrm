"use client";

import { useState, useEffect, JSX } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadTags } from "@/lib/leads/hooks/use-lead-tags";

interface LeadTagsDisplayProps {
  leadId: string;
  displayType?: "list" | "inline";
  className?: string;
}

export function LeadTagsDisplay({
  leadId,
  displayType = "inline",
  className = "",
}: LeadTagsDisplayProps) {
  const { tags, isLoading } = useLeadTags(leadId);
  const [renderedTags, setRenderedTags] = useState<JSX.Element[]>([]);

  useEffect(() => {
    if (tags) {
      const elements = tags.map((tag) => (
        <div
          key={tag.id}
          className={
            displayType === "inline"
              ? "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs"
              : "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
          }
          style={{
            backgroundColor: tag.color ? `${tag.color}20` : "#e5e7eb",
            borderColor: tag.color ? tag.color : "#d1d5db",
          }}
        >
          <span>{tag.name}</span>
        </div>
      ));

      setRenderedTags(elements);
    }
  }, [tags, displayType]);

  if (isLoading) {
    return displayType === "inline" ? (
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
    ) : (
      <div className="space-y-2">
        <Skeleton className="h-8 w-24 rounded-md" />
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return <span className="text-muted-foreground italic">No tags</span>;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>{renderedTags}</div>
  );
}
