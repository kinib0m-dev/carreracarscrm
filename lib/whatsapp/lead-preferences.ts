import { db } from "@/db";
import { leadPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { LeadUpdate } from "@/types/bot";

interface LeadPreferencesData {
  preferredVehicleType?: string | null;
  preferredBrand?: string | null;
  preferredFuelType?: string | null;
  maxKilometers?: number | null;
  minYear?: number | null;
  maxYear?: number | null;
  needsFinancing?: boolean | null;
  preferredTransmission?: string | null;
  preferredColors?: string[] | null;
  minBudget?: string | null;
  maxBudget?: string | null;
}

/**
 * Updates lead preferences from bot response
 */
export async function updateLeadPreferences(
  leadId: string,
  leadUpdate: LeadUpdate
): Promise<void> {
  try {
    // Extract preference fields from lead update
    const preferencesData: Partial<LeadPreferencesData> = {};

    if (leadUpdate.preferredVehicleType)
      preferencesData.preferredVehicleType = leadUpdate.preferredVehicleType;
    if (leadUpdate.preferredBrand)
      preferencesData.preferredBrand = leadUpdate.preferredBrand;
    if (leadUpdate.preferredFuelType)
      preferencesData.preferredFuelType = leadUpdate.preferredFuelType;
    if (leadUpdate.maxKilometers)
      preferencesData.maxKilometers = leadUpdate.maxKilometers;
    if (leadUpdate.minYear) preferencesData.minYear = leadUpdate.minYear;
    if (leadUpdate.maxYear) preferencesData.maxYear = leadUpdate.maxYear;
    if (leadUpdate.needsFinancing !== undefined)
      preferencesData.needsFinancing = leadUpdate.needsFinancing;

    // Handle budget conversion from LeadUpdate to preferences
    if (leadUpdate.minBudget)
      preferencesData.minBudget = leadUpdate.minBudget.toString();
    if (leadUpdate.maxBudget)
      preferencesData.maxBudget = leadUpdate.maxBudget.toString();

    // Only proceed if we have preferences to update
    if (Object.keys(preferencesData).length === 0) {
      return;
    }

    console.log(`Updating preferences for lead ${leadId}:`, preferencesData);

    // Check if preferences record exists
    const existingPreferences = await db
      .select()
      .from(leadPreferences)
      .where(eq(leadPreferences.leadId, leadId))
      .limit(1);

    if (existingPreferences.length > 0) {
      // Update existing preferences
      await db
        .update(leadPreferences)
        .set({
          ...preferencesData,
          updatedAt: new Date(),
        })
        .where(eq(leadPreferences.leadId, leadId));

      console.log(`✅ Updated existing preferences for lead ${leadId}`);
    } else {
      // Create new preferences record
      await db.insert(leadPreferences).values({
        leadId,
        ...preferencesData,
      });

      console.log(`✅ Created new preferences for lead ${leadId}`);
    }
  } catch (error) {
    console.error(`Error updating preferences for lead ${leadId}:`, error);
    // Don't throw error to avoid breaking the main flow
  }
}

/**
 * Gets lead preferences for a specific lead
 */
export async function getLeadPreferences(
  leadId: string
): Promise<LeadPreferencesData | null> {
  try {
    const preferences = await db
      .select()
      .from(leadPreferences)
      .where(eq(leadPreferences.leadId, leadId))
      .limit(1);

    if (preferences.length === 0) {
      return null;
    }

    // Return the first (and should be only) preferences record
    const pref = preferences[0];
    return {
      preferredVehicleType: pref.preferredVehicleType,
      preferredBrand: pref.preferredBrand,
      preferredFuelType: pref.preferredFuelType,
      maxKilometers: pref.maxKilometers,
      minYear: pref.minYear,
      maxYear: pref.maxYear,
      needsFinancing: pref.needsFinancing,
      preferredTransmission: pref.preferredTransmission,
      preferredColors: pref.preferredColors,
      minBudget: pref.minBudget,
      maxBudget: pref.maxBudget,
    };
  } catch (error) {
    console.error(`Error getting preferences for lead ${leadId}:`, error);
    return null;
  }
}

/**
 * Analyzes preferences and suggests matching vehicles
 */
export async function getMatchingVehicleRecommendations(
  leadId: string
): Promise<string> {
  try {
    const preferences = await getLeadPreferences(leadId);

    if (!preferences) {
      return "No se han establecido preferencias específicas aún.";
    }

    let recommendations = "Basándome en tus preferencias:\n";

    if (preferences.preferredVehicleType) {
      recommendations += `- Tipo de vehículo: ${preferences.preferredVehicleType}\n`;
    }
    if (preferences.preferredBrand) {
      recommendations += `- Marca preferida: ${preferences.preferredBrand}\n`;
    }
    if (preferences.preferredFuelType) {
      recommendations += `- Combustible: ${preferences.preferredFuelType}\n`;
    }
    if (preferences.maxKilometers) {
      recommendations += `- Máximo kilometraje: ${preferences.maxKilometers.toLocaleString()} km\n`;
    }
    if (preferences.minYear || preferences.maxYear) {
      const yearRange = `${preferences.minYear || "cualquier"} - ${preferences.maxYear || "actual"}`;
      recommendations += `- Años: ${yearRange}\n`;
    }
    if (preferences.minBudget || preferences.maxBudget) {
      const budgetRange = `${preferences.minBudget ? `${parseFloat(preferences.minBudget).toLocaleString()}€` : "sin mínimo"} - ${preferences.maxBudget ? `${parseFloat(preferences.maxBudget).toLocaleString()}€` : "sin máximo"}`;
      recommendations += `- Presupuesto: ${budgetRange}\n`;
    }
    if (
      preferences.needsFinancing !== null &&
      preferences.needsFinancing !== undefined
    ) {
      recommendations += `- Financiación: ${preferences.needsFinancing ? "Sí necesita" : "No necesita"}\n`;
    }
    if (preferences.preferredTransmission) {
      recommendations += `- Transmisión: ${preferences.preferredTransmission}\n`;
    }
    if (preferences.preferredColors && preferences.preferredColors.length > 0) {
      recommendations += `- Colores preferidos: ${preferences.preferredColors.join(", ")}\n`;
    }

    return recommendations;
  } catch (error) {
    console.error(
      `Error generating recommendations for lead ${leadId}:`,
      error
    );
    return "Error al generar recomendaciones.";
  }
}

/**
 * Parses budget string and extracts min/max values
 */
export function parseBudgetRange(budgetString: string): {
  min?: number;
  max?: number;
} {
  try {
    // Remove currency symbols and normalize
    const cleanBudget = budgetString
      .toLowerCase()
      .replace(/[€$,\.]/g, "")
      .replace(/k/g, "000")
      .trim();

    // Common budget patterns
    const patterns = [
      /(\d+)\s*-\s*(\d+)/, // "10000-15000"
      /entre\s*(\d+)\s*y\s*(\d+)/i, // "entre 10000 y 15000"
      /hasta\s*(\d+)/i, // "hasta 15000"
      /máximo\s*(\d+)/i, // "máximo 15000"
      /menos\s*de\s*(\d+)/i, // "menos de 15000"
      /alrededor\s*de\s*(\d+)/i, // "alrededor de 12000"
      /unos?\s*(\d+)/i, // "unos 12000"
      /(\d+)/, // Just a number
    ];

    for (const pattern of patterns) {
      const match = cleanBudget.match(pattern);
      if (match) {
        if (match[2]) {
          // Range found
          return {
            min: parseInt(match[1]),
            max: parseInt(match[2]),
          };
        } else {
          const value = parseInt(match[1]);
          if (
            budgetString.toLowerCase().includes("hasta") ||
            budgetString.toLowerCase().includes("máximo") ||
            budgetString.toLowerCase().includes("menos")
          ) {
            return { max: value };
          } else if (
            budgetString.toLowerCase().includes("alrededor") ||
            budgetString.toLowerCase().includes("unos")
          ) {
            return { min: value * 0.8, max: value * 1.2 };
          } else {
            return { max: value }; // Default to max if just a number
          }
        }
      }
    }

    return {};
  } catch (error) {
    console.error("Error parsing budget range:", error);
    return {};
  }
}

/**
 * Updates lead preferences with parsed budget information
 */
export async function updateLeadBudgetPreferences(
  leadId: string,
  budgetString: string
): Promise<void> {
  try {
    const budgetRange = parseBudgetRange(budgetString);

    if (budgetRange.min || budgetRange.max) {
      const updateData: Partial<LeadPreferencesData> = {};

      if (budgetRange.min) updateData.minBudget = budgetRange.min.toString();
      if (budgetRange.max) updateData.maxBudget = budgetRange.max.toString();

      // Check if preferences exist
      const existingPreferences = await db
        .select()
        .from(leadPreferences)
        .where(eq(leadPreferences.leadId, leadId))
        .limit(1);

      if (existingPreferences.length > 0) {
        await db
          .update(leadPreferences)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(leadPreferences.leadId, leadId));
      } else {
        await db.insert(leadPreferences).values({
          leadId,
          ...updateData,
        });
      }

      console.log(
        `✅ Updated budget preferences for lead ${leadId}:`,
        budgetRange
      );
    }
  } catch (error) {
    console.error(
      `Error updating budget preferences for lead ${leadId}:`,
      error
    );
  }
}
