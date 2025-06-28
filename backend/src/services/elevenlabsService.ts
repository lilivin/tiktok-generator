import axios, { AxiosResponse } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { ElevenLabsVoiceResponse, Question } from '../types';

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private voiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam - English voice (replace with Polish voice ID)
  
  constructor() {
    this.apiKey = process.env.ELEVENLABS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }
  }

  /**
   * Generate audio for intro text
   */
  async generateIntroAudio(topic: string, outputDir: string): Promise<string> {
    const text = `Nie zgadniesz, odpadasz - ${topic}`;
    return this.generateAndSaveAudio(text, outputDir, 'intro');
  }

  /**
   * Generate audio for outro text
   */
  async generateOutroAudio(outputDir: string): Promise<string> {
    const text = "I jak Ci poszło? Podziel się swoim wynikiem w komentarzu";
    return this.generateAndSaveAudio(text, outputDir, 'outro');
  }

  /**
   * Generate audio for a question
   */
  async generateQuestionAudio(question: string, index: number, outputDir: string): Promise<string> {
    return this.generateAndSaveAudio(question, outputDir, `question-${index + 1}`);
  }

  /**
   * Generate audio for an answer
   */
  async generateAnswerAudio(answer: string, index: number, outputDir: string): Promise<string> {
    const text = `Odpowiedź to: ${answer}`;
    return this.generateAndSaveAudio(text, outputDir, `answer-${index + 1}`);
  }

  /**
   * Generate audio via ElevenLabs API and save to disk
   */
  private async generateAndSaveAudio(text: string, outputDir: string, filename: string): Promise<string> {
    try {
      console.log(`Generating audio for: ${filename}`);
      
      const response: AxiosResponse<ArrayBuffer> = await axios.post(
        `${this.baseUrl}/text-to-speech/${this.voiceId}`,
        {
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.3, // Slightly expressive
            use_speaker_boost: true
          }
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
   * Generate all audio files for a video job
   */
  async generateAllAudio(topic: string, questions: Question[], outputDir: string): Promise<{
    intro?: string;
    questions: string[];
    answers: string[];
    outro?: string;
  }> {
    const audioFiles: string[] = [];
    
    try {
      // Generate intro audio
      const introAudio = await this.generateIntroAudio(topic, outputDir);
      audioFiles.push(introAudio);

      // Generate question and answer audio
      const questionAudios: string[] = [];
      const answerAudios: string[] = [];

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question) {
          throw new Error(`Question at index ${i} is undefined`);
        }

        const questionAudio = await this.generateQuestionAudio(question.question, i, outputDir);
        questionAudios.push(questionAudio);
        audioFiles.push(questionAudio);

        const answerAudio = await this.generateAnswerAudio(question.answer, i, outputDir);
        answerAudios.push(answerAudio);
        audioFiles.push(answerAudio);
      }

      // Generate outro audio
      const outroAudio = await this.generateOutroAudio(outputDir);
      audioFiles.push(outroAudio);

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
   * Calculate estimated duration of audio text (rough estimate)
   */
  calculateAudioDuration(text: string): number {
    // Rough estimate: ~150 words per minute for Polish speech
    const wordsPerMinute = 150;
    const words = text.split(/\s+/).length;
    const minutes = words / wordsPerMinute;
    return Math.max(1, Math.ceil(minutes * 60)); // At least 1 second
  }
} 