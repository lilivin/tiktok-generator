import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { VideoJob, VideoGenerationRequest, VideoAssets } from '../types';
import { FalAIService } from './falaiService';
import { ElevenLabsService } from './elevenlabsService';
import { RemotionService } from './remotionService';

// In-memory storage for video jobs (w produkcji byłaby to baza danych)
const videoJobs = new Map<string, VideoJob>();

export class VideoService {
  private static instance: VideoService;
  private outputDir: string;
  private falaiService: FalAIService;
  private elevenlabsService: ElevenLabsService;
  private remotionService: RemotionService;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'generated-videos');
    this.ensureOutputDirectory();
    
    // Initialize external services
    this.falaiService = new FalAIService();
    this.elevenlabsService = new ElevenLabsService();
    this.remotionService = new RemotionService();
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateJobStatus(jobId, 'failed', errorMessage);
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

      // Create job-specific directory
      const jobDir = path.join(this.outputDir, `job-${jobId}`);
      await fs.mkdir(jobDir, { recursive: true });

      // Step 1: Generate background images with Fal.ai
      await this.updateJobStatus(jobId, 'processing', undefined, 20, 'Generowanie obrazów tła z AI...');
      const backgroundImages = await this.generateBackgrounds(job, jobDir);

      // Step 2: Generate voice narration with ElevenLabs
      await this.updateJobStatus(jobId, 'processing', undefined, 40, 'Synteza głosu lektora...');
      const audioFiles = await this.generateVoice(job, jobDir);

      // Store generated assets in job
      job.assets = {
        backgroundImages,
        audioFiles,
      };

      // Step 3: Compose video with Remotion
      await this.updateJobStatus(jobId, 'processing', undefined, 60, 'Kompozycja elementów wideo...');
      await this.composeVideo(job);

      // Step 4: Render final video with Remotion
      await this.updateJobStatus(jobId, 'processing', undefined, 80, 'Renderowanie finalnego wideo...');
      const outputPath = await this.renderVideo(job, jobDir);

      // Step 5: Complete
      job.filePath = outputPath;
      await this.updateJobStatus(jobId, 'completed', undefined, 100, 'Wideo gotowe do pobrania!');

    } catch (error) {
      console.error(`Error in video processing pipeline for job ${jobId}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateJobStatus(jobId, 'failed', errorMessage);
      
      // Cleanup on failure
      await this.cleanupJobAssets(jobId);
    }
  }

  private async generateBackgrounds(job: VideoJob, outputDir: string): Promise<string[]> {
    try {
      const questions = job.questions.map(q => q.question);
      return await this.falaiService.generateAllBackgrounds(job.topic, questions, outputDir);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Błąd generowania obrazów tła: ${errorMessage}`);
    }
  }

  private async generateVoice(job: VideoJob, outputDir: string): Promise<VideoAssets['audioFiles']> {
    try {
      return await this.elevenlabsService.generateAllAudio(job.topic, job.questions, outputDir);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Błąd generowania głosu: ${errorMessage}`);
    }
  }

  private async composeVideo(job: VideoJob): Promise<void> {
    try {
      if (!job.assets) {
        throw new Error('Assets not generated for job');
      }

      await this.remotionService.prepareComposition({
        topic: job.topic,
        questions: job.questions,
        backgroundImages: job.assets.backgroundImages,
        audioFiles: job.assets.audioFiles,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Błąd kompozycji wideo: ${errorMessage}`);
    }
  }

  private async renderVideo(job: VideoJob, outputDir: string): Promise<string> {
    try {
      if (!job.assets) {
        throw new Error('Assets not generated for job');
      }

      const outputPath = path.join(outputDir, `quiz-${job.id}.mp4`);
      
      await this.remotionService.renderVideo({
        topic: job.topic,
        questions: job.questions,
        backgroundImages: job.assets.backgroundImages,
        audioFiles: job.assets.audioFiles,
      }, outputPath, (progress: number) => {
        // Update progress during rendering
        const renderProgress = 80 + (progress * 0.2); // 80-100%
        this.updateJobStatus(job.id, 'processing', undefined, renderProgress, 
          `Renderowanie wideo: ${Math.round(progress * 100)}%`);
      });

      return outputPath;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Błąd renderowania wideo: ${errorMessage}`);
    }
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error deleting video file for job ${jobId}:`, errorMessage);
      }
    }
  }

  private async cleanupJobAssets(jobId: string): Promise<void> {
    try {
      const jobDir = path.join(this.outputDir, `job-${jobId}`);
      await fs.rm(jobDir, { recursive: true, force: true });
      console.log(`Cleaned up assets for job ${jobId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error cleaning up assets for job ${jobId}:`, errorMessage);
    }
  }

  // Cleanup method for old jobs (można wywołać cyklicznie)
  async cleanupOldJobs(maxAgeHours: number = 24): Promise<void> {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [jobId, job] of videoJobs.entries()) {
      if (job.createdAt < cutoffTime) {
        await this.deleteVideoFile(jobId);
        await this.cleanupJobAssets(jobId);
        videoJobs.delete(jobId);
        console.log(`Cleaned up old job ${jobId}`);
      }
    }
  }
} 