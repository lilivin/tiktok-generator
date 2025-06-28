import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';
import { VideoCompositionProps } from '../types';

export class RemotionService {
  private outputDir: string;

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
      
      // In a real implementation, this would:
      // - Set up Remotion composition with proper props
      // - Validate video duration based on audio files
      // - Prepare any additional assets needed
      
      console.log('Composition prepared successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to prepare composition: ${errorMessage}`);
    }
  }

  /**
   * Render video using Remotion (mock with real MP4 generation)
   */
  async renderVideo(
    props: VideoCompositionProps, 
    outputPath: string, 
    progressCallback?: (progress: number) => void
  ): Promise<void> {
    try {
      console.log(`Rendering video to: ${outputPath}`);
      
      // Simulate rendering progress
      if (progressCallback) {
        for (let i = 0; i <= 80; i += 20) {
          progressCallback(i / 100);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Create a real montage video using generated assets
      await this.createVideoMontage(props, outputPath);
      
      // Complete progress
      if (progressCallback) {
        progressCallback(1.0);
      }
      
      console.log(`Video rendered successfully: ${outputPath}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to render video: ${errorMessage}`);
    }
  }

  /**
   * Create a real video montage using generated assets
   */
  private async createVideoMontage(props: VideoCompositionProps, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!ffmpegStatic) {
        throw new Error('ffmpeg-static not available');
      }

      // Validate we have enough backgrounds
      if (props.backgroundImages.length < props.questions.length + 1) {
        throw new Error(`Not enough background images. Need ${props.questions.length + 1}, got ${props.backgroundImages.length}`);
      }
      
      // Define timing constants
      const introDuration = 5;
      const questionDuration = 3;
      const timerDuration = 3;
      const answerDuration = 4;
      const outroDuration = 6;
      
      // Calculate total duration dynamically
      const totalDuration = introDuration + 
        (props.questions.length * (questionDuration + timerDuration + answerDuration)) + 
        outroDuration;

      console.log(`Rendering video with ${props.questions.length} questions, total duration: ${totalDuration}s`);
      console.log(`Background images available: ${props.backgroundImages.length}`);

      // Build FFmpeg inputs - ALL background images and all audio files
      const inputs: string[] = [];
      
      // Add all background images as inputs
      props.backgroundImages.forEach((bgPath, index) => {
        inputs.push('-loop', '1', '-i', bgPath); // [0], [1], [2], etc.
        console.log(`Background ${index}: ${bgPath}`);
      });
      
      let audioInputIndex = props.backgroundImages.length;
      
      // Add all audio files as inputs
      if (props.audioFiles.intro) {
        inputs.push('-i', props.audioFiles.intro);
        audioInputIndex++;
      }
      
      props.audioFiles.questions.forEach(audioPath => {
        inputs.push('-i', audioPath);
        audioInputIndex++;
      });
      
      props.audioFiles.answers.forEach(audioPath => {
        inputs.push('-i', audioPath);
        audioInputIndex++;
      });
      
      if (props.audioFiles.outro) {
        inputs.push('-i', props.audioFiles.outro);
      }

      // Build simplified filter_complex with time-based background switching
      const filterParts: string[] = [];
      
      // Scale all background images to consistent format
      props.backgroundImages.forEach((_, index) => {
        filterParts.push(
          `[${index}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg${index}]`
        );
      });

      // Create base video with time-based background switching using simple approach
      let currentTime = 0;
      
      // Start with first background as base
      let baseVideo = '[bg0]';
      
      // Calculate timing for overlays
      currentTime += introDuration; // After intro (5s)
      
      // For each question, overlay its background during its time period
      props.questions.forEach((question, qIndex) => {
        const questionBgIndex = qIndex + 1;
        const questionStart = currentTime;
        const questionEnd = currentTime + questionDuration + timerDuration + answerDuration; // 10s per question
        
        // Overlay question background during its time period
        const overlayFilter = `${baseVideo}[bg${questionBgIndex}]overlay=enable='between(t,${questionStart},${questionEnd})'[bg_with_q${qIndex + 1}]`;
        filterParts.push(overlayFilter);
        baseVideo = `[bg_with_q${qIndex + 1}]`;
        
        currentTime = questionEnd;
      });
      
      // No need to overlay outro since it uses bg0 which is already the base
      const finalBgVideo = baseVideo;

      // Create all text overlays with proper timing
      currentTime = 0;
      const textOverlays: string[] = [];

      // INTRO text overlays
      textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='NIE ZGADNIESZ ODPADASZ':fontcolor=#FFD700:fontsize=44:x=(w-text_w)/2:y=300:box=1:boxcolor=black@0.8:boxborderw=5:enable='between(t,${currentTime},${currentTime + introDuration})'`);
      textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='${props.topic.replace(/'/g, "\\'")}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=500:box=1:boxcolor=black@0.8:boxborderw=5:enable='between(t,${currentTime + 0.5},${currentTime + introDuration})'`);
      currentTime += introDuration;

      // QUESTION text overlays - dynamically for each question
      props.questions.forEach((question, qIndex) => {
        const questionNum = qIndex + 1;
        
        // Question display
        textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='PYTANIE ${questionNum}':fontcolor=#FFD700:fontsize=48:x=(w-text_w)/2:y=200:box=1:boxcolor=black@0.8:boxborderw=5:enable='between(t,${currentTime},${currentTime + questionDuration})'`);
        textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='${question.question.replace(/'/g, "\\'")}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=600:box=1:boxcolor=black@0.8:boxborderw=5:enable='between(t,${currentTime + 0.3},${currentTime + questionDuration})'`);
        currentTime += questionDuration;

        // Timer countdown
        textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='3':fontcolor=#FFD700:fontsize=128:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.9:boxborderw=10:enable='between(t,${currentTime},${currentTime + 1})'`);
        textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='2':fontcolor=#FFD700:fontsize=128:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.9:boxborderw=10:enable='between(t,${currentTime + 1},${currentTime + 2})'`);
        textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='1':fontcolor=#FFD700:fontsize=128:x=(w-text_w)/2:y=(h-text_h)/2:box=1:boxcolor=black@0.9:boxborderw=10:enable='between(t,${currentTime + 2},${currentTime + 3})'`);
        currentTime += timerDuration;

        // Answer reveal
        textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='ODPOWIEDZ TO':fontcolor=#00FF00:fontsize=48:x=(w-text_w)/2:y=300:box=1:boxcolor=black@0.8:boxborderw=5:enable='between(t,${currentTime},${currentTime + answerDuration})'`);
        textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='${question.answer.replace(/'/g, "\\'")}':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=600:box=1:boxcolor=black@0.8:boxborderw=5:enable='between(t,${currentTime + 0.5},${currentTime + answerDuration})'`);
        textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='✓':fontcolor=#00FF00:fontsize=96:x=(w-text_w)/2:y=900:enable='between(t,${currentTime + 1},${currentTime + answerDuration})'`);
        currentTime += answerDuration;
      });

      // OUTRO text overlays
      textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='I JAK CI POSZLO':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=400:box=1:boxcolor=black@0.7:boxborderw=5:enable='between(t,${currentTime},${currentTime + outroDuration})'`);
      textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='PODZIEL SIE WYNIKIEM':fontcolor=#FFD700:fontsize=44:x=(w-text_w)/2:y=600:box=1:boxcolor=black@0.7:boxborderw=5:enable='between(t,${currentTime + 1},${currentTime + outroDuration})'`);
      textOverlays.push(`drawtext=fontfile=/System/Library/Fonts/Arial.ttf:text='LIKE KOMENTARZ UDOSTEPNIJ':fontcolor=white:fontsize=32:x=(w-text_w)/2:y=1400:box=1:boxcolor=black@0.7:boxborderw=5:enable='between(t,${currentTime + 2},${currentTime + outroDuration})'`);

      // Apply all text overlays to the final background video
      const finalVideoFilter = `${finalBgVideo}${textOverlays.join(',')}[final_video]`;
      filterParts.push(finalVideoFilter);

      // Audio processing - concat all audio segments in proper sequence
      const audioSegments: string[] = [];
      let audioIndex = props.backgroundImages.length; // Start after background images
      
      // Intro audio
      if (props.audioFiles.intro) {
        filterParts.push(`[${audioIndex}:a]apad=pad_dur=${introDuration}[intro_audio]`);
        audioSegments.push('[intro_audio]');
        audioIndex++;
      } else {
        filterParts.push(`aevalsrc=0:d=${introDuration}[intro_audio]`);
        audioSegments.push('[intro_audio]');
      }
      
      // Question and answer audio segments
      props.questions.forEach((_, qIndex) => {
        // Question audio
        if (props.audioFiles.questions[qIndex]) {
          filterParts.push(`[${audioIndex}:a]apad=pad_dur=${questionDuration}[q${qIndex + 1}_audio]`);
          audioSegments.push(`[q${qIndex + 1}_audio]`);
          audioIndex++;
        } else {
          filterParts.push(`aevalsrc=0:d=${questionDuration}[q${qIndex + 1}_audio]`);
          audioSegments.push(`[q${qIndex + 1}_audio]`);
        }
        
        // Timer silence
        filterParts.push(`aevalsrc=0:d=${timerDuration}[timer${qIndex + 1}_audio]`);
        audioSegments.push(`[timer${qIndex + 1}_audio]`);
        
        // Answer audio
        if (props.audioFiles.answers[qIndex]) {
          filterParts.push(`[${audioIndex}:a]apad=pad_dur=${answerDuration}[a${qIndex + 1}_audio]`);
          audioSegments.push(`[a${qIndex + 1}_audio]`);
          audioIndex++;
        } else {
          filterParts.push(`aevalsrc=0:d=${answerDuration}[a${qIndex + 1}_audio]`);
          audioSegments.push(`[a${qIndex + 1}_audio]`);
        }
      });
      
      // Outro audio
      if (props.audioFiles.outro) {
        filterParts.push(`[${audioIndex}:a]apad=pad_dur=${outroDuration}[outro_audio]`);
        audioSegments.push('[outro_audio]');
      } else {
        filterParts.push(`aevalsrc=0:d=${outroDuration}[outro_audio]`);
        audioSegments.push('[outro_audio]');
      }
      
      // Concatenate all audio segments
      filterParts.push(`${audioSegments.join('')}concat=n=${audioSegments.length}:v=0:a=1[final_audio]`);

      // Build final FFmpeg arguments
      const ffmpegArgs = [
        ...inputs,
        '-filter_complex', filterParts.join(';'),
        '-map', '[final_video]',
        '-map', '[final_audio]',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-r', '25',
        '-t', totalDuration.toString(),
        '-movflags', '+faststart',
        '-y',
        outputPath
      ];

      console.log(`FFmpeg rendering with overlay-based background switching:`);
      console.log(`- ${props.questions.length} questions, ${props.backgroundImages.length} backgrounds`);
      console.log(`- Text overlays: ${textOverlays.length}, Filter parts: ${filterParts.length}`);

      const ffmpeg = spawn(ffmpegStatic, ffmpegArgs);
      
      let errorOutput = '';

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        errorOutput += output;
        // Only log meaningful progress lines
        if (output.includes('time=') && output.includes('fps=')) {
          const match = output.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
          if (match) {
            console.log(`FFmpeg progress: ${match[1]} / ${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, '0')}`);
          }
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Video with overlay-based background switching created successfully: ${outputPath}`);
          console.log(`📊 Final specs: ${totalDuration}s, ${props.questions.length} questions, ${props.backgroundImages.length} backgrounds`);
          resolve();
        } else {
          console.error('❌ FFmpeg error output:', errorOutput);
          console.error('❌ FFmpeg command that failed:');
          console.error(ffmpegStatic, ffmpegArgs.join(' '));
          reject(new Error(`FFmpeg failed with exit code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });
    });
  }

  /**
   * Validate that all required assets exist
   */
  private async validateAssets(props: VideoCompositionProps): Promise<void> {
    // Check background images
    for (const imagePath of props.backgroundImages) {
      try {
        await fs.access(imagePath);
      } catch {
        throw new Error(`Background image not found: ${imagePath}`);
      }
    }

    // Check audio files
    if (props.audioFiles.intro) {
      try {
        await fs.access(props.audioFiles.intro);
      } catch {
        throw new Error(`Intro audio not found: ${props.audioFiles.intro}`);
      }
    }

    for (const audioPath of props.audioFiles.questions) {
      try {
        await fs.access(audioPath);
      } catch {
        throw new Error(`Question audio not found: ${audioPath}`);
      }
    }

    for (const audioPath of props.audioFiles.answers) {
      try {
        await fs.access(audioPath);
      } catch {
        throw new Error(`Answer audio not found: ${audioPath}`);
      }
    }

    if (props.audioFiles.outro) {
      try {
        await fs.access(props.audioFiles.outro);
      } catch {
        throw new Error(`Outro audio not found: ${props.audioFiles.outro}`);
      }
    }
  }

  /**
   * Calculate total video duration in seconds
   */
  private calculateVideoDuration(questionCount: number): number {
    const INTRO_DURATION = 5; // seconds
    const QUESTION_DURATION = 3; // seconds per question
    const TIMER_DURATION = 3; // seconds per timer
    const ANSWER_DURATION = 4; // seconds per answer
    const OUTRO_DURATION = 6; // seconds

    return INTRO_DURATION + 
      (questionCount * (QUESTION_DURATION + TIMER_DURATION + ANSWER_DURATION)) + 
      OUTRO_DURATION;
  }
} 