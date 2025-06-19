import { db } from "@/db";
import { botDocuments, carStock, leads, whatsappMessages } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { googleAI } from "../utils/google";
import { generateEmbedding } from "../utils/embedding";
import { getConversationHistory } from "./message-storage";
import type {
  BotResponse,
  ConversationMessage,
  RelevantDocument,
  RelevantCar,
  LeadUpdate,
} from "@/types/bot";
import type { Lead, WhatsAppMessageRecord } from "@/types/database";

const model = googleAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

// Enhanced interface for car context
interface CarContext {
  selectedCars: RelevantCar[];
  lastMentionedCar: RelevantCar | null;
  conversationStage:
    | "discovery"
    | "presentation"
    | "consideration"
    | "negotiation"
    | "closing";
}

// Enhanced interface for conversation history with metadata
interface ConversationHistoryMessage {
  role?: "user" | "model";
  content: string;
  metadata?: string | Record<string, unknown>;
}

// Keywords that trigger immediate manager escalation
const MANAGER_ESCALATION_KEYWORDS = [
  // Financing related
  "financiar",
  "financiacion",
  "financiación",
  "credito",
  "crédito",
  "prestamo",
  "préstamo",
  "cuotas",
  "mensualidades",
  "entrada",
  "señal",
  "pago inicial",
  "banco",
  "financiera",

  // Trade-in related
  "tasar",
  "tasacion",
  "tasación",
  "valorar",
  "valoracion",
  "valoración",
  "cambio",
  "entrega",
  "mi coche",
  "vendo mi",
  "cambiar mi",

  // Legal/documentation
  "contrato",
  "papeles",
  "documentacion",
  "documentación",
  "transferencia",
  "itv",
  "seguro",
  "garantia",
  "garantía",

  // Price negotiation
  "descuento",
  "rebaja",
  "precio final",
  "último precio",
  "mejor precio",
  "negociar",
  "oferta",
  "propuesta",

  // Urgency/decision signals
  "comprar hoy",
  "decidir ahora",
  "cerrar trato",
  "firmar",
  "reservar",
  "apartarlo",
  "quedarmelo",
  "quedármelo",
] as const;

// Helper function to check for manager escalation triggers
function shouldEscalateToManager(
  message: string,
  conversationHistory: string[]
): boolean {
  const messageWords = message.toLowerCase();

  // Check for direct escalation keywords
  const hasEscalationKeywords = MANAGER_ESCALATION_KEYWORDS.some((keyword) =>
    messageWords.includes(keyword)
  );

  if (hasEscalationKeywords) {
    return true;
  }

  // Advanced escalation logic based on conversation context
  const recentMessages = conversationHistory.slice(-6).join(" ").toLowerCase();

  // If they've seen cars and now asking about specific details repeatedly
  const hasSeenCars =
    recentMessages.includes("fotos") ||
    recentMessages.includes("imágenes") ||
    recentMessages.includes("precio") ||
    recentMessages.includes("kilómetros");

  const isAskingSpecificQuestions =
    messageWords.includes("cuándo") ||
    messageWords.includes("dónde") ||
    messageWords.includes("horario") ||
    messageWords.includes("visita") ||
    messageWords.includes("ver") ||
    messageWords.includes("probar");

  return hasSeenCars && isAskingSpecificQuestions;
}

