// Convert empty string or nullish → undefined, otherwise number
export const toInt = (v: any): number | undefined =>
  v === "" || v == null ? undefined : Number(v);

// Convert value to boolean (supports "true"/"false" strings)
export const toBool = (v: any): boolean =>
  typeof v === "boolean" ? v : String(v).toLowerCase() === "true";

// Parse JSON if it's a string, otherwise return as-is or fallback
export const parseMaybeJson = <T>(v: any, fallback: T): T => {
  if (Array.isArray(v) || (v && typeof v === "object" && !Array.isArray(v))) {
    return v as T;
  }
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
};
