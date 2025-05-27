export const FOLLOW_UP_CONFIG = {
  // Message delay before sending (in milliseconds)
  MESSAGE_DELAY: 15 * 1000, // 15 seconds

  // Follow-up thresholds (in milliseconds)
  FOLLOW_UP_THRESHOLD: 1 * 60 * 1000, // 1 minute for testing

  // Maximum number of follow-ups before marking as inactive
  MAX_FOLLOW_UPS: 3,

  // Status-specific follow-up messages
  FOLLOW_UP_MESSAGES: {
    nuevo: [
      "¡Hola! ¿Has podido ver mi mensaje anterior? ¿Te interesa algún vehículo?",
      "Buenas, solo quería saber si sigues buscando coche. ¿En qué te puedo ayudar?",
      "Hola de nuevo. Si ya no estás interesado, no pasa nada, solo dímelo.",
    ],
    contactado: [
      "¿Qué tal? ¿Has tenido tiempo de pensar en lo que hablamos?",
      "¡Hola! ¿Sigues buscando vehículo? Tengo algunas opciones nuevas.",
      "Buenas, por si acaso no te llegó mi mensaje anterior... ¿sigues interesado?",
    ],
    activo: [
      "¿Cómo va todo? ¿Has podido pensar en el presupuesto que comentamos?",
      "¡Hola! ¿Sigues buscando? Me gustaría ayudarte a encontrar algo que te guste.",
      "Buenas, solo para saber si sigues interesado o si ya has encontrado algo.",
    ],
    calificado: [
      "¿Qué tal? ¿Te gustaron las opciones que te enseñé?",
      "¡Hola! ¿Has podido ver los coches que te comenté? ¿Te interesa alguno?",
      "Buenas, solo quería saber si necesitas más información sobre algún vehículo.",
    ],
    propuesta: [
      "¿Has podido ver las fotos que te mandé? ¿Qué te parece?",
      "¡Hola! ¿Te ha gustado alguno de los coches que vimos?",
      "Buenas, ¿necesitas que te pase más información de algún vehículo?",
    ],
    evaluando: [
      "¿Cómo lo llevas? ¿Has decidido algo sobre los coches que vimos?",
      "¡Hola! ¿Necesitas que te aclare algo más sobre algún vehículo?",
      "Buenas, por si te sirve de ayuda, puedo organizarte una visita para verlos en persona.",
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
