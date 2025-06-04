import { db } from "@/db";
import { whatsappMessages, carStock } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import type { RelevantCar } from "@/types/bot";

interface CarContextMessage {
  id: string;
  content: string;
  direction: "inbound" | "outbound";
  metadata: string | null;
  createdAt: Date;
  selectedCars?: string[];
}

type ConversationStage =
  | "discovery"
  | "presentation"
  | "consideration"
  | "negotiation"
  | "closing";

type RequestType =
  | "photos"
  | "price"
  | "details"
  | "availability"
  | "general"
  | null;

interface CarContextSummary {
  totalCarsShown: number;
  uniqueCarIds: string[];
  lastMentionedCars: RelevantCar[];
  conversationStage: ConversationStage;
  hasSeenPhotos: boolean;
  hasDiscussedPricing: boolean;
  hasShownInterest: boolean;
}

interface CarInformationRequest {
  requestType: RequestType;
  isUrgent: boolean;
  specificCar: boolean;
}

interface EnhancedCarContextInfo {
  stage?: string;
  userRequest?: string;
  botAction?: string;
}

interface ConversationSummary {
  carsShown: RelevantCar[];
  keyInteractions: string[];
  escalationReason: string;
  nextSteps: string[];
}

/**
 * Get car context from recent messages for a lead
 */
export async function getCarContextForLead(
  leadId: string,
  messageLimit: number = 15
): Promise<CarContextSummary> {
  try {
    // Get recent messages with metadata
    const recentMessages = (await db
      .select({
        id: whatsappMessages.id,
        content: whatsappMessages.content,
        direction: whatsappMessages.direction,
        metadata: whatsappMessages.metadata,
        createdAt: whatsappMessages.createdAt,
      })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.leadId, leadId))
      .orderBy(desc(whatsappMessages.createdAt))
      .limit(messageLimit)) as CarContextMessage[];

    // Extract car IDs from message metadata
    const allCarIds = new Set<string>();
    const carMentionHistory: { carIds: string[]; timestamp: Date }[] = [];

    for (const message of recentMessages) {
      if (message.metadata) {
        try {
          const metadata = JSON.parse(message.metadata);
          if (metadata.selectedCars && Array.isArray(metadata.selectedCars)) {
            metadata.selectedCars.forEach((carId: string) =>
              allCarIds.add(carId)
            );
            carMentionHistory.push({
              carIds: metadata.selectedCars,
              timestamp: message.createdAt,
            });
          }
        } catch {
          // Ignore metadata parsing errors
        }
      }
    }

    // Get the most recently mentioned cars (last 3 messages with car context)
    const recentCarMentions = carMentionHistory
      .slice(0, 3)
      .flatMap((mention) => mention.carIds);

    const uniqueRecentCarIds = [...new Set(recentCarMentions)];

    // Fetch actual car data for recently mentioned cars
    let lastMentionedCars: RelevantCar[] = [];
    if (uniqueRecentCarIds.length > 0) {
      lastMentionedCars = (await db
        .select({
          id: carStock.id,
          marca: carStock.marca,
          modelo: carStock.modelo,
          version: carStock.version,
          type: carStock.type,
          description: carStock.description,
          precio_venta: carStock.precio_venta,
          kilometros: carStock.kilometros,
          color: carStock.color,
          motor: carStock.motor,
          transmision: carStock.transmision,
          matricula: carStock.matricula,
          vendido: carStock.vendido,
          url: carStock.url,
          similarity: sql<number>`1`.as("similarity"),
        })
        .from(carStock)
        .where(sql`${carStock.id} = ANY(${uniqueRecentCarIds})`)
        .limit(5)) as RelevantCar[];
    }

    // Analyze conversation content for context
    const conversationText = recentMessages
      .map((m) => m.content.toLowerCase())
      .join(" ");

    const hasSeenPhotos = /foto|imagen|ver|enseñar|mandar|enviar.*foto/.test(
      conversationText
    );
    const hasDiscussedPricing = /precio|costar|vale|euro|financ|pagar/.test(
      conversationText
    );
    const hasShownInterest =
      /gusta|interesa|quiero|me parece|perfecto|genial/.test(conversationText);

    // Determine conversation stage
    let conversationStage: ConversationStage = "discovery";

    if (hasDiscussedPricing || /financ|pagar|cuanto/.test(conversationText)) {
      conversationStage = "negotiation";
    } else if (hasShownInterest && hasSeenPhotos) {
      conversationStage = "consideration";
    } else if (allCarIds.size > 0) {
      conversationStage = "presentation";
    }

    return {
      totalCarsShown: allCarIds.size,
      uniqueCarIds: [...allCarIds],
      lastMentionedCars,
      conversationStage,
      hasSeenPhotos,
      hasDiscussedPricing,
      hasShownInterest,
    };
  } catch (error) {
    console.error("Error getting car context for lead:", error);
    return {
      totalCarsShown: 0,
      uniqueCarIds: [],
      lastMentionedCars: [],
      conversationStage: "discovery",
      hasSeenPhotos: false,
      hasDiscussedPricing: false,
      hasShownInterest: false,
    };
  }
}

/**
 * Check if a message is asking about previously mentioned cars
 */
