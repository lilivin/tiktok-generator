// Shared types for backend and frontend (matching frontend/src/types.ts)

export interface Question {
  question: string;
  answer: string;
  image?: string; // Path to uploaded image file
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

// Audio file with duration information
export interface AudioWithDuration {
  path: string;
  duration: number; // Duration in seconds
}

// Backend-specific types
export interface VideoAssets {
  backgroundImages: string[]; // Paths to generated background images
  questionImages: string[]; // Paths to uploaded question images (same order as questions)
  audioFiles: {
    intro?: AudioWithDuration;
    questions: AudioWithDuration[]; // Audio for each question with duration
    answers: AudioWithDuration[]; // Audio for each answer with duration
    outro?: AudioWithDuration;
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

// Scene timing configuration
export interface SceneTiming {
  intro: number; // Duration in seconds
  questions: number[]; // Duration for each question
  timer: number; // Fixed timer duration
  answers: number[]; // Duration for each answer
  outro: number; // Duration in seconds
}

// Remotion props
export interface VideoCompositionProps {
  topic: string;
  questions: Question[];
  backgroundImages: string[];
  questionImages: string[]; // Paths to question images (same order as questions)
  audioFiles: {
    intro?: AudioWithDuration;
    questions: AudioWithDuration[];
    answers: AudioWithDuration[];
    outro?: AudioWithDuration;
  };
  timing: SceneTiming; // Dynamic timing based on audio durations
} 