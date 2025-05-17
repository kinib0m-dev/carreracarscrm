"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUp, PlusCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { trpc } from "@/trpc/client";
import { LeadNotes } from "@/types/leads";

interface NotesPreviewProps {
  leadId: string;
}

export function NotesPreview({ leadId }: NotesPreviewProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, isLoading } = trpc.leadNote.getByLeadId.useQuery(
    { leadId },
    {
      enabled: isMounted,
      staleTime: 30 * 1000,
    }
  );

  const notes = data?.notes || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No notes recorded</h3>
            <p className="text-muted-foreground max-w-md">
              Keep important information and context about this lead by adding
              notes.
            </p>
            <Button className="mt-4" asChild>
              <Link
                href={`/leads/${leadId}/notes`}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add First Note
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Only show the latest 3 notes in the preview
  const previewNotes = notes.slice(0, 3);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {previewNotes.map((note: LeadNotes) => (
            <div
              key={note.id}
              className="border-b pb-4 last:border-0 last:pb-0"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-muted-foreground">
                  {format(new Date(note.createdAt), "PPP 'at' p")}
                </div>
              </div>
              <div className="line-clamp-3 text-sm">{note.content}</div>
            </div>
          ))}

          {notes.length > 3 && (
            <div className="text-center pt-2">
              <Button variant="outline" asChild>
                <Link href={`/leads/${leadId}/notes`}>
                  View All Notes ({notes.length})
                </Link>
              </Button>
            </div>
          )}

          <div className="text-center pt-2">
            <Button asChild>
              <Link href={`/leads/${leadId}/notes`}>Manage Notes</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
