export interface LeadUpdate {
  status?: LeadStatus;
  budget?: string;
  expectedPurchaseTimeframe?: string;
  type?: LeadType;
  lastContactedAt?: Date;
  lastMessageAt?: Date;
  nextFollowUpDate?: Date;
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
