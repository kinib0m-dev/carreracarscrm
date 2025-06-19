export const FOLLOW_UP_CONFIG = {
  // Message delay before sending (in milliseconds)
  MESSAGE_DELAY: 15 * 1000, // 15 seconds (10 + Math.random() * 5) * 60 * 1000

  // Follow-up thresholds (in milliseconds)
  FOLLOW_UP_THRESHOLD: 23 * 60 * 60 * 1000, // 23 hours

  // Maximum number of follow-ups before marking as inactive
  MAX_FOLLOW_UPS: 3,

  // Status-specific follow-up messages
  FOLLOW_UP_MESSAGES: {
    nuevo: [
      "¡Hola! Te escribo para saber si sigues buscando coche. ¿Hay algo en particular que te interese?",
      "Buenas, vi que te registraste hace poco. ¿Hay algo en lo que te pueda ayudar para empezar?",
      "Hola, solo quería confirmar si estás buscando vehículo. Estoy aquí para ayudarte si lo necesitas.",
    ],
    contactado: [
      "¿Qué tal? Solo quería saber si has podido pensar en lo que comentamos.",
      "¡Hola! Por si acaso no viste el mensaje anterior, sigo aquí para ayudarte a encontrar el coche ideal.",
      "Buenas, si sigues buscando coche, puedo mandarte algunas opciones nuevas que te podrían interesar.",
    ],
    activo: [
      "¿Cómo vas con la búsqueda? Si necesitas ayuda para decidir, dime y lo vemos juntos.",
      "¡Hola! ¿Te gustaría que te mande más opciones según lo que hablamos?",
      "Buenas, quería saber si sigues con interés en cambiar de coche o si ya encontraste algo.",
    ],
    calificado: [
      "¿Qué opinas de los modelos que te mandé? ¿Hay alguno que te haya gustado?",
      "¡Hola! Si tienes dudas sobre alguno de los coches, dime y te lo explico mejor.",
      "Buenas, ¿necesitas más detalles o fotos de alguno de los vehículos que vimos?",
    ],
    propuesta: [
      "¿Pudiste revisar la propuesta? Si hay algo que quieras ajustar, lo vemos.",
      "¡Hola! ¿Qué te parecieron las opciones que te envié? ¿Alguna te llamó la atención?",
      "Buenas, si quieres ver más alternativas o necesitas algo diferente, dime y te ayudo.",
    ],
    evaluando: [
      "¿Cómo vas con la decisión? Si necesitas un consejo, estoy aquí para ayudarte.",
      "¡Hola! Si lo prefieres, puedo agendar una visita o videollamada para que veas los coches mejor.",
      "Buenas, dime si hay algo que te ayude a decidir o si te paso más opciones.",
    ],
  } as Record<string, string[]>,

  // Statuses that should receive follow-ups
  ACTIVE_STATUSES: [
    "nuevo",
    "contactado",
    "activo",
    "calificado",
    "propuesta",
    "evaluando",
  ],

  // Statuses that should not receive follow-ups
  INACTIVE_STATUSES: [
    "manager",
    "iniciado",
    "documentacion",
    "comprador",
    "descartado",
    "sin_interes",
    "inactivo",
    "perdido",
    "rechazado",
    "sin_opciones",
  ],
};

export const getFollowUpMessage = (
  status: string,
  followUpCount: number
): string => {
  const messages = FOLLOW_UP_CONFIG.FOLLOW_UP_MESSAGES[status];
  if (!messages || messages.length === 0) {
    return "¡Hola! ¿Sigues interesado en encontrar un vehículo?";
  }

  // Use the follow-up count to pick different messages, cycling if needed
  const messageIndex = Math.min(followUpCount, messages.length - 1);
  return messages[messageIndex];
};
