import { CreateCarStockSchema } from "../validation/stock-schema";
import { carTypeEnum } from "@/db/schema";

// Valid car types
const VALID_CAR_TYPES = [
  "sedan",
  "suv",
  "hatchback",
  "coupe",
  "descapotable",
  "monovolumen",
  "pickup",
  "electrico",
  "hibrido",
  "lujo",
  "deportivo",
  "furgoneta_carga",
  "furgoneta_pasajeros",
  "furgoneta_mixta",
  "otro",
];

// Define a type for the possible field value types
type FieldValue = string | number | Date | boolean | string[] | undefined;

// Helper function to safely assign values to carData
export const assignCarDataValue = (
  carData: CreateCarStockSchema,
  field: string,
  value: FieldValue
): void => {
  if (value === undefined) return;

  switch (field) {
    // String fields
    case "vin":
      if (typeof value === "string") carData.vin = value;
      break;
    case "marca":
      if (typeof value === "string") carData.marca = value;
      break;
    case "modelo":
      if (typeof value === "string") carData.modelo = value;
      break;
    case "version":
      if (typeof value === "string") carData.version = value;
      break;
    case "motor":
      if (typeof value === "string") carData.motor = value;
      break;
    case "carroceria":
      if (typeof value === "string") carData.carroceria = value;
      break;
    case "transmision":
      if (typeof value === "string") carData.transmision = value;
      break;
    case "etiqueta":
      if (typeof value === "string") carData.etiqueta = value;
      break;
    case "color":
      if (typeof value === "string") carData.color = value;
      break;
    case "matricula":
      if (typeof value === "string") carData.matricula = value;
      break;
    case "description":
      if (typeof value === "string") carData.description = value;
      break;
    case "url":
      if (typeof value === "string") carData.url = value;
      break;
    case "notes":
      if (typeof value === "string") carData.notes = value;
      break;
    case "precio_compra":
      if (typeof value === "string") carData.precio_compra = value;
      break;
    case "precio_venta":
      if (typeof value === "string") carData.precio_venta = value;
      break;
    case "precio_financiado":
      if (typeof value === "string") carData.precio_financiado = value;
      break;
    case "impuesto":
      if (typeof value === "string") carData.impuesto = value;
      break;

    // Number fields
    case "puertas":
      if (typeof value === "number") carData.puertas = value;
      break;
    case "kilometros":
      if (typeof value === "number") carData.kilometros = value;
      break;

    // Date fields (as string for form handling)
    case "fecha_version":
      if (typeof value === "string") carData.fecha_version = value;
      break;

    // Enum fields
    case "type":
      if (typeof value === "string" && VALID_CAR_TYPES.includes(value)) {
        carData.type = value as (typeof carTypeEnum.enumValues)[number];
      }
      break;

    // Array fields
    case "imageUrl":
      if (Array.isArray(value)) carData.imageUrl = value;
      break;

    // Boolean fields
    case "impuestos_incluidos":
      if (typeof value === "boolean") carData.impuestos_incluidos = value;
      break;
    case "vendido":
      if (typeof value === "boolean") carData.vendido = value;
      break;

    default:
      // Handle any additional fields that might not be in the main schema
      console.warn(`Unknown field: ${field} with value:`, value);
      break;
  }
};