export function isAskingAboutPreviousCars(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  const referenceWords = [
    "ese",
    "esa",
    "este",
    "esta",
    "el anterior",
    "la anterior",
    "ese coche",
    "esa opción",
    "el que me enseñaste",
    "el de antes",
    "ese precio",
    "esas fotos",
    "el mismo",
    "la misma",
  ];

  const questionWords = [
    "foto",
    "imagen",
    "precio",
    "cuánto",
    "cuanto",
    "más info",
    "detalles",
    "kilómetros",
    "kilometros",
    "color",
    "año",
  ];

  const hasReference = referenceWords.some((word) =>
    lowerMessage.includes(word)
  );
  const hasQuestion = questionWords.some((word) => lowerMessage.includes(word));

  return hasReference || (hasQuestion && lowerMessage.length < 50); // Short questions likely about previous context
}

/**
 * Extract specific car information requests from message
 */
export function extractCarInformationRequest(
  message: string
): CarInformationRequest {
  const lowerMessage = message.toLowerCase();

  let requestType: RequestType = null;
  let isUrgent = false;
  let specificCar = false;

  // Check for photos
  if (/foto|imagen|ver|enseñar|mandar|enviar/.test(lowerMessage)) {
    requestType = "photos";
  }

  // Check for price
  if (/precio|costar|vale|cuanto|cuánto|euro/.test(lowerMessage)) {
    requestType = "price";
  }

  // Check for general details
  if (
    /detalle|información|info|especificacion|caracteristica/.test(lowerMessage)
  ) {
    requestType = "details";
  }

  // Check for availability
  if (/disponible|quedarse|apartar|reservar|libre/.test(lowerMessage)) {
    requestType = "availability";
  }

  // Check for urgency
  isUrgent = /urgente|rápido|rapido|ahora|hoy|ya/.test(lowerMessage);

  // Check if referring to specific car
  specificCar = /ese|este|el anterior|el que|ese coche/.test(lowerMessage);

  if (!requestType) {
    requestType = "general";
  }

  return { requestType, isUrgent, specificCar };
}

/**
 * Save enhanced car context to message metadata
 */
export async function saveEnhancedCarContext(
  messageId: string,
  carIds: string[],
  contextInfo: EnhancedCarContextInfo = {}
): Promise<void> {
  try {
    const metadata = {
      selectedCars: carIds,
      carCount: carIds.length,
      conversationStage: contextInfo.stage,
      userRequest: contextInfo.userRequest,
      botAction: contextInfo.botAction,
      timestamp: new Date().toISOString(),
      enhanced: true, // Flag to identify enhanced context
    };

    await db
      .update(whatsappMessages)
      .set({
        metadata: JSON.stringify(metadata),
      })
      .where(eq(whatsappMessages.whatsappMessageId, messageId));

    console.log(
      `💾 Enhanced car context saved for message ${messageId}: ${carIds.length} cars`
    );
  } catch (error) {
    console.error("Error saving enhanced car context:", error);
  }
}

/**
 * Get conversation summary for manager escalation
 */
export async function getConversationSummaryForManager(
  leadId: string
): Promise<ConversationSummary> {
  try {
    const context = await getCarContextForLead(leadId, 20);

    // Get recent messages to understand escalation context
    const recentMessages = await db
      .select({
        content: whatsappMessages.content,
        direction: whatsappMessages.direction,
        createdAt: whatsappMessages.createdAt,
      })
      .from(whatsappMessages)
      .where(eq(whatsappMessages.leadId, leadId))
      .orderBy(desc(whatsappMessages.createdAt))
      .limit(10);

    const conversationText = recentMessages
      .map((m) => m.content)
      .join(" ")
      .toLowerCase();

    // Determine escalation reason
    let escalationReason = "Lead escalated to manager for advanced assistance";

    if (/financ|credito|prestamo|cuotas/.test(conversationText)) {
      escalationReason = "Lead interested in financing options";
    } else if (/tasar|valorar|cambio|mi coche/.test(conversationText)) {
      escalationReason = "Lead wants to trade in their current vehicle";
    } else if (/precio|descuento|negociar/.test(conversationText)) {
      escalationReason = "Lead interested in price negotiation";
    } else if (/comprar|decidir|reservar/.test(conversationText)) {
      escalationReason = "Lead ready to make purchase decision";
    }

    // Generate key interactions
    const keyInteractions: string[] = [];

    if (context.totalCarsShown > 0) {
      keyInteractions.push(`Shown ${context.totalCarsShown} vehicles`);
    }

    if (context.hasSeenPhotos) {
      keyInteractions.push("Requested and received vehicle photos");
    }

    if (context.hasDiscussedPricing) {
      keyInteractions.push("Discussed pricing information");
    }

    if (context.hasShownInterest) {
      keyInteractions.push("Expressed interest in vehicles");
    }

    // Generate next steps
    const nextSteps: string[] = [];

    if (context.lastMentionedCars.length > 0) {
      nextSteps.push("Follow up on specific vehicles shown");
    }

    if (/financ/.test(conversationText)) {
      nextSteps.push("Discuss financing options and rates");
    }

    if (/tasar/.test(conversationText)) {
      nextSteps.push("Arrange vehicle trade-in valuation");
    }

    nextSteps.push("Schedule in-person visit or test drive");
    nextSteps.push("Provide detailed quote with final pricing");

    return {
      carsShown: context.lastMentionedCars,
      keyInteractions,
      escalationReason,
      nextSteps,
    };
  } catch (error) {
    console.error("Error getting conversation summary:", error);
    return {
      carsShown: [],
      keyInteractions: ["Error retrieving conversation history"],
      escalationReason: "Lead escalated to manager",
      nextSteps: ["Review conversation history and contact lead"],
    };
  }
}
