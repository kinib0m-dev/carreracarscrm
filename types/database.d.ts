import { leadTypeEnum, timeframeEnum, leadStatusEnum } from "@/db/schema";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  status: (typeof leadStatusEnum.enumValues)[number];
  budget?: string | null;
  expectedPurchaseTimeframe?: (typeof timeframeEnum.enumValues)[number];
  type?: (typeof leadTypeEnum.enumValues)[number];
  lastContactedAt?: Date | null;
  lastMessageAt?: Date | null;
  nextFollowUpDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Type for database updates - matches what Drizzle expects
export interface LeadUpdateData {
  name?: string;
  phone?: string;
  email?: string | null;
  status?: (typeof leadStatusEnum.enumValues)[number];
  budget?: string | null;
  expectedPurchaseTimeframe?: (typeof timeframeEnum.enumValues)[number];
  type?: (typeof leadTypeEnum.enumValues)[number];

  // Vehicle preferences
  preferredVehicleType?: string | null;
  preferredBrand?: string | null;
  preferredFuelType?: string | null;
  maxKilometers?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  needsFinancing?: boolean | null;

  lastContactedAt?: Date | null;
  lastMessageAt?: Date | null;
  nextFollowUpDate?: Date | null;
  updatedAt?: Date;
}

export interface BotDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  embedding: number[];
}

export interface CarStock {
  id: string;
  marca: string;
  modelo: string;
  version?: string | null;
  type: string;
  description?: string | null;
  precio_venta?: string | null;
  kilometros?: number | null;
  color?: string | null;
  motor?: string | null;
  transmision?: string | null;
  matricula?: string | null;
  vendido: boolean;
  embedding: number[];
}

export interface WhatsAppMessageRecord {
  id: string;
  leadId: string;
  whatsappMessageId?: string | null;
  direction: "inbound" | "outbound";
  content: string;
  phoneNumber: string;
  whatsappTimestamp: Date;
  status: string;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookLog {
  id: string;
  eventType: string;
  payload: string;
  status: string;
  createdAt: Date;
}

// Lead preferences if using separate table
export interface LeadPreferencesRecord {
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
  minBudget?: number | null;
  maxBudget?: number | null;
  createdAt: Date;
  updatedAt: Date;
}
