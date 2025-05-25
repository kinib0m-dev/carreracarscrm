// Helper functions for labels
export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    nuevo: "Nuevo",
    contactado: "Contactado",
    activo: "Activo",
    calificado: "Calificado",
    propuesta: "Propuesta",
    evaluando: "Evaluando",
    manager: "Manager",
    iniciado: "Iniciado",
    documentacion: "Documentación",
    comprador: "Comprador",
    descartado: "Descartado",
    sin_interes: "Sin Interés",
    inactivo: "Inactivo",
    perdido: "Perdido",
    rechazado: "Rechazado",
    sin_opciones: "Sin Opciones",
  };
  return statusLabels[status] || status;
}

export function getCarTypeLabel(type: string): string {
  const typeLabels: Record<string, string> = {
    sedan: "Sedán",
    suv: "SUV",
    hatchback: "Hatchback",
    coupe: "Coupé",
    descapotable: "Descapotable",
    monovolumen: "Monovolumen",
    pickup: "Pick-up",
    electrico: "Eléctrico",
    hibrido: "Híbrido",
    lujo: "Lujo",
    deportivo: "Deportivo",
    furgoneta_carga: "Furgoneta Carga",
    furgoneta_pasajeros: "Furgoneta Pasajeros",
    furgoneta_mixta: "Furgoneta Mixta",
    otro: "Otro",
  };
  return typeLabels[type] || type;
}
