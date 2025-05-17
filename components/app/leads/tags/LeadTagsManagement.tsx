"use client";

import { useState } from "react";
import { PlusCircle, X, Edit, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useAllTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  useLeadTags,
  useAttachTag,
  useDetachTag,
} from "@/lib/leads/hooks/use-lead-tags";
import { toast } from "sonner";
import { TagEntity } from "@/types/leads";

interface LeadTagsManagementProps {
  leadId: string;
}

export function LeadTagsManagement({ leadId }: LeadTagsManagementProps) {
  // Fetch all tags and lead-specific tags
  const { tags: allTags, isLoading: isLoadingAllTags } = useAllTags();
  const { tags: leadTags, refetch: refetchLeadTags } = useLeadTags(leadId);

  // CRUD hooks
  const { createTag, isLoading: isCreating } = useCreateTag();
  const {
    updateTag,
    isLoading: isUpdating,
    editingTagId,
    setEditingTagId,
  } = useUpdateTag();
  const { deleteTag, isLoading: isDeleting } = useDeleteTag();
  const { attachTag, isLoading: isAttaching } = useAttachTag();
  const { detachTag, isLoading: isDetaching } = useDetachTag();

  // Component state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  // Form state
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#cccccc");
  const [newTagDescription, setNewTagDescription] = useState("");

  const [editTagName, setEditTagName] = useState("");
  const [editTagColor, setEditTagColor] = useState("");
  const [editTagDescription, setEditTagDescription] = useState("");

  // Helper to check if a tag is already attached to the lead
  const isTagAttached = (tagId: string) => {
    return leadTags.some((tag) => tag.id === tagId);
  };

  // Reset form fields
  const resetFormFields = () => {
    setNewTagName("");
    setNewTagColor("#cccccc");
    setNewTagDescription("");
    setEditTagName("");
    setEditTagColor("");
    setEditTagDescription("");
  };

  // Handle tag creation
  const handleCreateTag = async () => {
    try {
      if (!newTagName.trim()) {
        toast.error("Tag name is required");
        return;
      }

      await createTag({
        name: newTagName.trim(),
        color: newTagColor || "#cccccc",
        description: newTagDescription.trim() || undefined,
      });

      resetFormFields();
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error is handled by the hook
      console.error("Error creating tag:", error);
    }
  };

  // Set up tag for editing
  const startEditingTag = (tag: TagEntity) => {
    setEditingTagId(tag.id);
    setEditTagName(tag.name);
    setEditTagColor(tag.color || "#cccccc");
    setEditTagDescription(tag.description || "");
  };

  // Handle tag update
  const handleUpdateTag = async (tagId: string) => {
    try {
      if (!editTagName.trim()) {
        toast.error("Tag name is required");
        return;
      }

      await updateTag({
        id: tagId,
        name: editTagName.trim(),
        color: editTagColor || "#cccccc",
        description: editTagDescription.trim() || undefined,
      });

      setEditingTagId(null);
      resetFormFields();
    } catch (error) {
      // Error is handled by the hook
      console.error("Error updating tag:", error);
    }
  };

  // Handle tag deletion
  const openDeleteDialog = (tagId: string) => {
    setTagToDelete(tagId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;

    try {
      await deleteTag(tagToDelete);
      setIsDeleteDialogOpen(false);
      setTagToDelete(null);

      // Refresh lead tags in case the deleted tag was attached
      refetchLeadTags();
    } catch (error) {
      // Error is handled by the hook
      console.error("Error deleting tag:", error);
    }
  };

  // Handle tag attachment/detachment
  const handleToggleTag = async (tagId: string) => {
    try {
      if (isTagAttached(tagId)) {
        await detachTag({ leadId, tagId });
      } else {
        await attachTag({ leadId, tagId });
      }
    } catch (error) {
      // Error is handled by the hook
      console.error("Error toggling tag:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lead Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Current Tags</CardTitle>
          <CardDescription>
            Tags currently associated with this lead
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leadTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {leadTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center gap-2 rounded-md border px-3 py-1.5"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : "#e5e7eb",
                    borderColor: tag.color ? tag.color : "#d1d5db",
                  }}
                >
                  <span className="text-sm font-medium">{tag.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 rounded-full"
                    onClick={() => handleToggleTag(tag.id)}
                    disabled={isDetaching}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove tag</span>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No tags have been added to this lead yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Available Tags</CardTitle>
          <CardDescription>
            Add tags to help categorize and filter leads
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add New Tag button */}
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create New Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tag</DialogTitle>
                  <DialogDescription>
                    Add a new tag to help organize and filter your leads.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Tag name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="color" className="text-sm font-medium">
                      Color
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="color"
                        type="color"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        className="w-16 p-1 h-10"
                      />
                      <Input
                        type="text"
                        value={newTagColor}
                        onChange={(e) => setNewTagColor(e.target.value)}
                        placeholder="#cccccc"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="description"
                      className="text-sm font-medium"
                    >
                      Description (Optional)
                    </label>
                    <Textarea
                      id="description"
                      value={newTagDescription}
                      onChange={(e) => setNewTagDescription(e.target.value)}
                      placeholder="Tag description"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetFormFields();
                      setIsCreateDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTag} disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Tag"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Tags list */}
            <div className="space-y-3">
              {isLoadingAllTags ? (
                <p className="text-sm text-muted-foreground">Loading tags...</p>
              ) : allTags.length > 0 ? (
                allTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between border rounded-md p-3"
                  >
                    {editingTagId === tag.id ? (
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Input
                            value={editTagName}
                            onChange={(e) => setEditTagName(e.target.value)}
                            placeholder="Tag name"
                            className="flex-1"
                          />
                          <Input
                            type="color"
                            value={editTagColor}
                            onChange={(e) => setEditTagColor(e.target.value)}
                            className="w-12 p-1 h-9"
                          />
                        </div>
                        <Textarea
                          value={editTagDescription}
                          onChange={(e) =>
                            setEditTagDescription(e.target.value)
                          }
                          placeholder="Tag description (optional)"
                          rows={2}
                          className="text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTagId(null);
                              resetFormFields();
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateTag(tag.id)}
                            disabled={isUpdating}
                          >
                            {isUpdating ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: tag.color || "#cccccc" }}
                          />
                          <div>
                            <div className="font-medium">{tag.name}</div>
                            {tag.description && (
                              <div className="text-xs text-muted-foreground">
                                {tag.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTagAttached(tag.id) ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1"
                              onClick={() => handleToggleTag(tag.id)}
                              disabled={isDetaching}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Applied
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleToggleTag(tag.id)}
                              disabled={isAttaching}
                            >
                              Apply
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => startEditingTag(tag)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit tag</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => openDeleteDialog(tag.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete tag</span>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No tags available. Create your first tag to get started.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tag? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setTagToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTag}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
