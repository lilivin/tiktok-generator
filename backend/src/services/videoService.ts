import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { VideoJob, VideoGenerationRequest } from '../types';

// In-memory storage for video jobs (w produkcji byłaby to baza danych)
const videoJobs = new Map<string, VideoJob>();

export class VideoService {
  private static instance: VideoService;
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'generated-videos');
    this.ensureOutputDirectory();
  }

  static getInstance(): VideoService {
    if (!VideoService.instance) {
      VideoService.instance = new VideoService();
    }
    return VideoService.instance;
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.access(this.outputDir);
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  async createVideoJob(request: VideoGenerationRequest): Promise<string> {
    const jobId = uuidv4();
    const job: VideoJob = {
      id: jobId,
      status: 'pending',
      topic: request.topic,
      questions: request.questions,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      currentStep: 'Inicjalizacja...',
    };

    videoJobs.set(jobId, job);

    // Start processing asynchronously
    this.processVideoJob(jobId).catch(error => {
      console.error(`Error processing video job ${jobId}:`, error);
      this.updateJobStatus(jobId, 'failed', error.message);
    });

    return jobId;
  }

  async getVideoJob(jobId: string): Promise<VideoJob | null> {
    return videoJobs.get(jobId) || null;
  }

  async updateJobStatus(
    jobId: string, 
    status: VideoJob['status'], 
    error?: string,
    progress?: number,
    currentStep?: string
  ): Promise<void> {
    const job = videoJobs.get(jobId);
    if (job) {
      job.status = status;
      job.updatedAt = new Date();
      if (error) job.error = error;
      if (progress !== undefined) job.progress = progress;
      if (currentStep) job.currentStep = currentStep;
      videoJobs.set(jobId, job);
    }
  }

  private async processVideoJob(jobId: string): Promise<void> {
    const job = videoJobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    try {
      // Update status to processing
      await this.updateJobStatus(jobId, 'processing', undefined, 10, 'Rozpoczynanie generowania...');

      // Step 1: Generate background images (mock)
      await this.updateJobStatus(jobId, 'processing', undefined, 20, 'Generowanie obrazów tła z AI...');
      await this.mockGenerateBackgrounds(job);

      // Step 2: Generate voice narration (mock)
      await this.updateJobStatus(jobId, 'processing', undefined, 40, 'Synteza głosu lektora...');
      await this.mockGenerateVoice(job);

      // Step 3: Compose video (mock)
      await this.updateJobStatus(jobId, 'processing', undefined, 60, 'Kompozycja elementów wideo...');
      await this.mockComposeVideo(job);

      // Step 4: Render final video (mock)
      await this.updateJobStatus(jobId, 'processing', undefined, 80, 'Renderowanie finalnego wideo...');
      const outputPath = await this.mockRenderVideo(job);

      // Step 5: Complete
      job.filePath = outputPath;
      await this.updateJobStatus(jobId, 'completed', undefined, 100, 'Wideo gotowe do pobrania!');

    } catch (error) {
      console.error(`Error in video processing pipeline for job ${jobId}:`, error);
      await this.updateJobStatus(jobId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private async mockGenerateBackgrounds(job: VideoJob): Promise<void> {
    // Mock delay for AI image generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // W rzeczywistej implementacji tutaj byłoby:
    // - Wywołanie Fal.ai API dla każdego pytania + intro
    // - Pobranie i zapisanie wygenerowanych obrazów
    console.log(`Mock: Generated ${job.questions.length + 1} background images for job ${job.id}`);
  }

  private async mockGenerateVoice(job: VideoJob): Promise<void> {
    // Mock delay for TTS generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // W rzeczywistej implementacji tutaj byłoby:
    // - Wywołanie ElevenLabs API dla każdego pytania i odpowiedzi
    // - Pobranie i zapisanie plików audio
    console.log(`Mock: Generated voice for ${job.questions.length * 2} text segments for job ${job.id}`);
  }

  private async mockComposeVideo(job: VideoJob): Promise<void> {
    // Mock delay for video composition
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // W rzeczywistej implementacji tutaj byłoby:
    // - Przygotowanie props dla Remotion
    // - Inicjalizacja kompozycji z wszystkimi elementami
    console.log(`Mock: Composed video elements for job ${job.id}`);
  }

  private async mockRenderVideo(job: VideoJob): Promise<string> {
    // Mock delay for video rendering
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create a mock video file path
    const filename = `quiz-${job.id}.mp4`;
    const filePath = path.join(this.outputDir, filename);
    
    // W rzeczywistej implementacji tutaj byłoby:
    // - Renderowanie wideo przez Remotion
    // - Zapisanie pliku MP4 o specyfikacji 1080x1920, 30fps
    
    // For mock purposes, create an empty file
    await fs.writeFile(filePath, 'mock video content');
    
    console.log(`Mock: Rendered video file for job ${job.id} at ${filePath}`);
    return filePath;
  }

  async getVideoFilePath(jobId: string): Promise<string | null> {
    const job = videoJobs.get(jobId);
    return job?.filePath || null;
  }

  async deleteVideoFile(jobId: string): Promise<void> {
    const job = videoJobs.get(jobId);
    if (job?.filePath) {
      try {
        await fs.unlink(job.filePath);
        console.log(`Deleted video file for job ${jobId}`);
      } catch (error) {
        console.error(`Error deleting video file for job ${jobId}:`, error);
      }
    }
  }

  // Cleanup method for old jobs (można wywołać cyklicznie)
  async cleanupOldJobs(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [jobId, job] of videoJobs.entries()) {
      if (job.createdAt < cutoffTime) {
        await this.deleteVideoFile(jobId);
        videoJobs.delete(jobId);
        console.log(`Cleaned up old job ${jobId}`);
      }
    }
  }
} 