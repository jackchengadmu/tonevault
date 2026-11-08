import { z } from "zod";
import { createOrderSchema, productIdSchema } from "./catalog";

export const checkoutOrderSchema = z.object({
  product_id: productIdSchema,
  quantity: createOrderSchema.shape.quantity,
  customer: z.object({
    full_name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(7).max(30).regex(/^[+0-9() .-]+$/),
    address: z.string().trim().min(10).max(500),
  }),
  payment_method: z.enum(["simulated_card", "simulated_gcash"]),
  inspection_requested: z.boolean().default(false),
  payment_confirmed: z.literal(true),
});
