"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

import { Loader2, PencilIcon, TrashIcon, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateLeadNote,
  useDeleteLeadNote,
  useLeadNotes,
  useUpdateLeadNote,
} from "@/lib/leads/hooks/use-lead-notes";
import { LeadNotes } from "@/types/leads";

interface LeadNotesViewProps {
  leadId: string;
}

export function LeadNotesView({ leadId }: LeadNotesViewProps) {
  const [newNote, setNewNote] = useState("");
  const [editedNote, setEditedNote] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  const { notes, isLoading, refetch } = useLeadNotes(leadId);
  const { createNote, isLoading: isCreating } = useCreateLeadNote();
  const {
    updateNote,
    isLoading: isUpdating,
    editingNoteId,
    setEditingNoteId,
  } = useUpdateLeadNote();
  const { deleteNote, isLoading: isDeleting } = useDeleteLeadNote();

  const handleCreateNote = async () => {
    if (!newNote.trim()) return;

    try {
      await createNote({
        leadId,
        content: newNote,
      });
      setNewNote("");
      refetch();
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const handleStartEdit = (note: LeadNotes) => {
    setEditingNoteId(note.id);
    setEditedNote(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditedNote("");
  };

  const handleUpdateNote = async () => {
    if (!editingNoteId || !editedNote.trim()) return;

    try {
      await updateNote({
        id: editingNoteId,
        content: editedNote,
      });
      refetch();
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;

    try {
      await deleteNote(deleteNoteId);
      setDeleteNoteId(null);
      refetch();
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  if (isLoading) {
    return <LeadNotesLoader />;
  }

  return (
    <div className="space-y-4">
      {/* New Note Input */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Add Note</h3>
          <div className="space-y-4">
            <Textarea
              placeholder="Type your note here..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[120px]"
            />
            <Button
              onClick={handleCreateNote}
              disabled={isCreating || !newNote.trim()}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Note...
                </>
              ) : (
                "Add Note"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <h3 className="text-lg font-medium mt-6">Notes History</h3>
      {notes.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">
            No notes added yet. Start adding notes to keep track of important
            information.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note: LeadNotes) => (
            <Card key={note.id} className="shadow-sm">
              <CardContent className="p-4">
                {editingNoteId === note.id ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editedNote}
                      onChange={(e) => setEditedNote(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdateNote}
                        disabled={isUpdating || !editedNote.trim()}
                        size="sm"
                      >
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(note.createdAt), "PPP 'at' p")}
                        {note.updatedAt !== note.createdAt && (
                          <span className="ml-2 text-xs">(edited)</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartEdit(note)}
                          className="h-8 w-8"
                        >
                          <PencilIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteNoteId(note.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <TrashIcon className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    <div className="whitespace-pre-wrap">{note.content}</div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteNoteId}
        onOpenChange={(open) => !open && setDeleteNoteId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteNoteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteNote}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LeadNotesLoader() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>

      <Skeleton className="h-6 w-32 mt-6" />

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mt-4" />
              <Skeleton className="h-4 w-4/5 mt-2" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
