import axios, { AxiosResponse } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ElevenLabsVoiceResponse, Question } from '../types';

const execAsync = promisify(exec);

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  // Polish voice IDs - you may need to verify these or use your own
  private voiceId = 'kPzsL2i3teMYv0FxEYQ6'; // Polish female voice or replace with preferred Polish voice
  
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }
  }

  /**
   * Preprocess text to make it more natural for TTS
   */
  private preprocessText(text: string, contentType?: string): string {
    let processedText = text.trim();
    
    // Special preprocessing for intro - more energetic and friendly
    if (contentType === 'intro') {
      // Add enthusiasm markers and better pacing for intro
      processedText = processedText.replace(/!/g, '! '); // Add space after exclamation for better pacing
      processedText = processedText.replace(/-/g, ' - '); // Add spaces around dash
      
      // Ensure energetic delivery with proper punctuation
      if (!processedText.match(/[!]$/)) {
        processedText += '!';
      }
      
      return processedText;
    }
    
    // Default preprocessing for other content
    // Add natural pauses for slower, more natural delivery
    processedText = processedText.replace(/\./g, '... ');
    processedText = processedText.replace(/,/g, ', ');
    processedText = processedText.replace(/:/g, ': ');
    processedText = processedText.replace(/-/g, ' - ');
    
    // Add extra pauses around key phrases
    processedText = processedText.replace(/odpowiedź/gi, 'odpowiedź... ');
    processedText = processedText.replace(/pytanie/gi, 'pytanie... ');
    
    // Ensure text ends with proper punctuation for natural intonation
    if (!processedText.match(/[.!?…]$/)) {
      processedText += '.';
    }
    
    // For very short texts, add breathing room
    if (processedText.split(/\s+/).length <= 3) {
      processedText = processedText.replace(/\s+/g, '  '); // Double spaces for slower delivery
    }
    
    return processedText;
  }

  /**
   * Get improved voice settings based on text length and content
   */
  private getVoiceSettings(text: string, contentType?: string) {
    const wordCount = text.split(/\s+/).length;
    const isShort = wordCount <= 3;
    
    // Special settings for intro - more energetic but friendly
    if (contentType === 'intro') {
      return {
        stability: 0.65, // Lower stability for more expression and energy
        similarity_boost: 0.85, 
        style: 0.55, // Higher style for more energy and enthusiasm
        use_speaker_boost: true,
        optimize_streaming_latency: 0
      };
    }
    
    // Default settings for other content
    return {
      stability: 0.8, // Higher stability for more consistent, calmer delivery
      similarity_boost: 0.85, // Slightly lower for more natural variation
      style: 0.1, // Much lower style for less dramatic, slower delivery
      use_speaker_boost: true,
      // Additional settings for better quality and slower pace
      optimize_streaming_latency: 0 // Better quality over speed
    };
  }

  /**
   * Get actual duration of an audio file using ffprobe
   */
  private async getAudioDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${filePath}"`
      );
      const duration = parseFloat(stdout.trim());
      return duration; // Return exact duration without rounding
    } catch (error) {
      console.warn(`Could not get audio duration for ${filePath}, using estimate`);
      // Fallback to text-based estimation
      const filename = path.basename(filePath, '.mp3');
      if (filename.includes('intro')) {
        return this.calculateAudioDuration(`Nie zgadniesz, odpadasz`);
      } else if (filename.includes('outro')) {
        return this.calculateAudioDuration("I jak Ci poszło? Podziel się swoim wynikiem w komentarzu");
      }
      return 3; // Default fallback
    }
  }

  /**
   * Generate audio for intro text
   */
  async generateIntroAudio(topic: string, outputDir: string): Promise<{ path: string; duration: number }> {
    const text = `Nie zgadniesz, odpadasz! - ${topic}`;
    const audioPath = await this.generateAndSaveAudio(text, outputDir, 'intro');
    const duration = await this.getAudioDuration(audioPath);
    return { path: audioPath, duration };
  }

  /**
   * Generate audio for outro text
   */
  async generateOutroAudio(outputDir: string): Promise<{ path: string; duration: number }> {
    const text = "I jak Ci poszło? Podziel się swoim wynikiem w komentarzu";
    const audioPath = await this.generateAndSaveAudio(text, outputDir, 'outro');
    const duration = await this.getAudioDuration(audioPath);
    return { path: audioPath, duration };
  }

  /**
   * Generate audio for a question
   */
  async generateQuestionAudio(question: string, index: number, outputDir: string): Promise<{ path: string; duration: number }> {
    const audioPath = await this.generateAndSaveAudio(question, outputDir, `question-${index + 1}`);
    const duration = await this.getAudioDuration(audioPath);
    return { path: audioPath, duration };
  }

  /**
   * Generate audio for an answer
   */
  async generateAnswerAudio(answer: string, index: number, outputDir: string): Promise<{ path: string; duration: number }> {
    // Improve context for answers, especially short ones
    let text: string;
    const wordCount = answer.trim().split(/\s+/).length;
    
    if (wordCount === 1) {
      // For single words, add more context with random variations
      const singleWordVariations = [
        `Prawidłowa odpowiedź to: ${answer}. Zgadłeś?`,
        `To jest: ${answer}. Miałeś rację?`,
        `Poprawnie, to: ${answer}. Wiedziałeś?`,
        `Tak, to ${answer}. Dobra odpowiedź!`,
        `Oczywiście, to ${answer}. Łatwe, prawda?`,
        `Dokładnie: ${answer}. Czy to było trudne?`
      ];
      text = singleWordVariations[Math.floor(Math.random() * singleWordVariations.length)];
    } else if (wordCount <= 3) {
      // For short phrases, add some context with variations
      const shortPhraseVariations = [
        `Odpowiedź brzmi: ${answer}.`,
        `To jest: ${answer}.`,
        `Prawidłowo: ${answer}.`,
        `Tak, to ${answer}.`,
        `Oczywiście: ${answer}.`,
        `Dokładnie: ${answer}.`,
        `Właśnie tak: ${answer}.`
      ];
      text = shortPhraseVariations[Math.floor(Math.random() * shortPhraseVariations.length)];
    } else {
      // For longer answers, use standard format with variations
      const longAnswerVariations = [
        `Odpowiedź to: ${answer}`,
        `Prawidłowa odpowiedź: ${answer}`,
        `To brzmi tak: ${answer}`,
        `Właściwa odpowiedź: ${answer}`,
        `Poprawnie: ${answer}`,
        `Tak to wygląda: ${answer}`
      ];
      text = longAnswerVariations[Math.floor(Math.random() * longAnswerVariations.length)];
    }
    
    const audioPath = await this.generateAndSaveAudio(text, outputDir, `answer-${index + 1}`);
    const duration = await this.getAudioDuration(audioPath);
    return { path: audioPath, duration };
  }

  /**
   * Generate audio via ElevenLabs API and save to disk
   */
  private async generateAndSaveAudio(text: string, outputDir: string, filename: string): Promise<string> {
    try {
      console.log(`Generating audio for: ${filename}`);
      
      const processedText = this.preprocessText(text, filename.includes('intro') ? 'intro' : undefined);
      const voiceSettings = this.getVoiceSettings(processedText, filename.includes('intro') ? 'intro' : undefined);
      
      console.log(`Processed text: "${processedText}"`);
      
      const response: AxiosResponse<ArrayBuffer> = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          text: processedText,
          model_id: "eleven_multilingual_v2", // Consider upgrading to "eleven_turbo_v2" if available
          voice_settings: voiceSettings
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );

      const outputPath = path.join(outputDir, `${filename}.mp3`);
      await fs.writeFile(outputPath, Buffer.from(response.data));

      console.log(`Audio saved: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error(`Error generating audio for ${filename}:`, error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.detail || error.message;
        throw new Error(`ElevenLabs API error (${status}): ${message}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Audio generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate all audio files for a video job with durations
   */
  async generateAllAudio(topic: string, questions: Question[], outputDir: string): Promise<{
    intro?: { path: string; duration: number };
    questions: { path: string; duration: number }[];
    answers: { path: string; duration: number }[];
    outro?: { path: string; duration: number };
  }> {
    const audioFiles: string[] = [];
    
    try {
      // Generate intro audio
      const introAudio = await this.generateIntroAudio(topic, outputDir);
      audioFiles.push(introAudio.path);

      // Generate question and answer audio
      const questionAudios: { path: string; duration: number }[] = [];
      const answerAudios: { path: string; duration: number }[] = [];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question) {
          throw new Error(`Question at index ${i} is undefined`);
        }

        const questionAudio = await this.generateQuestionAudio(question.question, i, outputDir);
        questionAudios.push(questionAudio);
        audioFiles.push(questionAudio.path);

        const answerAudio = await this.generateAnswerAudio(question.answer, i, outputDir);
        answerAudios.push(answerAudio);
        audioFiles.push(answerAudio.path);
      }

      // Generate outro audio
      const outroAudio = await this.generateOutroAudio(outputDir);
      audioFiles.push(outroAudio.path);

      return {
        intro: introAudio,
        questions: questionAudios,
        answers: answerAudios,
        outro: outroAudio,
      };

    } catch (error) {
      // Cleanup any partially generated audio files
      for (const audioPath of audioFiles) {
        try {
          await fs.unlink(audioPath);
        } catch (cleanupError) {
          const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error';
          console.warn(`Failed to cleanup audio: ${audioPath}`, cleanupMessage);
        }
      }
      throw error;
    }
  }

  /**
   * Calculate estimated duration of audio text (exact estimate without rounding)
   */
  calculateAudioDuration(text: string): number {
    // Rough estimate: ~150 words per minute for Polish speech
    const wordsPerMinute = 150;
    const words = text.split(/\s+/).length;
    const minutes = words / wordsPerMinute;
    return minutes * 60; // Return exact calculated duration without rounding
  }
} 