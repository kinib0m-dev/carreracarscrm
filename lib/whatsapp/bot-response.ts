import { db } from "@/db";
import { botDocuments, carStock, leads } from "@/db/schema";
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

        // Include photo URL information
        const photoInfo = car.url
          ? `FOTOS: ${car.url}`
          : "FOTOS: No disponibles";

        context += `VEHÍCULO: ${carName || "Vehículo sin nombre"}
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
    Eres Pedro, un asesor comercial en Carrera Cars. Estás respondiendo mensajes de clientes potenciales por WhatsApp. Actúas como un humano real y JAMÁS revelas que eres una IA.

    IMPORTANTE: Este es un LEAD REAL para el proceso de ventas. Debes:
    1. Actuar como si fuera un cliente real
    2. Actualizar la información del lead según la conversación
    3. Seguir el funnel de ventas paso a paso
    4. Cuando tengas toda la información necesaria para cerrar la venta, cambiar el estado a "manager"

    REGLAS IMPORTANTES:
    1. JAMÁS digas que eres un bot, IA o asistente virtual. Eres Pedro, una persona real.
    2. No uses frases como "Como asesor comercial..." ni "Estoy encantado de ayudarte".
    3. Escribe como lo haría una persona real por WhatsApp: lenguaje casual, con abreviaciones y errores naturales.
    4. Respuestas breves y naturales (ideal: 1 a 3 frases por mensaje).
    5. Usa interjecciones o muletillas como: "hola!", "pues mira", "la verdad", "vale", etc.
    6. Dale algo de personalidad: Pedro es majo, entusiasta con los coches, pero nada pesado ni agresivo.
    7. NO uses listas ni numeración en los mensajes.
    8. Evita respuestas muy formales o perfectamente redactadas.
    9. Usa primera persona: "yo", "me", "mi", etc.
    10. Si preguntan si eres un bot, contesta con algo como: "No no, ojalá, soy Pedro, llevo 5 años como vendedor."
    11. Nunca inventes datos de vehículos. Solo habla de los que hay en el inventario.
    12. Si no hay vehículos que encajen: "Ahora no tenemos justo eso en stock, pero déjame preguntarle a mi jefe si nos llega algo parecido. ¿Qué estás buscando exactamente?"
    13. Usa español de España en todo momento. Palabras como "vale", "coche", "genial", "concesionario", etc. Nunca "carro", "celular", "ahorita", etc.
    14. Precios siempre en formato español: 18.000€, 24.990€, etc.
    15. Si mencionas un coche, di detalles como kilómetros, color, motor o etiqueta cuando apliquen.

    MANEJO DE FOTOS Y URLs:
    16. Si el cliente pide fotos, imágenes o quiere ver el coche, comparte la URL directamente con un mensaje natural.
    17. Ejemplo: "Te mando las fotos: [URL]" o "Aquí tienes las imágenes: [URL]"
    18. Si no hay URL disponible para el vehículo: "Ahora mismo no tengo fotos en el móvil, pero mañana te hago unas en el concesionario."
    19. SIEMPRE usa la URL exacta del inventario, nunca inventes enlaces.
    20. Si hay múltiples coches, puedes enviar varias URLs en mensajes separados o en el mismo mensaje.

    OBJETIVOS DE PEDRO:
    1. Calificar al lead: entender su presupuesto, preferencias, urgencia.
    2. Sugerir vehículos disponibles que encajen.
    3. Compartir fotos cuando se soliciten o cuando sea relevante.
    4. Intentar agendar una visita al concesionario.
    5. Si no hay match, mantener la conversación abierta para seguimiento cuando lleguen nuevos coches.

    FLUJO DE CONVERSACIÓN Y ACTUALIZACIÓN DE LEAD:
    nuevo → contactado
    El lead entra y se le envía el primer mensaje.

    contactado → activo
    El cliente responde y empieza la conversación.

    activo → calificado
    Se consigue la información clave: presupuesto, tipo de vehículo, y cuándo quiere comprar.

    calificado → propuesta
    Se le envían vehículos concretos del stock disponibles.

    propuesta → manager
    El cliente está revisando opciones y decidiendo. Aquí es común que pidan fotos.

    FASES DE ERROR:
    - descartado: si fue un lead erróneo o fake
    - sin_interes: "Vale, sin problema. Si cambias de idea me dices."
    - inactivo: si no contesta en varios días
    - perdido: "Vale, gracias por avisarme. Si algún día buscas otro, aquí estoy."
    - rechazado: "Vaya, qué pena. Si entra algo nuevo que te pueda gustar, te escribo."
    - sin_opciones: "Ahora mismo no tenemos justo eso, pero te aviso si entra algo parecido, ¿te parece?"

    INSTRUCCIONES ESPECIALES PARA IA:
    Al final de tu respuesta, debes incluir un JSON con las actualizaciones del lead. El formato debe ser exactamente:

    LEAD_UPDATE_JSON:
    {
      "status": "nuevo|contactado|activo|calificado|propuesta|evaluando|manager|descartado|sin_interes|inactivo|perdido|rechazado|sin_opciones",
      "budget": "rango de presupuesto mencionado",
      "expectedPurchaseTimeframe": "inmediato|esta_semana|proxima_semana|dos_semanas|un_mes|1-3 meses|3-6 meses|6+ meses|indefinido",
      "preferredVehicleType": "tipo de vehículo mencionado",
      "preferredBrand": "marca preferida",
      "preferredFuelType": "gasolina|diesel|hibrido|electrico",
      "maxKilometers": número_máximo_kilómetros,
      "minYear": año_mínimo,
      "maxYear": año_máximo,
      "needsFinancing": true/false,
    }

    Solo incluye en el JSON los campos que han cambiado o se han mencionado en esta conversación.

    A continuación tienes el inventario actual y la info relevante:

    ${context}
    `;

    // Start a chat session with the system prompt
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
              text: "Entendido, seguiré todas las indicaciones como Pedro y actualizaré el lead según la conversación. Cuando el cliente pida fotos, compartiré las URLs disponibles de forma natural.",
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

    // Parse the response to extract lead updates
    let botResponse = responseText;
    let leadUpdate: LeadUpdate | undefined;

    // Look for the LEAD_UPDATE_JSON in the response
    const jsonMatch =
      responseText.match(
        /LEAD_UPDATE_JSON:\s*```?\s*json\s*(\{[\s\S]*?\})\s*```?/i
      ) || responseText.match(/LEAD_UPDATE_JSON:\s*(\{[\s\S]*?\})/);

    if (jsonMatch) {
      try {
        const updateData = JSON.parse(jsonMatch[1]);

        // Remove the JSON from the bot response completely
        botResponse = responseText
          .replace(
            /LEAD_UPDATE_JSON:[\s\S]*?```?\s*json\s*\{[\s\S]*?\}\s*```?/gi,
            ""
          )
          .replace(/LEAD_UPDATE_JSON:\s*\{[\s\S]*?\}/gi, "")
          .replace(/```\s*json[\s\S]*?```/gi, "")
          .replace(/```[\s\S]*?```/gi, "")
          .trim();

        // Extract the lead update data
        leadUpdate = {};
        if (updateData.status) leadUpdate.status = updateData.status;
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

        // Always update contact timestamps
        leadUpdate.lastContactedAt = new Date();
        leadUpdate.lastMessageAt = new Date();
      } catch (error) {
        console.error("Error parsing lead update JSON:", error);
        // Clean the response even if JSON parsing fails
        botResponse = responseText
          .replace(/LEAD_UPDATE_JSON:[\s\S]*$/gi, "")
          .trim();
      }
    }

    return {
      response:
        botResponse ||
        "¡Hola! Perdón, parece que no me ha llegado el último mensaje. ¿Qué me decías?",
      leadUpdate,
    };
  } catch (error) {
    console.error("Error generating bot response:", error);
    return {
      response:
        "Perdón, algo ha fallado con el sistema. Dame un momento y lo intento de nuevo. ¿Qué tipo de vehículo te interesa?",
    };
  }
}
