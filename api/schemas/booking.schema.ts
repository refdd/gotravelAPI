import { z } from "zod";

export const bookingSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),

  numberOfPeople: z.coerce.number().int().min(1),
  totalAmount: z.coerce.number().nonnegative(),
  currency: z.string().default("USD"),
  travelDate: z.coerce.date(),

  specialRequests: z.string().optional(),
  notes: z.string().nullable().optional(),
  tourId: z.string().nullable().optional(),

  adults: z.coerce.number().int().optional(),
  children: z.coerce.number().int().optional(),
  ageOfChildern: z.array(z.string()).optional(),

  arrival: z.coerce.date().optional(),
  departure: z.coerce.date().optional(),
  departure_airport: z.string().optional(),
  nationality: z.string().optional(),
  flight: z.string().optional(),

  Request_Source: z.string().optional(),
  http_referer: z.string().url().optional(),
  url_goal: z.string().url().optional(),

  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
});
