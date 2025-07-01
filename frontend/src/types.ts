// Shared types for backend and frontend

export interface Question {
  question: string;
  answer: string;
  image?: File | string; // File for frontend, string path for backend
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
  videoStreamUrl?: string; // URL for in-browser video playback
  error?: string;
}

// Additional types for enhanced functionality
export interface VideoAssets {
  backgroundImages: string[]; // Paths to generated background images
  audioFiles: {
    intro?: string;
    questions: string[]; // Audio for each question
    answers: string[]; // Audio for each answer  
    outro?: string;
  };
} 