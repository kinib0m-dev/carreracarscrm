"use client";

import { LeadWithTagsAndCampaign } from "@/types/leads";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { format } from "date-fns";
import { Mail, MessageCircle, MoreHorizontal, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  daysSinceLastContact,
  formatTimeframe,
  getLeadStatusIndicator,
  getStatusBadgeClass,
  getTimeframeColor,
} from "@/lib/leads/utils/lead-utils";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const FOLLOW_UP_CONFIG = {
  ACTIVE_STATUSES: [
    "nuevo",
    "contactado",
    "activo",
    "calificado",
    "propuesta",
    "evaluando",
  ],
  MAX_FOLLOW_UPS: 3,
};

type LeadsTableProps = {
  leads: LeadWithTagsAndCampaign[];
  isLoading?: boolean;
  onLeadUpdate?: () => void;
};

// Follow-up button component
function FollowUpButton({
  leadId,
  onSuccess,
}: {
  leadId: string;
  onSuccess?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSendFollowUp = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/leads/${leadId}/send-followup`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Follow-up sent successfully!");
        onSuccess?.(); // Refresh the table data
      } else {
        toast.error(`Failed to send follow-up: ${data.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send follow-up message");
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

// Helper function to format follow-up date with time
const formatFollowUpDate = (date: Date | null) => {
  if (!date) return null;

  const followUpDate = new Date(date);
  const now = new Date();

  // Check if it's today
  const isToday = followUpDate.toDateString() === now.toDateString();

  // Check if it's tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = followUpDate.toDateString() === tomorrow.toDateString();

  // Check if it's yesterday (overdue)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = followUpDate.toDateString() === yesterday.toDateString();

  // Format time
  const timeString = format(followUpDate, "HH:mm");

  if (isToday) {
    return {
      dateLabel: "Today",
      timeLabel: timeString,
      isOverdue: followUpDate < now,
      isUrgent: true,
    };
  } else if (isTomorrow) {
    return {
      dateLabel: "Tomorrow",
      timeLabel: timeString,
      isOverdue: false,
      isUrgent: true,
    };
  } else if (isYesterday) {
    return {
      dateLabel: "Yesterday",
      timeLabel: timeString,
      isOverdue: true,
      isUrgent: true,
    };
  } else {
    // Check if it's in the past (overdue)
    const isOverdue = followUpDate < now;

    return {
      dateLabel: format(followUpDate, "MMM d, yyyy"),
      timeLabel: timeString,
      isOverdue,
      isUrgent: false,
    };
  }
};

export function LeadsTable({
  leads,
  isLoading = false,
  onLeadUpdate,
}: LeadsTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center">Loading leads...</div>;
  }

  if (leads.length === 0) {
    return (
      <div className="p-8 text-center">
        No leads found matching your criteria.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Purchase Timeframe</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead>Next Follow-up</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => {
            const { color } = getLeadStatusIndicator(lead);
            const timeframeColor = getTimeframeColor(
              lead.expectedPurchaseTimeframe
            );

            const followUpInfo = formatFollowUpDate(lead.nextFollowUpDate);

            // Check if we can send follow-up
            const canSendFollowUp =
              FOLLOW_UP_CONFIG.ACTIVE_STATUSES.includes(lead.status) &&
              (lead.followUpCount || 0) < FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS &&
              lead.phone;

            return (
              <TableRow key={lead.id}>
                <TableCell>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium hover:underline"
                  >
                    {lead.name}
                  </Link>
                  {lead.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lead.tags.slice(0, 2).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs py-0"
                          style={{
                            borderColor: tag.color || undefined,
                            color: tag.color || undefined,
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                      {lead.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs py-0">
                          +{lead.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    {lead.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {lead.email}
                        </span>
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {lead.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeClass(color)}>
                    {lead.status}
                  </Badge>
                  {(lead.followUpCount || 0) > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Follow-ups: {lead.followUpCount}/
                      {FOLLOW_UP_CONFIG.MAX_FOLLOW_UPS}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {lead.campaignName || "No campaign"}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeClass(timeframeColor)}>
                    {formatTimeframe(lead.expectedPurchaseTimeframe)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {lead.lastContactedAt ? (
                      <>
                        <span className="text-gray-900">
                          {format(
                            new Date(lead.lastContactedAt),
                            "MMM d, HH:mm"
                          )}
                        </span>
                        <div className="text-xs text-gray-500">
                          {daysSinceLastContact(lead)} days ago
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400">Never</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {followUpInfo ? (
                    <div className="text-sm">
                      <span
                        className={`font-medium ${
                          followUpInfo.isOverdue
                            ? "text-red-600"
                            : followUpInfo.isUrgent
                              ? "text-orange-600"
                              : "text-gray-900"
                        }`}
                      >
                        {followUpInfo.dateLabel}
                      </span>
                      <div className="text-xs text-gray-500">
                        {followUpInfo.timeLabel}
                        {followUpInfo.isOverdue && " (Overdue)"}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      No follow-up scheduled
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {canSendFollowUp && (
                      <FollowUpButton
                        leadId={lead.id}
                        onSuccess={onLeadUpdate}
                      />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/leads/${lead.id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/leads/${lead.id}/edit`}>Edit lead</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
