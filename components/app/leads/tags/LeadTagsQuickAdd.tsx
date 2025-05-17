"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAllTags, useAttachTag } from "@/lib/leads/hooks/use-lead-tags";

interface LeadTagQuickAddProps {
  leadId: string;
  onTagAdded?: () => void;
}

export function LeadTagQuickAdd({ leadId, onTagAdded }: LeadTagQuickAddProps) {
  const { tags: allTags, isLoading } = useAllTags();
  const { attachTag, isLoading: isAttaching } = useAttachTag();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");

  // Reset selected tag when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTagId("");
    }
  }, [isOpen]);

  const handleAddTag = async () => {
    if (!selectedTagId) {
      toast.error("Please select a tag");
      return;
    }

    try {
      await attachTag({ leadId, tagId: selectedTagId });
      toast.success("Tag added successfully");
      setIsOpen(false);
      if (onTagAdded) {
        onTagAdded();
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Add Tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tag to Lead</DialogTitle>
          <DialogDescription>
            Choose a tag to add to this lead for better organization.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select
            value={selectedTagId}
            onValueChange={setSelectedTagId}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a tag" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="" disabled>
                  Loading tags...
                </SelectItem>
              ) : allTags.length > 0 ? (
                allTags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color || "#cccccc" }}
                      />
                      <span>{tag.name}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  No tags available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddTag}
            disabled={isAttaching || !selectedTagId}
          >
            {isAttaching ? "Adding..." : "Add Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
