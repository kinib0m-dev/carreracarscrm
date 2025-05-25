import { authRouter } from "@/lib/auth/server/procedures";
import { createTRPCRouter } from "../init";
import { leadRouter } from "@/lib/leads/server/procedures";
import { leadNoteRouter } from "@/lib/leads/server/notes-procedures";
import { leadTaskRouter } from "@/lib/leads/server/task-procedures";
import { leadTagsRouter } from "@/lib/leads/server/tags-procedures";
import { emailRouter } from "@/lib/email/server/procedures";
import { stockRouter } from "@/lib/stock/server/procedures";
import { botDocsRouter } from "@/lib/bot-docs/server/procedures";
import { playgroundRouter } from "@/lib/playground/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // Leads
  lead: leadRouter,
  leadNote: leadNoteRouter,
  leadTask: leadTaskRouter,
  leadTags: leadTagsRouter,
  // Emails,
  emails: emailRouter,
  // Stock
  stock: stockRouter,
  // Bot Docs
  botDocs: botDocsRouter,
  // PLayground
  playground: playgroundRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
