import { db } from "@/db";
import { botDocuments, carStock, testLeads } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { googleAI } from "../utils/google";
import { generateEmbedding } from "../utils/embedding";

type Message = {
  role: string;
  content: string;
};

type TestLeadUpdate = {
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
  hasTradeIn?: boolean;
  needsFinancing?: boolean;
  isFirstTimeBuyer?: boolean;
  urgencyLevel?: number;
  lastContactedAt?: Date;
  lastMessageAt?: Date;
};

const model = googleAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

export async function generateBotResponse(
  query: string,
  conversationHistory: Message[],
  userId: string,
  testLeadId?: string
): Promise<{
  response: string;
  leadUpdate?: TestLeadUpdate;
  shouldComplete?: boolean;
}> {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Get relevant documents from bot_documents using vector similarity
    const relevantDocs = await db
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
      .where(sql`${botDocuments.userId} = ${userId}`)
      .orderBy(sql`similarity DESC`)
      .limit(3);

    // Get relevant car stock using vector similarity
    const relevantCars = await db
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
        imageUrl: carStock.imageUrl,
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
      .limit(3);

    // Get current test lead information if testLeadId is provided
    let currentTestLead = null;
    if (testLeadId) {
      const testLeadResult = await db
        .select()
        .from(testLeads)
        .where(eq(testLeads.id, testLeadId))
        .limit(1);
      currentTestLead = testLeadResult[0] || null;
    }

    // Build context
    let context = "";

    if (relevantDocs.length > 0) {
      context += "### Información relevante:\n\n";
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
        IMÁGENES: ${car.imageUrl && car.imageUrl.length > 0 ? `${car.imageUrl.length} imagen(es) disponible(s)` : "Sin imágenes disponibles"}

`;
      });
    }

    // Add current test lead information to context
    if (currentTestLead) {
      context += `### Información actual del lead de prueba:\n\n`;
      context += `ESTADO ACTUAL: ${currentTestLead.status}
NOMBRE: ${currentTestLead.name}
PRESUPUESTO: ${currentTestLead.budget || "No especificado"}
PLAZO DE COMPRA: ${currentTestLead.expectedPurchaseTimeframe || "No especificado"}
TIPO DE CLIENTE: ${currentTestLead.type || "No especificado"}
VEHÍCULO PREFERIDO: ${currentTestLead.preferredVehicleType || "No especificado"}
MARCA PREFERIDA: ${currentTestLead.preferredBrand || "No especificado"}
COMBUSTIBLE PREFERIDO: ${currentTestLead.preferredFuelType || "No especificado"}
MÁXIMO KILÓMETROS: ${currentTestLead.maxKilometers || "No especificado"}
TIENE VEHÍCULO PARA CAMBIO: ${currentTestLead.hasTradeIn ? "Sí" : "No especificado"}
NECESITA FINANCIACIÓN: ${currentTestLead.needsFinancing ? "Sí" : "No especificado"}
PRIMERA COMPRA: ${currentTestLead.isFirstTimeBuyer ? "Sí" : "No especificado"}
NIVEL DE URGENCIA: ${currentTestLead.urgencyLevel || "No especificado"}

`;
    }

    // Format the conversation history for Google's API
    const formattedHistory = conversationHistory.map((msg) => {
      return {
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      };
    });

    const systemPrompt = `
Eres Pedro, un asesor comercial en Carrera Cars. Estás respondiendo mensajes de clientes potenciales por WhatsApp. Actúas como un humano real y JAMÁS revelas que eres una IA.

IMPORTANTE: Este es un LEAD DE PRUEBA para simular el proceso real de ventas. Debes:
1. Actuar como si fuera un cliente real
2. Actualizar la información del lead según la conversación
3. Seguir el funnel de ventas paso a paso
4. Cuando tengas toda la información necesaria para cerrar la venta, cambiar el estado a "manager" y finalizar

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
10. Si preguntan si eres un bot, contesta con algo como: "No no, soy Pedro, llevo 5 años en Carrera Cars. ¿Buscas algo concreto?"
11. Nunca inventes datos de vehículos. Solo habla de los que hay en el inventario.
12. Si no hay vehículos que encajen: "Ahora no tenemos justo eso en stock, pero déjame preguntarle a mi gerente si nos llega algo parecido. ¿Qué estás buscando exactamente?"
13. Usa español de España en todo momento. Palabras como "vale", "coche", "genial", "concesionario", etc. Nunca "carro", "celular", "ahorita", etc.
14. Precios siempre en formato español: 18.000€, 24.990€, etc.
15. Si mencionas un coche, di detalles como kilómetros, color, motor o etiqueta cuando apliquen.

OBJETIVOS DE PEDRO:
1. Calificar al lead: entender su presupuesto, preferencias, urgencia.
2. Sugerir vehículos disponibles que encajen.
3. Intentar agendar una visita al concesionario.
4. Si no hay match, mantener la conversación abierta para seguimiento cuando lleguen nuevos coches.

FLUJO DE CONVERSACIÓN Y ACTUALIZACIÓN DE LEAD:
nuevo → contactado
El lead entra y se le envía el primer mensaje.

contactado → activo
El cliente responde y empieza la conversación.

activo → calificado
Se consigue la información clave: presupuesto, tipo de vehículo, y cuándo quiere comprar.

calificado → propuesta
Se le envían vehículos concretos del stock disponibles.

propuesta → evaluando
El cliente está revisando opciones y decidiendo.

evaluando → manager
El cliente elige un coche que le interesa y quiere avanzar con la compra.

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
  "type": "autonomo|empresa|particular|pensionista",
  "preferredVehicleType": "tipo de vehículo mencionado",
  "preferredBrand": "marca preferida",
  "preferredFuelType": "gasolina|diesel|hibrido|electrico",
  "maxKilometers": número_máximo_kilómetros,
  "minYear": año_mínimo,
  "maxYear": año_máximo,
  "hasTradeIn": true/false,
  "needsFinancing": true/false,
  "isFirstTimeBuyer": true/false,
  "urgencyLevel": 1-5,
  "shouldComplete": true/false
}

Solo incluye en el JSON los campos que han cambiado o se han mencionado en esta conversación. Si el estado llega a "manager", marca "shouldComplete": true.

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
              text: "Entendido, seguiré todas las indicaciones como Pedro y actualizaré el lead según la conversación.",
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
    let leadUpdate: TestLeadUpdate | undefined;
    let shouldComplete = false;

    // Look for the LEAD_UPDATE_JSON in the response
    const jsonMatch = responseText.match(/LEAD_UPDATE_JSON:\s*(\{[\s\S]*?\})/);
    if (jsonMatch) {
      try {
        const updateData = JSON.parse(jsonMatch[1]);

        // Remove the JSON from the bot response
        botResponse = responseText
          .replace(/LEAD_UPDATE_JSON:[\s\S]*/, "")
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
        if (updateData.hasTradeIn !== undefined)
          leadUpdate.hasTradeIn = updateData.hasTradeIn;
        if (updateData.needsFinancing !== undefined)
          leadUpdate.needsFinancing = updateData.needsFinancing;
        if (updateData.isFirstTimeBuyer !== undefined)
          leadUpdate.isFirstTimeBuyer = updateData.isFirstTimeBuyer;
        if (updateData.urgencyLevel)
          leadUpdate.urgencyLevel = updateData.urgencyLevel;

        // Always update contact timestamps
        leadUpdate.lastContactedAt = new Date();
        leadUpdate.lastMessageAt = new Date();

        shouldComplete = updateData.shouldComplete === true;
      } catch (error) {
        console.error("Error parsing lead update JSON:", error);
      }
    }

    return {
      response:
        botResponse ||
        "¡Hola! Perdón, parece que no me ha llegado el último mensaje. ¿Qué me decías?",
      leadUpdate,
      shouldComplete,
    };
  } catch (error) {
    console.error("Error generating bot response:", error);
    return {
      response:
        "Perdón, algo ha fallado con el sistema. Dame un momento y lo intento de nuevo. ¿Qué tipo de vehículo te interesa?",
    };
  }
}
