import { leadStatusEnum, leadTypeEnum, timeframeEnum } from "@/db/schema";

type Tag = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  createdAt: Date;
};

// Type for a lead with tags and campaign name
type LeadWithTagsAndCampaign = {
  id: string;
  // Lead basic info
  name: string;
  email: string | null;
  phone: string | null;
  type: (typeof leadTypeEnum.enumValues)[number] | null;
  // Lead status and purchase info
  status: (typeof leadStatusEnum.enumValues)[number];
  expectedPurchaseTimeframe: (typeof timeframeEnum.enumValues)[number] | null;
  budget: string | null;
  // Campaign info
  campaignName: string | null;
  // Lead communication tracking
  lastContactedAt: Date | null;
  lastMessageAt: Date | null;
  nextFollowUpDate: Date | null;
  // Created & Updated
  createdAt: Date | null;
  updatedAt: Date | null;
  // Tags
  tags: Tag[];
};

type LeadTasks = {
  id: string;
  leadId: string;
  status: "pendiente" | "progreso" | "completado" | "cancelado";
  priority: "baja" | "media" | "alta" | "urgente";
  title: string;
  description?: string | undefined;
  dueDate?: string | undefined;
};
type LeadTaskPriority = "baja" | "media" | "alta" | "urgente";
type LeadTaskStatus = "pendiente" | "progreso" | "completado" | "cancelado";

type ExtendedLeadTasks = {
  id: string;
  leadId: string;
  userId: string;
  title: string;
  description: string | null;
  priority: "baja" | "media" | "alta" | "urgente";
  status: "pendiente" | "progreso" | "completado" | "cancelado";
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type ExtendedLeadTasksString = {
  id: string;
  leadId: string;
  userId: string;
  title: string;
  description: string | null;
  priority: "baja" | "media" | "alta" | "urgente";
  status: "pendiente" | "progreso" | "completado" | "cancelado";
  dueDate: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type LeadNotes = {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type TagEntity = {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
  createdAt: Date;
};
