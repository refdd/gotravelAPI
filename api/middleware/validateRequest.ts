// middlewares/validateRequest.ts
import { AnyZodObject, ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

// Helper to flatten Zod error object into key-message pairs
const formatZodErrors = (error: ZodError) => {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    formatted[path] = issue.message;
  }
  return formatted;
};

export const validateRequest =
  (schema: AnyZodObject, partial = false) =>
  (req: Request, res: Response, next: NextFunction) => {
    const toValidate = partial ? schema.partial() : schema;
    const result = toValidate.safeParse(req.body);

    if (!result.success) {
      const cleanErrors = formatZodErrors(result.error);
      return res.status(400).json({
        error: "Validation failed",
        details: cleanErrors,
      });
    }

    req.body = result.data; // parsed and sanitized
    next();
  };