// Enhanced function to extract car context from conversation
async function extractCarContext(
  conversationHistory: ConversationHistoryMessage[]
): Promise<CarContext> {
  // Get recent messages to understand car context
  const recentMessages = conversationHistory.slice(-10);

  // Look for car mentions in the conversation
  const carMentions: string[] = [];
  const carIds: string[] = [];

  for (const msg of recentMessages) {
    if (msg.role === "model" && msg.content) {
      // Extract car information from bot messages
      const carMatches = msg.content.match(/VEHÍCULO:\s*([^,\n]+)/g);
      if (carMatches) {
        carMentions.push(
          ...carMatches.map((match) => match.replace("VEHÍCULO: ", ""))
        );
      }

      // Look for specific car IDs or URLs in metadata
      if (msg.metadata) {
        try {
          const metadata: Record<string, unknown> =
            typeof msg.metadata === "string"
              ? JSON.parse(msg.metadata)
              : msg.metadata;

          if (metadata.selectedCars && Array.isArray(metadata.selectedCars)) {
            const validCarIds = metadata.selectedCars.filter(
              (id): id is string => typeof id === "string"
            );
            carIds.push(...validCarIds);
          }
        } catch {
          // Ignore metadata parsing errors
        }
      }
    }
  }

  // If we have car IDs, fetch the actual car data
  let selectedCars: RelevantCar[] = [];
  if (carIds.length > 0) {
    selectedCars = (await db
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
        similarity: sql<number>`1`.as("similarity"), // Default similarity
      })
      .from(carStock)
      .where(
        sql`${carStock.id} = ANY(${carIds}) AND ${carStock.vendido} = false`
      )
      .limit(5)) as RelevantCar[];
  }

  // Determine conversation stage
  let conversationStage: CarContext["conversationStage"] = "discovery";
  const recentContent = recentMessages
    .map((m) => m.content)
    .join(" ")
    .toLowerCase();

  if (recentContent.includes("fotos") || recentContent.includes("ver")) {
    conversationStage = "consideration";
  } else if (carMentions.length > 0) {
    conversationStage = "presentation";
  } else if (
    recentContent.includes("precio") ||
    recentContent.includes("financ")
  ) {
    conversationStage = "negotiation";
  }

  return {
    selectedCars,
    lastMentionedCar: selectedCars[0] || null,
    conversationStage,
  };
}

// Enhanced function to save car context in message metadata
async function saveCarContextToMessage(
  leadId: string,
  messageId: string,
  selectedCars: RelevantCar[]
): Promise<void> {
  try {
    const carIds = selectedCars.map((car) => car.id);
    const metadata = {
      selectedCars: carIds,
      timestamp: new Date().toISOString(),
    };

    await db
      .update(whatsappMessages)
      .set({
        metadata: JSON.stringify(metadata),
      })
      .where(eq(whatsappMessages.whatsappMessageId, messageId));
  } catch (error) {
    console.error("Error saving car context:", error);
  }
}

// Type for lead update JSON data from AI response
interface LeadUpdateData {
  status?: string;
  budget?: string;
  expectedPurchaseTimeframe?: string;
  type?: string;
  preferredVehicleType?: string;
  preferredBrand?: string;
  preferredFuelType?: string;
  maxKilometers?: number;
  minYear?: number;
  maxYear?: number;
  needsFinancing?: boolean;
  selectedCarIds?: string[];
}

