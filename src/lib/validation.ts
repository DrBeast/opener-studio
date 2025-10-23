import { z } from "zod";

// Helper to count words
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Reusable field validators
export const linkedinBioSchema = z
  .string()
  .trim()
  .min(1, "LinkedIn bio is required")
  .max(100000, "LinkedIn bio must be less than 100,000 characters")
  .refine(
    (val) => countWords(val) >= 50,
    "LinkedIn bio must contain at least 50 words"
  );

export const interactionDescriptionSchema = z
  .string()
  .trim()
  .max(5000, "Description must be less than 5,000 characters")
  .optional();

export const feedbackTextSchema = z
  .string()
  .trim()
  .min(10, "Feedback must be at least 10 characters")
  .max(2000, "Feedback must be less than 2,000 characters");

export const profileBackgroundSchema = z
  .string()
  .trim()
  .min(1, "Background information is required")
  .max(100000, "Background must be less than 100,000 characters")
  .refine(
    (val) => countWords(val) >= 50,
    "Background must contain at least 50 words"
  );

// Form schemas
export const addContactFormSchema = z.object({
  linkedinBio: linkedinBioSchema,
});

export const interactionFormSchema = z.object({
  interaction_type: z.string().min(1, "Interaction type is required"),
  description: interactionDescriptionSchema,
  interaction_date: z.string().nullable(),
  contact_id: z.string().optional(),
  medium: z.string().optional(),
  follow_up_due_date: z.string().nullable().optional(),
});

export const feedbackFormSchema = z.object({
  feedback: feedbackTextSchema,
});

export const profileFormSchema = z.object({
  backgroundInput: profileBackgroundSchema,
});

// Message generation validation schemas
export const objectiveSchema = z
  .string()
  .trim()
  .min(1, "Objective is required")
  .max(1000, "Objective must be less than 1,000 characters");

export const additionalContextSchema = z
  .string()
  .trim()
  .max(2000, "Additional context must be less than 2,000 characters")
  .optional();
