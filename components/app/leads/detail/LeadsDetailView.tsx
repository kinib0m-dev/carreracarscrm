"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteLead } from "@/lib/leads/hooks/use-leads";
import {
  daysSinceLastContact,
  daysUntilNextFollowUp,
  formatCurrency,
  formatDate,
  formatTimeframe,
  getLeadStatusIndicator,
  getStatusBadgeClass,
  getTimeframeColor,
} from "@/lib/leads/utils/lead-utils";
import {
  AlertCircle,
  ArrowLeft,
  Badge,
  Briefcase,
  Calendar,
  Car,
  DollarSign,
  Edit,
  Info,
  Mail,
  Phone,
  PlusCircle,
  Settings,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NotesPreview } from "../notes/NotesPreview";
import { TasksPreview } from "../tasks/TaskPreview";
import { LeadTagsManagement } from "../tags/LeadTagsManagement";
import { LeadSendEmail } from "../email/LeadsSendEmail";
import { leadStatusEnum, leadTypeEnum, timeframeEnum } from "@/db/schema";

interface LeadPreferences {
  id: string;
  leadId: string;
  preferredVehicleType?: string | null;
  preferredBrand?: string | null;
  preferredFuelType?: string | null;
  maxKilometers?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  needsFinancing?: boolean | null;
  preferredTransmission?: string | null;
  preferredColors?: string[] | null;
  minBudget?: string | null;
  maxBudget?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LeadWithTagsAndCampaignAndPreferences {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: (typeof leadTypeEnum.enumValues)[number] | null;
  status: (typeof leadStatusEnum.enumValues)[number];
  expectedPurchaseTimeframe: (typeof timeframeEnum.enumValues)[number] | null;
  budget: string | null;
  campaignName: string | null;
  lastContactedAt: Date | null;
  lastMessageAt: Date | null;
  nextFollowUpDate: Date | null;
  followUpCount: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  tags: Array<{
    id: string;
    name: string;
    color: string | null;
    description: string | null;
    createdAt: Date;
  }>;
  preferences?: LeadPreferences | null;
}

interface LeadsDetailViewProps {
  lead: LeadWithTagsAndCampaignAndPreferences;
}

export function LeadsDetailView({ lead }: LeadsDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("emails");

  // Get status indicator for visual representation
  const { color } = getLeadStatusIndicator(lead);
  const timeframeColor = getTimeframeColor(lead.expectedPurchaseTimeframe);

  // Calculate timing information
  const daysSinceContact = daysSinceLastContact(lead);
  const daysUntilFollowUp = daysUntilNextFollowUp(lead);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { deleteLead, isLoading: isDeleting } = useDeleteLead();

  const handleDelete = async () => {
    try {
      await deleteLead(lead.id);
      toast.success("Lead deleted successfully");
      router.push("/leads");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  // Helper function to format vehicle preferences
  const formatVehiclePreferences = (preferences: LeadPreferences) => {
    const items = [];

    if (preferences.preferredVehicleType) {
      items.push({
        label: "Vehicle Type",
        value:
          preferences.preferredVehicleType.charAt(0).toUpperCase() +
          preferences.preferredVehicleType.slice(1),
      });
    }

    if (preferences.preferredBrand) {
      items.push({
        label: "Brand",
        value:
          preferences.preferredBrand.charAt(0).toUpperCase() +
          preferences.preferredBrand.slice(1),
      });
    }

    if (preferences.preferredFuelType) {
      items.push({
        label: "Fuel Type",
        value:
          preferences.preferredFuelType.charAt(0).toUpperCase() +
          preferences.preferredFuelType.slice(1),
      });
    }

    if (preferences.preferredTransmission) {
      items.push({
        label: "Transmission",
        value:
          preferences.preferredTransmission.charAt(0).toUpperCase() +
          preferences.preferredTransmission.slice(1),
      });
    }

    if (preferences.maxKilometers) {
      items.push({
        label: "Max Kilometers",
        value: `${preferences.maxKilometers.toLocaleString()} km`,
      });
    }

    if (preferences.minYear || preferences.maxYear) {
      const yearRange = `${preferences.minYear || "Any"} - ${preferences.maxYear || "Current"}`;
      items.push({ label: "Year Range", value: yearRange });
    }

    if (preferences.preferredColors && preferences.preferredColors.length > 0) {
      items.push({
        label: "Preferred Colors",
        value: preferences.preferredColors
          .map((color) => color.charAt(0).toUpperCase() + color.slice(1))
          .join(", "),
      });
    }

    if (preferences.minBudget || preferences.maxBudget) {
      const minBudget = preferences.minBudget
        ? `${parseFloat(preferences.minBudget).toLocaleString()}€`
        : "No min";
      const maxBudget = preferences.maxBudget
        ? `${parseFloat(preferences.maxBudget).toLocaleString()}€`
        : "No max";
      items.push({
        label: "Budget Range",
        value: `${minBudget} - ${maxBudget}`,
      });
    }

    if (
      preferences.needsFinancing !== null &&
      preferences.needsFinancing !== undefined
    ) {
      items.push({
        label: "Needs Financing",
        value: preferences.needsFinancing ? "Yes" : "No",
      });
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Lead Details</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button className="gap-2" variant={"secondary"} asChild>
            <Link href={`/leads/${lead.id}/edit`}>
              <Edit className="h-4 w-4" />
              Edit Lead
            </Link>
          </Button>
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Lead</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this lead? This action cannot
                  be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-semibold">
                    This will permanently delete &quot;{lead.name}&quot;
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Lead"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contact Information Card */}
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {lead.name}
              </span>
              <div className={getStatusBadgeClass(color)}>
                {lead.status
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </div>
            </CardTitle>
            <CardDescription className="flex flex-col space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Campaign Name
              </p>
              {lead.campaignName ? (
                <p className="text-sm flex items-center gap-1.5">
                  {lead.campaignName}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Not from a campaign
                </p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            {/* Contact Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Info className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 gap-3 pl-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Email
                  </p>
                  {lead.email ? (
                    <p className="text-sm flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {lead.email}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Not provided
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Phone
                  </p>
                  {lead.phone ? (
                    <p className="text-sm flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {lead.phone}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Not provided
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Business Details Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Business Details
              </h3>
              <div className="grid grid-cols-1 gap-3 pl-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Type
                  </p>
                  {lead.type ? (
                    <p className="text-sm flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                      {lead.type
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Not defined
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Budget
                  </p>
                  {lead.budget ? (
                    <p className="text-sm flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatCurrency(Number(lead.budget))}
                    </p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">
                      Not defined
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags && lead.tags.length > 0 ? (
                      lead.tags.map((tag) => (
                        <Badge key={tag.id} className="gap-1.5">
                          <Tag className="h-3 w-3" />
                          {tag.name}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        No tags
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline & Follow-up Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Purchase Timeframe
              </p>
              {lead.expectedPurchaseTimeframe ? (
                <Badge className={getStatusBadgeClass(timeframeColor)}>
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatTimeframe(lead.expectedPurchaseTimeframe)}
                </Badge>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Not defined
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Last Contacted
              </p>
              {lead.lastContactedAt ? (
                <div className="flex items-center">
                  <span className="text-sm font-medium">
                    {formatDate(lead.lastContactedAt)}
                  </span>
                  {daysSinceContact !== null && (
                    <Badge className="ml-2 text-xs">
                      {daysSinceContact} days ago
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Not defined
                </p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Last Message
              </p>
              {lead.lastMessageAt ? (
                <p className="text-sm font-medium">
                  {formatDate(lead.lastMessageAt)}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Not defined
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Next Follow-up
              </p>
              {lead.nextFollowUpDate ? (
                <div className="flex items-center">
                  <span className="text-sm font-medium">
                    {formatDate(lead.nextFollowUpDate)}
                  </span>
                  {daysUntilFollowUp !== null && (
                    <Badge
                      className={`ml-2 text-xs ${daysUntilFollowUp <= 3 ? "bg-amber-50 text-amber-700 ring-amber-600/20" : ""}`}
                    >
                      in {daysUntilFollowUp} days
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Not defined
                </p>
              )}
            </div>

            {lead.followUpCount !== null && lead.followUpCount > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Follow-up Count
                </p>
                <Badge className="text-xs">
                  {lead.followUpCount} attempt
                  {lead.followUpCount !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Preferences Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicle Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lead.preferences ? (
              <div className="space-y-3">
                {formatVehiclePreferences(lead.preferences).map(
                  (item, index) => (
                    <div key={index} className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  )
                )}
                {formatVehiclePreferences(lead.preferences).length === 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Settings className="h-4 w-4" />
                    <p className="text-sm italic">
                      No specific preferences recorded
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Settings className="h-4 w-4" />
                <p className="text-sm italic">No preferences recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main content area */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="emails">Emails</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="emails">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Emails</h3>
          </div>

          <LeadSendEmail
            leadId={lead.id}
            leadName={lead.name}
            leadEmail={lead.email}
          />
        </TabsContent>

        <TabsContent value="notes">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Notes</h3>
            <Button asChild>
              <Link
                href={`/leads/${lead.id}/notes`}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Note
              </Link>
            </Button>
          </div>

          <NotesPreview leadId={lead.id} />
        </TabsContent>

        <TabsContent value="tasks">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Tasks</h3>
            <Button asChild>
              <Link
                href={`/leads/${lead.id}/tasks`}
                className="flex items-center gap-1"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Task
              </Link>
            </Button>
          </div>

          <TasksPreview leadId={lead.id} />
        </TabsContent>

        <TabsContent value="tags">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Tags</h3>
          </div>

          <LeadTagsManagement leadId={lead.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
