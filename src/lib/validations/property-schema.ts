import { z } from "zod";

export const createPropertySchema = z.object({
  name: z.string().min(1, "Property name is required").max(100, "Property name must be less than 100 characters"),
  location: z.string().max(200, "Location must be less than 200 characters").optional(),
  type: z.enum(["hotel", "apartment", "resort", "guesthouse", "villa", "hostel"]).optional(),
  capacity: z.number().int().positive("Capacity must be a positive integer").optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
  basePrice: z.number().positive("Base price must be positive").optional(),
  currency: z.enum(["EUR", "USD", "GBP", "CHF"]).optional(),
  seasonRates: z.object({
    high: z.array(z.object({
      from: z.string().datetime("Invalid date format"),
      to: z.string().datetime("Invalid date format"),
      rate: z.number().positive("Rate must be positive")
    })).optional(),
    mid: z.array(z.object({
      from: z.string().datetime("Invalid date format"),
      to: z.string().datetime("Invalid date format"),
      rate: z.number().positive("Rate must be positive")
    })).optional(),
    low: z.array(z.object({
      from: z.string().datetime("Invalid date format"),
      to: z.string().datetime("Invalid date format"),
      rate: z.number().positive("Rate must be positive")
    })).optional()
  }).optional(),
  pricingRules: z.object({
    weekendFactor: z.number().positive("Weekend factor must be positive").optional(),
    minStay: z.number().int().positive("Minimum stay must be positive").optional(),
    earlyBird: z.object({
      days: z.number().int().positive("Early bird days must be positive"),
      discount: z.number().min(0).max(1, "Early bird discount must be between 0 and 1")
    }).optional(),
    lastMinute: z.object({
      days: z.number().int().positive("Last minute days must be positive"),
      discount: z.number().min(0).max(1, "Last minute discount must be between 0 and 1")
    }).optional()
  }).optional(),
  reservationAutoApprovalRules: z.object({
    enabled: z.boolean(),
    channels: z.array(z.string()).optional(),
    maxAmount: z.number().positive("Max amount must be positive").optional()
  }).optional(),
  eturizemId: z.string().max(50, "eTurizem ID must be less than 50 characters").optional(),
  rnoId: z.number().int().positive("RNO ID must be a positive integer").optional()
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
