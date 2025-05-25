import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  boolean,
  pgEnum,
  customType,
  date,
  numeric,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ------------------------------------ AUTH ------------------------------------
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  isTwoFactorEnabled: boolean("is_two_factor_enabled").default(false),

  // Account lockout fields
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lastFailedLoginAttempt: timestamp("last_failed_login_attempt", {
    mode: "date",
  }),
  lockedUntil: timestamp("locked_until", { mode: "date" }),

  // Session revocation field
  securityVersion: integer("security_version").default(1),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    {
      compoundKey: primaryKey({
        columns: [account.provider, account.providerAccountId],
      }),
    },
  ]
);

export const verificationTokens = pgTable(
  "verification_token",
  {
    id: uuid("id").notNull().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    {
      compositePk: primaryKey({
        columns: [verificationToken.id, verificationToken.token],
      }),
    },
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").notNull().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (passwordResetTokens) => [
    {
      compositePk: primaryKey({
        columns: [passwordResetTokens.id, passwordResetTokens.token],
      }),
    },
  ]
);

export const twoFactorTokens = pgTable(
  "two_factor_tokens",
  {
    id: uuid("id").notNull().defaultRandom(),
    email: text("email").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (twoFactorTokens) => [
    {
      compositePk: primaryKey({
        columns: [twoFactorTokens.id, twoFactorTokens.token],
      }),
    },
  ]
);

export const twoFactorConfirmation = pgTable(
  "two_factor_confirmation",
  {
    id: uuid("id").notNull().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (twoFactorConfirmation) => [
    {
      compositePk: primaryKey({
        columns: [twoFactorConfirmation.userId],
      }),
    },
  ]
);

// Login activity tracking table
export const loginActivities = pgTable("login_activities", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ------------------------------------ LEADS ------------------------------------
// Fases de Lead en el funnel
export const leadStatusEnum = pgEnum("lead_status_enum", [
  // Fases de bot
  "nuevo", // Acaba de entrar el lead
  "contactado", // Se le ha enviado el primer mensaje
  "activo", // El bot esta conversando con el lead y clasificando
  "calificado", // El bot a recolectado la informacion necesaria del lead
  "propuesta", // El bot manda propuesta de vehiculos al lead
  "evaluando", // El bot ha sigue mandando opciones y el lead esta decidiendo
  "manager", // El lead selecciona un vehiculo y se eleva a los vendedores
  // Fases manuales
  "iniciado", // El vendedor se ha hecho cargo del lead
  "documentacion", // El lead necesita mandar la documentacion necesaria
  "comprador", // El lead a comprado un vehiculo
  // Fases de error
  "descartado", // El lead no tiene interes o esta por error
  "sin_interes", // El lead ya no esta interesado
  "inactivo", // El lead no responde y no hay manera de comunicarse con el
  "perdido", // El lead ya ha comprado en otro lado
  "rechazado", // El lead ha rechazado todas las propuestas
  "sin_opciones", // El lead quiere un vehiculo que no hay en stock
]);

export const timeframeEnum = pgEnum("timeframe_enum", [
  "inmediato", // ASAP
  "esta_semana", // Esta semana
  "proxima_semana", // Próxima semana
  "dos_semanas", // En dos semanas
  "un_mes", // En un mes
  "1-3 meses", // 1 a 3 meses
  "3-6 meses", // 3 a 6 meses
  "6+ meses", // Más de 6 meses
  "indefinido", // No tiene un plazo definido
]);

export const leadTypeEnum = pgEnum("lead_type_enum", [
  "autonomo",
  "empresa",
  "particular",
  "pensionista",
]);

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Lead Info
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  type: leadTypeEnum("type"),
  // Lead advanced info (bot can change this info)
  status: leadStatusEnum("status").default("nuevo").notNull(),
  expectedPurchaseTimeframe: timeframeEnum("expected_purchase_timeframe"),
  budget: text("budget"),
  // Campaign from facebook
  campaignId: uuid("campaign_id").references(() => campaigns.id, {
    onDelete: "set null",
  }),
  // Lead messages/interactions
  lastContactedAt: timestamp("last_contacted_at", { mode: "date" }),
  lastMessageAt: timestamp("last_message_at", { mode: "date" }),
  nextFollowUpDate: timestamp("next_follow_up_date", { mode: "date" }),
  // Created & Updated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------- LEAD TAGS --------------------------------------
export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color").default("#cccccc"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const leadTags = pgTable(
  "lead_tags",
  {
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.leadId, t.tagId] }),
  })
);