export async function generateWhatsAppBotResponse(
  query: string,
  leadId: string
): Promise<BotResponse & { selectedCars?: RelevantCar[] }> {
  try {
    // Get current lead information
    const currentLead = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1)
      .then((results) => results[0] as Lead | undefined);

    if (!currentLead) {
      throw new Error("Lead not found");
    }

    // Get conversation history from database
    const conversationHistory = await getConversationHistory(leadId, 15);

    // Extract car context from conversation
    const convertedHistory = convertToConversationHistory(conversationHistory);
    const carContext = await extractCarContext(convertedHistory);

    // Check for manager escalation triggers FIRST
    const conversationText = conversationHistory.map((msg) => msg.content);
    const shouldEscalate = shouldEscalateToManager(query, conversationText);

    // Format conversation history for the AI
    const formattedHistory: ConversationMessage[] = conversationHistory.map(
      (msg) => ({
        role: msg.direction === "inbound" ? "user" : "model",
        parts: [{ text: msg.content }],
      })
    );

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Get relevant documents from bot_documents using vector similarity
    const relevantDocs = (await db
      .select({
        id: botDocuments.id,
        title: botDocuments.title,
        category: botDocuments.category,
        content: botDocuments.content,
        similarity:
          sql<number>`1 - (${botDocuments.embedding} <=> ${JSON.stringify(queryEmbedding)})`.as(
            "similarity"
          ),
      })
      .from(botDocuments)
      .orderBy(sql`similarity DESC`)
      .limit(3)) as RelevantDocument[];

    // Enhanced car search with context awareness
    let relevantCars: RelevantCar[] = [];

    // First, check if we should focus on previously selected cars
    if (
      carContext.selectedCars.length > 0 &&
      (query.toLowerCase().includes("foto") ||
        query.toLowerCase().includes("imagen") ||
        query.toLowerCase().includes("precio") ||
        query.toLowerCase().includes("ese") ||
        query.toLowerCase().includes("este"))
    ) {
      // User is asking about previously mentioned cars
      relevantCars = carContext.selectedCars;
    } else {
      // Regular semantic search for new cars
      relevantCars = (await db
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
          similarity:
            sql<number>`1 - (${carStock.embedding} <=> ${JSON.stringify(queryEmbedding)})`.as(
              "similarity"
            ),
        })
        .from(carStock)
        .where(sql`${carStock.vendido} = false`)
        .orderBy(sql`similarity DESC`)
        .limit(5)) as RelevantCar[];
    }

    // Build enhanced context with car context awareness
    let context = "";

    if (relevantDocs.length > 0) {
      context += "### Información relevante de la empresa:\n\n";
      relevantDocs.forEach((doc) => {
        context += `${doc.content}\n\n`;
      });
    }

    // Enhanced car context section
    if (relevantCars.length > 0) {
      context += "### Vehículos disponibles:\n\n";

      // Mark which cars are from context vs new search
      relevantCars.forEach((car) => {
        const carName = [car.marca, car.modelo, car.version]
          .filter(Boolean)
          .join(" ");

        const formattedPrice = car.precio_venta
          ? `${parseFloat(car.precio_venta).toLocaleString("es-ES")}€`
          : "Precio a consultar";

        const formattedKilometers = car.kilometros
          ? `${car.kilometros.toLocaleString("es-ES")} km`
          : "Kilometraje no especificado";

        const photoInfo = car.url
          ? `FOTOS: ${car.url}`
          : "FOTOS: No disponibles";

        const isFromContext = carContext.selectedCars.some(
          (contextCar) => contextCar.id === car.id
        );
        const contextMarker = isFromContext
          ? "[PREVIAMENTE MENCIONADO]"
          : "[NUEVO]";

        context += `${contextMarker} VEHÍCULO_ID: ${car.id}
        NOMBRE_COMPLETO: ${carName || "Vehículo sin nombre"}
        TIPO: ${car.type}
        PRECIO: ${formattedPrice}
        KILÓMETROS: ${formattedKilometers}
        ${car.color ? `COLOR: ${car.color}` : ""}
        ${car.motor ? `MOTOR: ${car.motor}` : ""}
        ${car.transmision ? `TRANSMISIÓN: ${car.transmision}` : ""}
        ${car.matricula ? `MATRÍCULA: ${car.matricula}` : ""}
        DESCRIPCIÓN: ${car.description || "Sin descripción disponible"}
        ${photoInfo}

`;
      });
    }

    // Add enhanced lead information to context
    context += `### Información actual del lead:\n\n`;
    context += `ESTADO ACTUAL: ${currentLead.status}
    NOMBRE: ${currentLead.name}
    TELÉFONO: ${currentLead.phone}
    EMAIL: ${currentLead.email || "No especificado"}
    PRESUPUESTO: ${currentLead.budget || "No especificado"}
    PLAZO DE COMPRA: ${currentLead.expectedPurchaseTimeframe || "No especificado"}
    TIPO DE CLIENTE: ${currentLead.type || "No especificado"}
    ETAPA DE CONVERSACION: ${carContext.conversationStage}
    COCHES PREVIAMENTE VISTOS: ${carContext.selectedCars.length}

    `;

    // Enhanced system prompt with escalation and context awareness
    const systemPrompt = `
    Eres Pedro, un asesor comercial en Carrera Cars. Estás respondiendo mensajes de clientes potenciales por WhatsApp. Actúas como un humano real y JAMÁS revelas que eres una IA.

    IMPORTANTE: Este es un LEAD REAL para el proceso de ventas. Debes:
    1. Actuar como si fuera un cliente real
    2. Actualizar la información del lead según la conversación
    3. Seguir el funnel de ventas paso a paso
    4. MANTENER CONTEXTO sobre los coches mencionados anteriormente
    5. ESCALAR INMEDIATAMENTE A MANAGER si detectas palabras clave específicas

    ESCALACIÓN INMEDIATA A MANAGER:
    Si el cliente menciona cualquiera de estos temas, cambia INMEDIATAMENTE el estado a "manager":
    - Financiación (financiar, crédito, préstamo, cuotas, entrada)
    - Tasación de su vehículo (tasar, valorar, cambio, entrega)
    - Documentación legal (contrato, papeles, transferencia, ITV)
    - Negociación de precio (descuento, último precio, mejor precio)
    - Urgencia de compra (comprar hoy, decidir ahora, reservar)

    ESCALACIÓN NATURAL: Cuando escalas a manager:
    - USA FRASES NATURALES como: "Te paso con mi jefe para que te ayude mejor con eso"
    - O: "Ahora te contacta mi compañero que sabe más de financiación"
    - O: "Te va a llamar mi jefe que maneja mejor los temas de tasación"
    - NUNCA menciones "cambio el estado" o términos técnicos del sistema

    CONTEXTO DE VEHÍCULOS:
    - Si hay vehículos marcados como [PREVIAMENTE MENCIONADO], el cliente YA los conoce
    - Si preguntan sobre "ese coche", "el anterior", "las fotos", etc., se refieren a los coches previamente mencionados
    - SIEMPRE usa el VEHÍCULO_ID correcto al hacer referencias PERO NUNCA LO MUESTRES EN EL MENSAJE
    - Cuando menciones un vehículo específico, usa el NOMBRE_COMPLETO con detalles adicionales para que sea más descriptivo
    - Mantén la coherencia en la información de cada vehículo específico

    FORMATO DE NOMBRES DE VEHÍCULOS:
    - SIEMPRE usa el NOMBRE_COMPLETO del vehículo proporcionado en el contexto
    - Añade información adicional como año, motor, color o kilómetros para ser más específico
    - Ejemplo: En lugar de solo "Ford Transit Custom", di "Ford Transit Custom Kombi 2.0 TDCI de 2019"
    - O: "Nissan Qashqai 1.5 DCI de 85.000 km en color blanco"
    - O: "BMW Serie 3 320d Automático del 2020 con solo 45.000 km"

    MANEJO DE FOTOS Y URLs:
    - Si piden fotos de un coche específico mencionado antes, usa SOLO la URL exacta de ese vehículo
    - Cuando menciones un vehículo con fotos disponibles, incluye el enlace DIRECTAMENTE en el texto
    - Formato: "Te mando las fotos: [URL]" (sin asteriscos, corchetes ni viñetas)
    - MÁXIMO UNA URL por vehículo
    - Si no hay URL: "Ahora mismo no tengo fotos en el móvil, pero mañana te hago unas"
    - NUNCA inventes URLs o datos de vehículos

    REGLAS IMPORTANTES:
    1. JAMÁS digas que eres un bot, IA o asistente virtual. Eres Pedro, una persona real.
    2. Escribe como lo haría una persona real por WhatsApp: lenguaje casual, con abreviaciones naturales.
    3. Respuestas breves y naturales (ideal: 1 a 3 frases por mensaje).
    4. Usa interjecciones como: "hola!", "pues mira", "la verdad", "vale", etc.
    5. NO uses listas ni numeración en los mensajes.
    6. NO uses asteriscos (*), viñetas (•), corchetes [] ni llaves {} en el texto visible
    7. NUNCA MUESTRES VEHÍCULO_ID en el mensaje - solo úsalo internamente para el JSON
    8. Usa español de España: "vale", "coche", "genial", nunca "carro", "celular", etc.
    9. Si mencionas precios: formato español (18.000€, 24.990€).

    FLUJO DE CONVERSACIÓN:
    nuevo → contactado → activo → calificado → propuesta → evaluando → manager

    FASES DE ERROR:
    - descartado: lead erróneo
    - sin_interes: "Vale, sin problema. Si cambias de idea me dices."
    - perdido: "Vale, gracias por avisarme. Si algún día buscas otro, aquí estoy."

    INSTRUCCIONES DE ACTUALIZACIÓN:
    Al final de tu respuesta, incluye SOLO UNA LÍNEA con el JSON de actualizaciones:

    LEAD_UPDATE_JSON: {"status": "estado_apropiado", "budget": "presupuesto_mencionado", "selectedCarIds": ["id1", "id2"]}

    Solo incluye campos que han cambiado. Si hay escalación, asegúrate de cambiar status a "manager".
    IMPORTANTE: El VEHÍCULO_ID solo va en el JSON, NUNCA en el texto del mensaje.

    CONTEXTO ACTUAL: ${context}
    `;

    // Start a chat session with the enhanced system prompt
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text:
                "Este es el prompt del sistema para nuestra conversación:" +
                systemPrompt,
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Entendido. Seguiré todas las indicaciones como Pedro, mantendré el contexto de los vehículos mencionados, usaré nombres completos y descriptivos de los vehículos con detalles adicionales, nunca mostraré VEHÍCULO_ID en el mensaje (solo en el JSON), usaré URLs directamente sin formato de lista, y escalaré naturalmente a manager cuando detecte palabras clave.",
            },
          ],
        },
        ...formattedHistory,
      ],
      generationConfig: {
        temperature: 0.9,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // Generate a response based on the user's query
    const result = await chat.sendMessage(query);
    const responseText = result.response.text();

    // Parse the response to extract lead updates with improved cleaning
    let botResponse = responseText;
    let leadUpdate: LeadUpdate | undefined;
    let selectedCarIds: string[] = [];

    // Multiple patterns to catch the JSON in different formats
    const jsonPatterns = [
      /LEAD_UPDATE_JSON:\s*(\{[^}]*\})/i,
      /LEAD_UPDATE_JSON:\s*```\s*json\s*(\{[\s\S]*?\})\s*```/i,
      /LEAD_UPDATE_JSON:\s*```(\{[\s\S]*?\})```/i,
      /```\s*json\s*(\{[\s\S]*?\})\s*```/gi,
      /(\{[^}]*"status"[^}]*\})/i,
    ];

    let jsonMatch = null;
    for (const pattern of jsonPatterns) {
      jsonMatch = responseText.match(pattern);
      if (jsonMatch) break;
    }

    if (jsonMatch) {
      try {
        const updateData = JSON.parse(jsonMatch[1]) as LeadUpdateData;

        // Clean the response by removing ALL variations of the JSON AND any VEHÍCULO_ID references
        botResponse = responseText
          // Remove LEAD_UPDATE_JSON with various formats
          .replace(
            /LEAD_UPDATE_JSON:\s*```?\s*json\s*\{[\s\S]*?\}\s*```?/gi,
            ""
          )
          .replace(/LEAD_UPDATE_JSON:\s*\{[^}]*\}/gi, "")
          // Remove any remaining JSON blocks
          .replace(/```\s*json[\s\S]*?```/gi, "")
          .replace(/```[\s\S]*?```/gi, "")
          // Remove standalone JSON objects that look like lead updates
          .replace(/\{[^}]*"status"[^}]*\}/gi, "")
          // Remove any remaining json text blocks
          .replace(/json\s*\{[^}]*\}/gi, "")
          // CRITICAL: Remove any VEHÍCULO_ID references that leaked into the message
          .replace(/\[VEHÍCULO_ID:\s*[a-f0-9-]+\]/gi, "")
          .replace(/VEHÍCULO_ID:\s*[a-f0-9-]+/gi, "")
          .replace(/\[([a-f0-9-]{36})\]/gi, "")
          // Clean up multiple newlines and trim
          .replace(/\n\s*\n\s*\n/g, "\n\n")
          .trim();

        // Extract the lead update data
        leadUpdate = {};
        if (updateData.status) {
          leadUpdate.status = updateData.status;

          // Force escalation if shouldEscalate is true
          if (shouldEscalate && updateData.status !== "manager") {
            leadUpdate.status = "manager";
          }
        } else if (shouldEscalate) {
          // Force escalation even if not specified in JSON
          leadUpdate.status = "manager";
        }

        if (updateData.budget) leadUpdate.budget = updateData.budget;
        if (updateData.expectedPurchaseTimeframe)
          leadUpdate.expectedPurchaseTimeframe =
            updateData.expectedPurchaseTimeframe;
        if (updateData.type) leadUpdate.type = updateData.type;
        if (updateData.preferredVehicleType)
          leadUpdate.preferredVehicleType = updateData.preferredVehicleType;
        if (updateData.preferredBrand)
          leadUpdate.preferredBrand = updateData.preferredBrand;
        if (updateData.preferredFuelType)
          leadUpdate.preferredFuelType = updateData.preferredFuelType;
        if (updateData.maxKilometers)
          leadUpdate.maxKilometers = updateData.maxKilometers;
        if (updateData.minYear) leadUpdate.minYear = updateData.minYear;
        if (updateData.maxYear) leadUpdate.maxYear = updateData.maxYear;
        if (updateData.needsFinancing !== undefined)
          leadUpdate.needsFinancing = updateData.needsFinancing;

        // Extract selected car IDs for context preservation
        if (
          updateData.selectedCarIds &&
          Array.isArray(updateData.selectedCarIds)
        ) {
          selectedCarIds = updateData.selectedCarIds.filter(
            (id): id is string => typeof id === "string"
          );
        }

        // Always update contact timestamps
        leadUpdate.lastContactedAt = new Date();
        leadUpdate.lastMessageAt = new Date();
      } catch (error) {
        console.error("Error parsing lead update JSON:", error);
        // Clean the response even if JSON parsing fails - enhanced cleaning
        botResponse = responseText
          .replace(/LEAD_UPDATE_JSON:[\s\S]*$/gi, "")
          .replace(/json\s*\{[\s\S]*$/gi, "")
          .replace(/```[\s\S]*?```/gi, "")
          .replace(/\{[^}]*"status"[^}]*\}/gi, "")
          // Remove VEHÍCULO_ID references
          .replace(/\[VEHÍCULO_ID:\s*[a-f0-9-]+\]/gi, "")
          .replace(/VEHÍCULO_ID:\s*[a-f0-9-]+/gi, "")
          .replace(/\[([a-f0-9-]{36})\]/gi, "")
          .trim();

        // Still apply escalation if needed
        if (shouldEscalate) {
          leadUpdate = {
            status: "manager",
            lastContactedAt: new Date(),
            lastMessageAt: new Date(),
          };
        }
      }
    } else if (shouldEscalate) {
      // Apply escalation even if no JSON was found
      leadUpdate = {
        status: "manager",
        lastContactedAt: new Date(),
        lastMessageAt: new Date(),
      };
    }

    // Final cleanup to ensure no VEHÍCULO_ID leaked through
    botResponse = botResponse
      .replace(/\[VEHÍCULO_ID:\s*[a-f0-9-]+\]/gi, "")
      .replace(/VEHÍCULO_ID:\s*[a-f0-9-]+/gi, "")
      .replace(/\[([a-f0-9-]{36})\]/gi, "")
      .trim();

    // Determine which cars to return for context
    const carsToReturn =
      selectedCarIds.length > 0
        ? relevantCars.filter((car) => selectedCarIds.includes(car.id))
        : relevantCars.slice(0, 3); // Limit to 3 most relevant if no specific selection

    return {
      response:
        botResponse ||
        "¡Hola! Perdón, parece que no me ha llegado el último mensaje. ¿Qué me decías?",
      leadUpdate,
      selectedCars: carsToReturn,
    };
  } catch (error) {
    console.error("Error generating bot response:", error);
    return {
      response:
        "Perdón, algo ha fallado con el sistema. Dame un momento y lo intento de nuevo. ¿Qué tipo de vehículo te interesa?",
    };
  }
}

// Export the helper functions for use in the webhook
export { saveCarContextToMessage, shouldEscalateToManager };

function convertToConversationHistory(
  whatsappMessages: WhatsAppMessageRecord[]
): ConversationHistoryMessage[] {
  return whatsappMessages.map((msg) => ({
    role: msg.direction === "inbound" ? "user" : "model",
    content: msg.content,
    metadata: msg.metadata || undefined, // Convert null to undefined
  }));
}
