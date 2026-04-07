import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name must be under 60 characters"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms of service",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ── Onboarding schemas ────────────────────────────────────────

export const userOnboardingSchema = z.object({
  accountType: z.literal("user"),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
});

export const driverOnboardingSchema = z.object({
  accountType: z.literal("driver"),
  phone: z
    .string()
    .regex(/^\+?[0-9]{10,15}$/, "Please enter a valid phone number")
    .min(1, "Phone number is required for drivers"),
  licenseNumber: z
    .string()
    .min(5, "License number must be at least 5 characters")
    .max(20, "License number too long"),
  vehicleType: z.enum(["bus", "minibus", "matatu", "coach"], {
    error: "Please select a vehicle type",
  }),
  vehicleNumber: z.string().min(5, "Vehicle registration number is required").max(15),
  vehicleCapacity: z
    .number({ error: "Capacity must be a number" })
    .int("Capacity must be a whole number")
    .min(1, "Capacity must be at least 1")
    .max(100, "Capacity cannot exceed 100"),
});

export const onboardingSchema = z.discriminatedUnion("accountType", [
  userOnboardingSchema,
  driverOnboardingSchema,
]);

// ── Booking schemas ───────────────────────────────────────────

export const passengerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  idNumber: z.string().optional(),
  seatNumber: z.string().optional(),
});

export const bookingSchema = z.object({
  scheduleId: z.string().min(1, "Please select a schedule"),
  passengers: z
    .array(passengerSchema)
    .min(1, "At least one passenger is required")
    .max(10, "Maximum 10 passengers per booking"),
  promoCode: z.string().optional(),
  paymentMethod: z.enum(["mpesa", "card", "cash"], {
    error: "Please select a payment method",
  }),
  notes: z.string().max(200, "Notes must be under 200 characters").optional(),
});

// ── Route management (admin) ──────────────────────────────────

export const routeSchema = z.object({
  name: z.string().min(3, "Route name required"),
  origin: z.string().min(2, "Origin required"),
  destination: z.string().min(2, "Destination required"),
  stops: z.array(z.string()).default([]),
  distanceKm: z.number().positive("Distance must be positive"),
  durationMinutes: z.number().int().positive("Duration must be positive"),
  basePrice: z.number().positive("Price must be positive"),
  vehicleType: z.string().min(1, "Vehicle type required"),
  amenities: z.array(z.string()).default([]),
});

// ── Promo code (admin) ────────────────────────────────────────

export const promoCodeSchema = z.object({
  code: z
    .string()
    .min(4, "Code must be at least 4 characters")
    .max(16, "Code must be under 16 characters")
    .regex(/^[A-Z0-9]+$/, "Code must contain only uppercase letters and numbers")
    .transform((v) => v.toUpperCase()),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z
    .number()
    .positive("Discount must be positive")
    .max(100, "Percentage discount cannot exceed 100%"),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().optional(),
});

// ── Type exports ──────────────────────────────────────────────

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
export type BookingFormValues = z.infer<typeof bookingSchema>;
export type RouteFormValues = z.infer<typeof routeSchema>;
export type PromoCodeFormValues = z.infer<typeof promoCodeSchema>;
