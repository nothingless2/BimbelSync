import { z } from "zod";

export const searchSchema = z.string()
  .max(100, "Maksimal 100 karakter")
  .transform(str => str.trim());

export function validateSearchQuery(q: any): string | null {
  if (!q) return null;
  if (Array.isArray(q)) q = q[0];
  
  const parsed = searchSchema.safeParse(q);
  if (!parsed.success) return null;
  
  const validStr = parsed.data;
  return validStr.length >= 2 ? validStr : null;
}
