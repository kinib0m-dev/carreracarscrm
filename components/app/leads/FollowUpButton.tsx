"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface FollowUpButtonProps {
  leadId: string;
}

export function FollowUpButton({ leadId }: FollowUpButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendFollowUp = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/leads/${leadId}/send-followup`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        // Show success message
        // Refresh the table data
        window.location.reload(); // Or use your preferred state management
      } else {
        // Show error message
        console.error("Failed to send follow-up:", data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSendFollowUp}
      disabled={isLoading}
      className="flex items-center space-x-1"
    >
      <MessageCircle className="w-4 h-4" />
      <span>{isLoading ? "Sending..." : "Follow-up"}</span>
    </Button>
  );
}
