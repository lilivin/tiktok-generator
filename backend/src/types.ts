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
export interface VideoAssets {
  backgroundImages: string[]; // Paths to generated background images
  audioFiles: {
    intro?: string;
    questions: string[]; // Audio for each question
    answers: string[]; // Audio for each answer  
    outro?: string;
  };
}

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
  assets?: VideoAssets; // Generated assets paths
}

// External API types
export interface FalAIImageResponse {
  images: Array<{
    url: string;
    width: number;
    height: number;
    content_type?: string;
  }>;
}

export interface ElevenLabsVoiceResponse {
  audio_base64?: string;
}

// Remotion props
export interface VideoCompositionProps {
  topic: string;
  questions: Question[];
  backgroundImages: string[];
  audioFiles: {
    intro?: string;
    questions: string[];
    answers: string[];
    outro?: string;
  };
} 