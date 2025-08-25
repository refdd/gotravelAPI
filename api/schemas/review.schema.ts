// schemas/review.schema.ts
import { z } from "zod";

export const reviewSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().optional(),

  imageAlt: z.string().optional(),
  imageTitle: z.string().optional(),
  author: z.string().optional(),
  publishedAt: z.coerce.date().optional(),

  metaTitle: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaDescription: z.string().optional(),
});
