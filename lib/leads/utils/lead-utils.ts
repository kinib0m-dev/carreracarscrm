import { LeadWithTagsAndCampaign } from "@/types/leads";

/**
 * Calculates days since last contact
 */
export function daysSinceLastContact(
  lead: LeadWithTagsAndCampaign
): number | null {
  if (!lead.lastContactedAt) return null;

  const lastContactDate = new Date(lead.lastContactedAt);
  const today = new Date();

  const diffTime = Math.abs(today.getTime() - lastContactDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates days until next follow-up
 */
export function daysUntilNextFollowUp(
  lead: LeadWithTagsAndCampaign
): number | null {
  if (!lead.nextFollowUpDate) return null;

  const followUpDate = new Date(lead.nextFollowUpDate);
  const today = new Date();

  const diffTime = Math.abs(followUpDate.getTime() - today.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determines the visual status indicator for a lead
 */
export function getLeadStatusIndicator(lead: LeadWithTagsAndCampaign) {
  // Fix: check lead status exists before proceeding
  if (!lead.status) {
    return { category: "desconocido", color: "gray" };
  }

  const statusCategories: Record<string, string[]> = {
    entrada: ["nuevo", "contactado"],
    conversacion: ["activo", "calificado", "propuesta", "evaluando"],
    gestion_humana: ["manager", "iniciado", "documentacion"],
    cerrado: ["comprador"],
    no_cualificado: ["descartado", "sin_interes", "rechazado", "sin_opciones"],
    inactivo: ["inactivo", "perdido"],
  };

  for (const [category, statuses] of Object.entries(statusCategories)) {
    if (statuses.includes(lead.status.toLowerCase())) {
      return { category, color: getCategoryColor(category) };
    }
  }

  return { category: "desconocido", color: "gray" };
}

/**
 * Gets the color for a timeframe category
 */
export function getTimeframeColor(
  timeframe: string | null | undefined
): string {
  if (!timeframe) return "gray";

  switch (timeframe) {
    case "inmediato":
      return "green";
    case "esta_semana":
      return "lime";
    case "proxima_semana":
      return "yellow";
    case "dos_semanas":
      return "amber";
    case "un_mes":
      return "orange";
    case "1-3 meses":
      return "pink";
    case "3-6 meses":
      return "rose";
    case "6+ meses":
      return "red";
    case "indefinido":
      return "gray";
    default:
      return "gray";
  }
}

/**
 * Gets the CSS class for a status badge based on the color
 */
export function getStatusBadgeClass(color: string): string {
  const baseClasses =
    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset";

  switch (color) {
    case "sky":
      return `${baseClasses} bg-sky-50 text-sky-700 ring-sky-600/20`;
    case "blue":
      return `${baseClasses} bg-blue-50 text-blue-700 ring-blue-600/20`;
    case "indigo":
      return `${baseClasses} bg-indigo-50 text-indigo-700 ring-indigo-600/20`;
    case "green":
      return `${baseClasses} bg-green-50 text-green-700 ring-green-600/20`;
    case "amber":
      return `${baseClasses} bg-amber-50 text-amber-700 ring-amber-600/20`;
    case "red":
      return `${baseClasses} bg-red-50 text-red-700 ring-red-600/20`;
    case "rose":
      return `${baseClasses} bg-rose-50 text-rose-700 ring-rose-600/20`;
    case "pink":
      return `${baseClasses} bg-pink-50 text-pink-700 ring-pink-600/20`;
    case "orange":
      return `${baseClasses} bg-orange-50 text-orange-700 ring-orange-600/20`;
    case "yellow":
      return `${baseClasses} bg-yellow-50 text-yellow-700 ring-yellow-600/20`;
    case "lime":
      return `${baseClasses} bg-lime-50 text-lime-700 ring-lime-600/20`;
    case "gray":
    default:
      return `${baseClasses} bg-gray-50 text-gray-700 ring-gray-600/20`;
  }
}

function getCategoryColor(category: string): string {
  switch (category) {
    case "entrada":
      return "sky";
    case "conversacion":
      return "blue";
    case "gestion_humana":
      return "indigo";
    case "cerrado":
      return "green";
    case "no_cualificado":
      return "gray";
    case "inactivo":
      return "amber";
    default:
      return "gray";
  }
}

/**
 * Format a date string or Date object to a readable format
 */
export function formatDate(date: string | Date | null): string {
  if (!date) return "N/A";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dateObj);
}

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined) return "N/A";

  // Convert string to number if needed
  const numericAmount = typeof amount === "string" ? Number(amount) : amount;

  // Check if conversion resulted in a valid number
  if (isNaN(numericAmount)) return "N/A";

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

// Function to format timeframe text for display
export const formatTimeframe = (timeframe: string | null | undefined) => {
  if (!timeframe) return "No definido";

  switch (timeframe) {
    case "inmediato":
      return "Inmediato";
    case "esta_semana":
      return "Esta semana";
    case "proxima_semana":
      return "Próxima semana";
    case "dos_semanas":
      return "En dos semanas";
    case "un_mes":
      return "En un mes";
    case "1-3 meses":
      return "1-3 meses";
    case "3-6 meses":
      return "3-6 meses";
    case "6+ meses":
      return "Más de 6 meses";
    case "indefinido":
      return "Indefinido";
    default:
      return timeframe
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
};
