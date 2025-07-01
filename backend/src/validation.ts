import { z } from "zod";

export const questionSchema = z.object({
  question: z
    .string()
    .min(1, "Treść pytania jest wymagana")
    .min(5, "Pytanie musi mieć co najmniej 5 znaków")
    .max(200, "Pytanie nie może być dłuższe niż 200 znaków"),
  answer: z
    .string()
    .min(1, "Odpowiedź jest wymagana")
    .min(2, "Odpowiedź musi mieć co najmniej 2 znaki")
    .max(100, "Odpowiedź nie może być dłuższa niż 100 znaków"),
  image: z
    .string()
    .optional()
    .refine(
      (imageData) => {
        if (!imageData) return true; // Optional field
        // Check if it's a valid base64 data URL
        return /^data:image\/(jpeg|jpg|png|webp);base64,/.test(imageData);
      },
      "Obrazek musi być w formacie base64 data URL (JPEG, PNG, WebP)"
    ),
});

export const videoGenerationRequestSchema = z.object({
  topic: z
    .string()
    .min(1, "Temat quizu jest wymagany")
    .min(3, "Temat musi mieć co najmniej 3 znaki")
    .max(100, "Temat nie może być dłuższy niż 100 znaków"),
  questions: z
    .array(questionSchema)
    .min(2, "Quiz musi zawierać co najmniej 2 pytania")
    .max(5, "Quiz może zawierać maksymalnie 5 pytań"),
});

export type VideoGenerationRequest = z.infer<typeof videoGenerationRequestSchema>;
export type QuestionData = z.infer<typeof questionSchema>; 