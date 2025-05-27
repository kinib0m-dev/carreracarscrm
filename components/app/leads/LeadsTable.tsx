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
import { Mail, MoreHorizontal, Phone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  daysSinceLastContact,
  daysUntilNextFollowUp,
  formatTimeframe,
  getLeadStatusIndicator,
  getStatusBadgeClass,
  getTimeframeColor,
} from "@/lib/leads/utils/lead-utils";
import Link from "next/link";

type LeadsTableProps = {
  leads: LeadWithTagsAndCampaign[];
  isLoading?: boolean;
};

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

export function LeadsTable({ leads, isLoading = false }: LeadsTableProps) {
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
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {lead.email}
                      </div>
                    )}
                    {lead.phone && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                      </div>
                    )}
                    {!lead.email && !lead.phone && (
                      <span className="text-muted-foreground italic">
                        No contact info
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadgeClass(color)}>
                    {lead.status
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </TableCell>
                <TableCell>
                  {lead.campaignName ? (
                    <span>{lead.campaignName}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">None</span>
                  )}
                </TableCell>
                <TableCell>
                  {lead.expectedPurchaseTimeframe ? (
                    <Badge className={getStatusBadgeClass(timeframeColor)}>
                      {formatTimeframe(lead.expectedPurchaseTimeframe)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      No definido
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {lead.lastContactedAt ? (
                    <div>
                      <div>
                        {format(new Date(lead.lastContactedAt), "MMM d, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {daysSinceLastContact(lead)} days ago
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">Never</span>
                  )}
                </TableCell>
                <TableCell>
                  {followUpInfo ? (
                    <div className="space-y-1">
                      <div
                        className={`text-sm font-medium ${
                          followUpInfo.isOverdue
                            ? "text-red-600 dark:text-red-400"
                            : followUpInfo.isUrgent
                              ? "text-amber-600 dark:text-amber-400"
                              : ""
                        }`}
                      >
                        {followUpInfo.dateLabel}
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={
                            followUpInfo.isOverdue ? "destructive" : "outline"
                          }
                          className="text-xs"
                        >
                          {followUpInfo.timeLabel}
                        </Badge>
                        {followUpInfo.isOverdue && (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      {!followUpInfo.isUrgent && (
                        <div className="text-xs text-muted-foreground">
                          In {daysUntilNextFollowUp(lead)} days
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      Not scheduled
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/leads/${lead.id}`}>View Details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/leads/${lead.id}/edit`}>Edit Lead</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/leads/${lead.id}/notes`}>Add Note</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
