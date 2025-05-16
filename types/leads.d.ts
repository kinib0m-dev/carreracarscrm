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
