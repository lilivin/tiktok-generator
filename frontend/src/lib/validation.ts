import { z } from "zod";

export const questionSchema = z.object({
  question: z
    .string()
    .min(1, "Treść pytania jest wymagana")
    .min(3, "Pytanie musi mieć co najmniej 5 znaków")
    .max(200, "Pytanie nie może być dłuższe niż 200 znaków"),
  answer: z
    .string()
    .min(1, "Odpowiedź jest wymagana")
    .min(2, "Odpowiedź musi mieć co najmniej 2 znaki")
    .max(100, "Odpowiedź nie może być dłuższa niż 100 znaków"),
  image: z
    .any()
    .optional()
    .refine(
      (value) => {
        if (!value) return true; // Optional field
        
        // Handle FileList from input[type="file"]
        if (value instanceof FileList) {
          if (value.length === 0) return true; // No file selected
          const file = value[0];
          return file instanceof File && file.size <= 5 * 1024 * 1024; // 5MB limit
        }
        
        // Handle direct File object
        if (value instanceof File) {
          return value.size <= 5 * 1024 * 1024; // 5MB limit
        }
        
        return true; // Allow other values to pass (they might be processed elsewhere)
      },
      "Obrazek nie może być większy niż 5MB"
    )
    .refine(
      (value) => {
        if (!value) return true; // Optional field
        
        // Handle FileList from input[type="file"]
        if (value instanceof FileList) {
          if (value.length === 0) return true; // No file selected
          const file = value[0];
          return file instanceof File && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
        }
        
        // Handle direct File object
        if (value instanceof File) {
          return ['image/jpeg', 'image/png', 'image/webp'].includes(value.type);
        }
        
        return true; // Allow other values to pass
      },
      "Obsługiwane formaty: JPEG, PNG, WebP"
    )
    .transform((value) => {
      // Transform FileList to File or undefined
      if (value instanceof FileList) {
        return value.length > 0 ? value[0] : undefined;
      }
      return value;
    }),
});

export const quizFormSchema = z.object({
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

export type QuizFormData = z.infer<typeof quizFormSchema>;
export type QuestionData = z.infer<typeof questionSchema>; 