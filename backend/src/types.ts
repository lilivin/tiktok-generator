// Shared types for backend and frontend (matching frontend/src/types.ts)

export interface Question {
  question: string;
  answer: string;
}

export interface QuizFormData {
  topic: string;
  questions: Question[];
}

export interface VideoGenerationRequest {
  topic: string;
  questions: Question[];
}

export interface VideoGenerationResponse {
  success: boolean;
  message: string;
  videoId?: string;
  error?: string;
}

export interface VideoGenerationStatus {
  status: 'idle' | 'generating' | 'completed' | 'error';
  step?: string;
  progress?: number;
  videoUrl?: string;
  error?: string;
}

// Backend-specific types
export interface VideoJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  topic: string;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
  filePath?: string;
  error?: string;
  progress?: number;
  currentStep?: string;
} 