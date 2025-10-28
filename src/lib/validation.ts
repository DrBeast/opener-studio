import { z } from "zod";
import { VALIDATION_LIMITS } from "./validation-constants";

// Helper to count words
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

// Reusable field validators
export const linkedinBioSchema = z
  .string()
  .trim()
  .min(1, "LinkedIn bio is required")
  .max(
    VALIDATION_LIMITS.MAX_CHARS_BG,
    `LinkedIn bio must be less than ${VALIDATION_LIMITS.MAX_CHARS_BG} characters`
  )
  .refine(
    (val) => countWords(val) >= VALIDATION_LIMITS.MIN_WORDS_BG,
    `LinkedIn bio must contain at least ${VALIDATION_LIMITS.MIN_WORDS_BG} words`
  );

export const interactionDescriptionSchema = z
  .string()
  .trim()
  .max(
    VALIDATION_LIMITS.MAX_CHARS_INTERACTION,
    `Description must be less than ${VALIDATION_LIMITS.MAX_CHARS_INTERACTION} characters`
  )
  .optional();

export const feedbackTextSchema = z
  .string()
  .trim()
  .min(
    VALIDATION_LIMITS.MIN_CHARS_FEEDBACK,
    `Feedback must be at least ${VALIDATION_LIMITS.MIN_CHARS_FEEDBACK} characters`
  )
  .max(
    VALIDATION_LIMITS.MAX_CHARS_FEEDBACK,
    `Feedback must be less than ${VALIDATION_LIMITS.MAX_CHARS_FEEDBACK} characters`
  );

export const profileBackgroundSchema = z
  .string()
  .trim()
  .min(1, "Background information is required")
  .max(
    VALIDATION_LIMITS.MAX_CHARS_BG,
    `Background must be less than ${VALIDATION_LIMITS.MAX_CHARS_BG} characters`
  )
  .refine(
    (val) => countWords(val) >= VALIDATION_LIMITS.MIN_WORDS_BG,
    `Background must contain at least ${VALIDATION_LIMITS.MIN_WORDS_BG} words`
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
  .max(
    VALIDATION_LIMITS.MAX_CHARS_OBJECTIVE,
    `Objective must be less than ${VALIDATION_LIMITS.MAX_CHARS_OBJECTIVE} characters`
  );

export const additionalContextSchema = z
  .string()
  .trim()
  .max(
    VALIDATION_LIMITS.MAX_CHARS_FEEDBACK,
    `Additional context must be less than ${VALIDATION_LIMITS.MAX_CHARS_FEEDBACK} characters`
  )
  .optional();
