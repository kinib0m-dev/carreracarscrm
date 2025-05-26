type StockItemType = {
  id: string;
  // Identificación
  vin: string | null;
  // Información básica
  marca: string | null;
  modelo: string | null;
  version: string | null;
  motor: string | null;
  carroceria: string | null;
  puertas: number | null;
  transmision: string | null;
  etiqueta: string | null;
  fecha_version: string | null; // Date as string
  color: string | null;
  kilometros: number | null;
  matricula: string | null;
  // Type and description (from original schema)
  type:
    | "sedan"
    | "suv"
    | "hatchback"
    | "coupe"
    | "descapotable"
    | "monovolumen"
    | "pickup"
    | "electrico"
    | "hibrido"
    | "lujo"
    | "deportivo"
    | "furgoneta_pequena"
    | "furgoneta_mediana"
    | "furgoneta_grande"
    | "otro";
  description: string | null;
  imageUrl: string[] | null;
  url: string | null;
  notes: string | null;
  // Precios y financiación
  precio_compra: string | null; // Numeric as string
  precio_venta: string | null; // Numeric as string
  precio_financiado: string | null; // Numeric as string
  impuestos_incluidos: boolean | null;
  impuesto: string | null; // Numeric as string
  // Estado
  vendido: boolean | null;
  // Embeddings
  embedding: number[] | null;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
};
