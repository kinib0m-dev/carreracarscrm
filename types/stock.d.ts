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
    | "furgoneta_carga"
    | "furgoneta_pasajeros"
    | "furgoneta_mixta"
    | "otro";
  description: string | null;
  imageUrl: string[] | null;
  url: string | null;
  notes: string | null;
  // Comerciante / procedencia
  comercial: string | null;
  sociedad: string | null;
  tienda: string | null;
  provincia: string | null;
  // Precios y financiación
  precio_compra: string | null; // Numeric as string
  precio_venta: string | null; // Numeric as string
  precio_financiado: string | null; // Numeric as string
  impuestos_incluidos: boolean | null;
  impuesto: string | null; // Numeric as string
  // Estado
  garantia: string | null;
  vendido: boolean | null;
  gastos_adicionales: string | null; // Numeric as string
  // Embeddings
  embedding: number[] | null;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
};
