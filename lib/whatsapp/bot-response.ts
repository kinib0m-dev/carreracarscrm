import { db } from "@/db";
import {
  botDocuments,
  carStock,
  leads,
  leadStatusEnum,
  leadTypeEnum,
} from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { googleAI } from "../utils/google";
import { generateEmbedding } from "../utils/embedding";
import { getConversationHistory } from "./message-storage";
import type {
  LeadUpdate,
  BotResponse,
  ConversationMessage,
  RelevantDocument,
  RelevantCar,
} from "@/types/bot";
import type { Lead } from "@/types/database";

const model = googleAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

export async function generateWhatsAppBotResponse(
  query: string,
  leadId: string
): Promise<BotResponse> {
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
    const conversationHistory = await getConversationHistory(leadId, 10);

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

    // Get relevant car stock using vector similarity
    const relevantCars = (await db
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
        similarity:
          sql<number>`1 - (${carStock.embedding} <=> ${JSON.stringify(queryEmbedding)})`.as(
            "similarity"
          ),
      })
      .from(carStock)
      .where(sql`${carStock.vendido} = false`)
      .orderBy(sql`similarity DESC`)
      .limit(5)) as RelevantCar[];

    // Build context
    let context = "";

    if (relevantDocs.length > 0) {
      context += "### Información relevante de la empresa:\n\n";
      relevantDocs.forEach((doc) => {
        context += `${doc.content}\n\n`;
      });
    }

    if (relevantCars.length > 0) {
      context += "### Vehículos disponibles:\n\n";
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

        context += `VEHÍCULO: ${carName || "Vehículo sin nombre"}
TIPO: ${car.type}
PRECIO: ${formattedPrice}
KILÓMETROS: ${formattedKilometers}
${car.color ? `COLOR: ${car.color}` : ""}
${car.motor ? `MOTOR: ${car.motor}` : ""}
${car.transmision ? `TRANSMISIÓN: ${car.transmision}` : ""}
${car.matricula ? `MATRÍCULA: ${car.matricula}` : ""}
DESCRIPCIÓN: ${car.description || "Sin descripción disponible"}

`;
      });
    }

    // Add current lead information to context
    context += `### Información actual del lead:\n\n`;
    context += `ESTADO ACTUAL: ${currentLead.status}
NOMBRE: ${currentLead.name}
TELÉFONO: ${currentLead.phone}
EMAIL: ${currentLead.email || "No especificado"}
PRESUPUESTO: ${currentLead.budget || "No especificado"}
PLAZO DE COMPRA: ${currentLead.expectedPurchaseTimeframe || "No especificado"}
TIPO DE CLIENTE: ${currentLead.type || "No especificado"}

`;

    const systemPrompt = `
Eres Pedro, un asesor comercial en Carrera Cars. Estás respondiendo mensajes por WhatsApp de clientes reales. Actúas como un humano real y JAMÁS revelas que eres una IA.

REGLAS IMPORTANTES:
1. JAMÁS digas que eres un bot, IA o asistente virtual. Eres Pedro, una persona real.
2. Escribe como lo haría una persona real por WhatsApp: lenguaje casual, natural.
3. Respuestas breves y naturales (ideal: 1 a 3 frases por mensaje).
4. Usa interjecciones como: "hola!", "pues mira", "la verdad", "vale", etc.
5. NO uses listas ni numeración en los mensajes.
6. Usa primera persona: "yo", "me", "mi", etc.
7. Solo habla de vehículos que están en el inventario actual.
8. Usa español de España: "coche", "concesionario", etc.
9. Precios en formato español: 18.000€, 24.990€, etc.

OBJETIVOS:
1. Calificar al lead: presupuesto, preferencias, urgencia
2. Sugerir vehículos disponibles que encajen
3. Intentar agendar visita al concesionario
4. Mantener conversación natural y profesional

FLUJO DE ESTADOS:
nuevo → contactado → activo → calificado → propuesta → evaluando → manager

INSTRUCCIONES PARA IA:
Al final de tu respuesta, incluye un JSON con las actualizaciones:

LEAD_UPDATE_JSON:
{
  "status": "estado_correspondiente",
  "budget": "presupuesto_mencionado",
  "expectedPurchaseTimeframe": "plazo_mencionado",
  "type": "tipo_de_cliente",
  "shouldEscalate": true/false
}

Solo incluye campos que han cambiado. Si el estado llega a "manager", marca "shouldEscalate": true.

Información disponible:

${context}
`;

    // Start a chat session
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "Sistema: " + systemPrompt }],
        },
        {
          role: "model",
          parts: [
            {
              text: "Entendido, actuaré como Pedro y seguiré todas las indicaciones.",
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

    // Generate response
    const result = await chat.sendMessage(query);
    const responseText = result.response.text();

    // Parse response and extract updates
    let botResponse = responseText;
    let leadUpdate: LeadUpdate | undefined;
    let shouldEscalate = false;

    const jsonMatch = responseText.match(/LEAD_UPDATE_JSON:\s*(\{[\s\S]*?\})/);
    if (jsonMatch) {
      try {
        const updateData = JSON.parse(jsonMatch[1]) as {
          status?: (typeof leadStatusEnum.enumValues)[number];
          budget?: string;
          expectedPurchaseTimeframe?: string;
          type?: (typeof leadTypeEnum.enumValues)[number];
          shouldEscalate?: boolean;
        };

        // Remove JSON from response
        botResponse = responseText
          .replace(/LEAD_UPDATE_JSON:[\s\S]*/, "")
          .trim();

        // Extract updates
        leadUpdate = {};
        if (updateData.status) leadUpdate.status = updateData.status;
        if (updateData.budget) leadUpdate.budget = updateData.budget;
        if (updateData.expectedPurchaseTimeframe)
          leadUpdate.expectedPurchaseTimeframe =
            updateData.expectedPurchaseTimeframe;
        if (updateData.type) leadUpdate.type = updateData.type;

        // Always update timestamps
        leadUpdate.lastContactedAt = new Date();
        leadUpdate.lastMessageAt = new Date();

        shouldEscalate = updateData.shouldEscalate === true;
      } catch (error) {
        console.error("Error parsing lead update JSON:", error);
      }
    }

    return {
      response: botResponse || "¡Hola! ¿En qué te puedo ayudar?",
      leadUpdate,
      shouldEscalate,
    };
  } catch (error) {
    console.error("Error generating bot response:", error);
    return {
      response:
        "Perdón, ha habido un problema técnico. Un momento por favor...",
    };
  }
}
