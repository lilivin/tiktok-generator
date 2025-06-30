import path from 'path';
import fs from 'fs/promises';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { VideoCompositionProps } from '../types';

export class RemotionService {
  private outputDir: string;
  private bundleLocation: string | null = null;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'generated-videos');
  }

  /**
   * Prepare composition for rendering
   */
  async prepareComposition(props: VideoCompositionProps): Promise<void> {
    try {
      console.log('Preparing Remotion composition...');
      
      // Validate that all required assets exist
      await this.validateAssets(props);
      
      // Calculate total composition duration based on dynamic timing
      const totalDuration = this.calculateVideoDuration(props.timing);
      console.log(`Composition duration: ${totalDuration}s`);
      
      // Validate timing consistency
      if (props.timing.questions.length !== props.questions.length) {
        throw new Error(`Timing mismatch: ${props.timing.questions.length} question timings for ${props.questions.length} questions`);
      }
      
      if (props.timing.answers.length !== props.questions.length) {
        throw new Error(`Timing mismatch: ${props.timing.answers.length} answer timings for ${props.questions.length} questions`);
      }
      
      // Validate that we have enough background images
      const requiredBackgrounds = props.questions.length + 1; // +1 for intro
      if (props.backgroundImages.length < requiredBackgrounds) {
        throw new Error(`Not enough background images: need ${requiredBackgrounds}, got ${props.backgroundImages.length}`);
      }
      
      // Bundle Remotion project if not already bundled
      if (!this.bundleLocation) {
        console.log('Bundling Remotion project...');
        const entryPoint = path.join(__dirname, '../remotion/Root.tsx');
        const publicDir = path.join(__dirname, '../../public'); // Point to backend/public
        
        this.bundleLocation = await bundle({
          entryPoint,
          publicDir,
          webpackOverride: (config) => config,
        });
        console.log(`Remotion bundle created at: ${this.bundleLocation}`);
        console.log(`Public directory: ${publicDir}`);
      }
      
      // Log composition structure for debugging
      console.log('Composition structure:', {
        topic: props.topic,
        questionsCount: props.questions.length,
        backgroundImagesCount: props.backgroundImages.length,
        audioFilesIntro: !!props.audioFiles.intro,
        audioFilesQuestions: props.audioFiles.questions.length,
        audioFilesAnswers: props.audioFiles.answers.length,
        audioFilesOutro: !!props.audioFiles.outro,
        timing: {
          intro: props.timing.intro,
          questionsTotal: props.timing.questions.reduce((sum, d) => sum + d, 0),
          timerTotal: props.timing.timer * props.questions.length,
          answersTotal: props.timing.answers.reduce((sum, d) => sum + d, 0),
          outro: props.timing.outro,
          total: totalDuration
        }
      });
      
      console.log('Composition prepared successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to prepare composition: ${errorMessage}`);
    }
  }

  /**
   * Render video using Remotion
   */
  async renderVideo(
    props: VideoCompositionProps, 
    outputPath: string, 
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    try {
      console.log(`Rendering video with Remotion to: ${outputPath}`);
      
      if (!this.bundleLocation) {
        throw new Error('Remotion bundle not prepared. Call prepareComposition() first.');
      }

      console.log('🔍 Calling selectComposition with inputProps:', {
        bundleLocation: this.bundleLocation,
        compositionId: 'VideoQuiz',
        inputPropsKeys: Object.keys(props),
        timingData: props.timing
      });

      // Get composition details
      const compositions = await selectComposition({
        serveUrl: this.bundleLocation,
        id: 'VideoQuiz',
        inputProps: props as unknown as Record<string, unknown>,
      });

      console.log('📊 Selected composition result:', {
        id: compositions.id,
        width: compositions.width,
        height: compositions.height,
        fps: compositions.fps,
        durationInFrames: compositions.durationInFrames,
        durationInSeconds: (compositions.durationInFrames / compositions.fps).toFixed(2) + 's'
      });

      // Calculate expected duration manually to compare
      const expectedDuration = this.calculateVideoDuration(props.timing);
      const expectedFrames = Math.round(expectedDuration * compositions.fps);
      
      console.log('🔍 Duration comparison:', {
        expectedDurationSeconds: expectedDuration,
        expectedFrames: expectedFrames,
        actualFrames: compositions.durationInFrames,
        difference: compositions.durationInFrames - expectedFrames
      });

      if (Math.abs(compositions.durationInFrames - expectedFrames) > 30) {
        console.log('⚠️  DURATION MISMATCH DETECTED! calculateMetadata may not be working correctly');
        console.log('🔧 FIXING: Manually overriding durationInFrames with correct value');
        
        // Przesłoń durationInFrames z poprawną wartością
        compositions.durationInFrames = expectedFrames;
        
        console.log('✅ FIXED: durationInFrames set to', expectedFrames, 'frames (', (expectedFrames/compositions.fps).toFixed(2), 'seconds)');
      }

      // Setup progress callback
      let lastProgress = 0;
      const onProgress = (progressInfo: { progress: number }) => {
        const progress = progressInfo.progress;
        if (progressCallback && progress > lastProgress + 0.05) { // Report every 5%
          progressCallback(progress);
          lastProgress = progress;
          console.log(`Remotion render progress: ${Math.round(progress * 100)}%`);
        }
      };

      // Render the video
      await renderMedia({
        composition: compositions,
        serveUrl: this.bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: props as unknown as Record<string, unknown>,
        onProgress,
        imageFormat: 'jpeg',
        pixelFormat: 'yuv420p',
        crf: 18, // High quality
        logLevel: 'info',
        concurrency: 1, // Use single thread to avoid overwhelming system
      });

      // Complete progress
      if (progressCallback) {
        progressCallback(1.0);
      }
      
      console.log(`✅ Video rendered successfully with Remotion: ${outputPath}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Remotion rendering failed:', errorMessage);
      throw new Error(`Failed to render video with Remotion: ${errorMessage}`);
    }
  }

  /**
   * Validate that all required assets exist
   */
  private async validateAssets(props: VideoCompositionProps): Promise<void> {
    // Helper function to check if URL is accessible
    const checkUrl = async (url: string): Promise<boolean> => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        // For HTTP URLs, make a HEAD request to check if accessible
        try {
          const response = await fetch(url, { method: 'HEAD' });
          return response.ok;
        } catch {
          return false;
        }
      } else {
        // For local files, use fs.access
        try {
          await fs.access(url);
          return true;
        } catch {
          return false;
        }
      }
    };

    // Check background images
    for (const imagePath of props.backgroundImages) {
      const isAccessible = await checkUrl(imagePath);
      if (!isAccessible) {
        throw new Error(`Background image not found: ${imagePath}`);
      }
    }

    // Check audio files
    if (props.audioFiles.intro) {
      const isAccessible = await checkUrl(props.audioFiles.intro.path);
      if (!isAccessible) {
        throw new Error(`Intro audio not found: ${props.audioFiles.intro.path}`);
      }
    }

    for (const audioFile of props.audioFiles.questions) {
      const isAccessible = await checkUrl(audioFile.path);
      if (!isAccessible) {
        throw new Error(`Question audio not found: ${audioFile.path}`);
      }
    }

    for (const audioFile of props.audioFiles.answers) {
      const isAccessible = await checkUrl(audioFile.path);
      if (!isAccessible) {
        throw new Error(`Answer audio not found: ${audioFile.path}`);
      }
    }

    if (props.audioFiles.outro) {
      const isAccessible = await checkUrl(props.audioFiles.outro.path);
      if (!isAccessible) {
        throw new Error(`Outro audio not found: ${props.audioFiles.outro.path}`);
      }
    }
  }

  /**
   * Calculate total video duration in seconds
   */
  private calculateVideoDuration(timing: { intro: number; questions: number[]; timer: number; answers: number[]; outro: number }): number {
    return timing.intro + 
      timing.questions.reduce((sum, d) => sum + d, 0) +
      (timing.questions.length * timing.timer) +
      timing.answers.reduce((sum, d) => sum + d, 0) +
      timing.outro;
  }
} 