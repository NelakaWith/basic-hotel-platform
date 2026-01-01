import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const hotelSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  status: z.enum(["active", "inactive"]).optional(),
});

export const roomTypeSchema = z.object({
  name: z.string().min(1),
  base_rate: z.number().nonnegative(),
});

export const adjustmentSchema = z.object({
  effective_date: z.string().datetime({ offset: true }).or(z.string().min(1)),
  adjustment_amount: z.number(),
  reason: z.string().min(1),
});

export function validate(schema, data) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
  return parsed.data;
}
