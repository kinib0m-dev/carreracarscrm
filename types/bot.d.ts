export interface LeadUpdate {
  // Core lead fields
  status?: string;
  budget?: string;
  expectedPurchaseTimeframe?: string;
  type?: string;
  lastContactedAt?: Date;
  lastMessageAt?: Date;
  nextFollowUpDate?: Date;

  // Vehicle preferences
  preferredVehicleType?: string;
  preferredBrand?: string;
  preferredFuelType?: string;
  maxKilometers?: number;
  minYear?: number;
  maxYear?: number;
  needsFinancing?: boolean;

  // Additional preferences (optional for future expansion)
  preferredTransmission?: string;
  preferredColors?: string[];
  minBudget?: number;
  maxBudget?: number;
}

export interface BotResponse {
  response: string;
  leadUpdate?: LeadUpdate;
  shouldEscalate?: boolean;
}

export interface ConversationMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export interface RelevantDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
}

export interface RelevantCar {
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
  similarity: number;
}

// Enhanced lead preferences interface
export interface LeadPreferences {
  preferredVehicleType?: string;
  preferredBrand?: string;
  preferredFuelType?: string;
  maxKilometers?: number;
  minYear?: number;
  maxYear?: number;
  needsFinancing?: boolean;
  preferredTransmission?: string;
  preferredColors?: string[];
  minBudget?: number;
  maxBudget?: number;
}

// Vehicle matching criteria for recommendations
export interface VehicleMatchCriteria {
  vehicleType?: string;
  brand?: string;
  fuelType?: string;
  maxKilometers?: number;
  yearRange?: { min?: number; max?: number };
  budgetRange?: { min?: number; max?: number };
  transmission?: string;
  colors?: string[];
  needsFinancing?: boolean;
}