// -------------------------------------- LEAD NOTES --------------------------------------
// Lead notes table for storing notes related to leads
export const leadNotes = pgTable("lead_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------- LEAD TASKS --------------------------------------
// Lead task priority enum
export const taskPriorityEnum = pgEnum("task_priority", [
  "baja",
  "media",
  "alta",
  "urgente",
]);

// Lead task status enum
export const taskStatusEnum = pgEnum("task_status", [
  "pendiente",
  "progreso",
  "completado",
  "cancelado",
]);

// Lead tasks table for storing tasks related to leads
export const leadTasks = pgTable("lead_tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  priority: taskPriorityEnum("priority").default("media").notNull(),
  status: taskStatusEnum("status").default("pendiente").notNull(),
  dueDate: timestamp("due_date", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// -------------------------------------- FACEBOOK & CAMPAIGNS --------------------------------------
// Facebook campaign table
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  externalId: text("external_id"), // Facebook campaign ID
  name: text("name").notNull(),
  type: text("type").default("facebook").notNull(),
  formId: text("form_id"), // Facebook form ID
  adId: text("ad_id"), // Facebook ad ID
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// For tracking and debugging webhook events
export const webhookLogs = pgTable("webhook_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(),
  status: text("status").default("received").notNull(),
  error: text("error"),
  processedAt: timestamp("processed_at", { mode: "date" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// -------------------------------------- EMAILS --------------------------------------
export const emailTemplates = pgTable("email_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Junction table for email templates to lead statuses
export const emailTemplateStatuses = pgTable(
  "email_template_statuses",
  {
    templateId: uuid("template_id")
      .notNull()
      .references(() => emailTemplates.id, { onDelete: "cascade" }),
    status: leadStatusEnum("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.templateId, t.status] }),
  })
);

// Table for tracking sent emails
export const emailHistory = pgTable("email_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  templateId: uuid("template_id")
    .notNull()
    .references(() => emailTemplates.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  sentCount: integer("sent_count").notNull(),
});

// Junction table for email history to leads
export const emailHistoryLeads = pgTable(
  "email_history_leads",
  {
    historyId: uuid("history_id")
      .notNull()
      .references(() => emailHistory.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    sentAt: timestamp("sent_at").defaultNow().notNull(),
    status: text("status").default("sent").notNull(), // sent, delivered, opened, clicked, etc.
  },
  (t) => ({
    pk: primaryKey({ columns: [t.historyId, t.leadId] }),
  })
);
// -------------------------------------- VECTOR TYPE FOR EMBEDDINGS --------------------------------------
const vector = (dimensions: number) =>
  customType<{
    data: number[];
    driverData: string;
  }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value) {
      // Format as Postgres array string for pgvector: e.g. '[0.1, 0.2, ...]'
      return `[${value.join(",")}]`;
    },
    fromDriver(value) {
      // Convert PG string back to array
      return value.slice(1, -1).split(",").map(Number);
    },
  });

// -------------------------------------- STOCK --------------------------------------
export const carTypeEnum = pgEnum("car_type", [
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
]);

// Stock items table for cars
export const carStock = pgTable("car_stock", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Identificación
  vin: text("vin"),
  // Información básica
  marca: text("marca"),
  modelo: text("modelo"),
  version: text("version"),
  motor: text("motor"),
  carroceria: text("carroceria"),
  puertas: integer("puertas"),
  transmision: text("transmision"),
  etiqueta: text("etiqueta"),
  fecha_version: date("fecha_version"),
  color: text("color"),
  kilometros: integer("kilometros"),
  matricula: text("matricula"),
  type: carTypeEnum("type").default("sedan").notNull(),
  description: text("description"),
  imageUrl: text("image_url").array(),
  url: text("url"),
  notes: text("notes"),
  // Comerciante / procedencia
  comercial: text("comercial"),
  sociedad: text("sociedad"),
  tienda: text("tienda"),
  provincia: text("provincia"),
  // Precios y financiación
  precio_compra: numeric("precio_compra", { precision: 10, scale: 2 }),
  precio_venta: numeric("precio_venta", { precision: 10, scale: 2 }),
  precio_financiado: numeric("precio_financiado", { precision: 10, scale: 2 }),
  impuestos_incluidos: boolean("impuestos_incluidos").default(true),
  impuesto: numeric("impuesto", { precision: 5, scale: 2 }),
  // Estado
  garantia: text("garantia"),
  vendido: boolean("vendido").default(false),
  gastos_adicionales: numeric("gastos_adicionales", {
    precision: 10,
    scale: 2,
  }),
  // Embeddings
  embedding: vector(768)("vector"),
  // Created & Updated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
