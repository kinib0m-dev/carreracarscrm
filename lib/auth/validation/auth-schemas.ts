import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  code: z.optional(z.string()),
});

export const registerSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Minimum 8 characters required" })
    .regex(/[a-z]/, { message: "At least one lowercase letter required" })
    .regex(/[A-Z]/, { message: "At least one uppercase letter required" })
    .regex(/[0-9]/, { message: "At least one number required" })
    .regex(/(?=.*[!@#$%*^&*\-_])/, {
      message: "At least one special character required",
    }),
});

export const resetSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
});

export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Minimum 8 characters required" })
    .regex(/[a-z]/, { message: "At least one lowercase letter required" })
    .regex(/[A-Z]/, { message: "At least one uppercase letter required" })
    .regex(/[0-9]/, { message: "At least one number required" })
    .regex(/(?=.*[!@#$%*^&*\-_])/, {
      message: "At least one special character required",
    }),
});

// Schema for delete account form
export const deleteAccountSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
  confirmation: z.literal("DELETE", {
    message: "Please type DELETE to confirm",
  }),
});

export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
