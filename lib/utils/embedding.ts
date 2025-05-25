import { embed } from "ai";
import { gemini } from "./google";

export async function generateEmbedding(content: string) {
  const result = await embed({
    model: gemini.embedding("text-embedding-004"),
    value: content,
  });

  return result.embedding;
}
