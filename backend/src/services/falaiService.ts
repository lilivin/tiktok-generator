import axios, { AxiosResponse } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { FalAIImageResponse } from '../types';

export class FalAIService {
  private apiKey: string;
  private baseUrl = 'https://fal.run/fal-ai/ideogram/v3';
  
  constructor() {
    this.apiKey = process.env.FAL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('FAL_API_KEY environment variable is required');
    }
  }

  /**
   * Generate background image for intro scene based on quiz topic
   */
  async generateIntroBackground(topic: string, outputDir: string): Promise<string> {
    const prompt = this.createIntroPrompt(topic);
    return this.generateAndSaveImage(prompt, outputDir, 'intro-bg');
  }

  /**
   * Generate background image for question scene
   */
  async generateQuestionBackground(question: string, index: number, outputDir: string): Promise<string> {
    const prompt = this.createQuestionPrompt(question);
    return this.generateAndSaveImage(prompt, outputDir, `question-${index + 1}-bg`);
  }

  /**
   * Create optimized prompt for intro background
   */
  private createIntroPrompt(topic: string): string {
    return `Create a dynamic, colorful, modern social media background for a quiz about "${topic}". 
    The image should be vibrant, engaging, and suitable for TikTok/Instagram. 
    Use bold colors, gradients, and abstract elements that relate to the topic. 
    The style should be contemporary, energetic, and attention-grabbing.
    Vertical format 9:16 aspect ratio. High quality, professional look.
    Avoid text, focus on visual elements only.`;
  }

  /**
   * Create optimized prompt for question background
   */
  private createQuestionPrompt(question: string): string {
    // Extract key topic from question for better context
    const keywords = this.extractKeywords(question);
    
    return `Create a modern, dynamic background image related to "${keywords}". 
    The background should be suitable for social media quiz content (TikTok/Instagram style).
    Use vibrant colors, modern design elements, subtle patterns or gradients.
    The image should complement the question without being distracting.
    Vertical format 9:16 aspect ratio. High quality, contemporary look.
    Avoid text, people, or specific objects - focus on abstract/thematic elements.`;
  }

  /**
   * Extract keywords from question for better context
   */
  private extractKeywords(question: string): string {
    // Simple keyword extraction - remove common words
    const commonWords = ['co', 'jak', 'ile', 'gdzie', 'kiedy', 'który', 'która', 'które', 'czy', 'jakie', 'jaki', 'jaką'];
    const words = question.toLowerCase().split(/\s+/);
    const keywords = words.filter(word => 
      word.length > 3 && 
      !commonWords.includes(word) &&
      !/^[0-9]+$/.test(word)
    );
    
    return keywords.slice(0, 3).join(' ') || 'quiz question';
  }

  /**
   * Generate image via Fal.ai Ideogram v3 API and save to disk
   */
  private async generateAndSaveImage(prompt: string, outputDir: string, filename: string): Promise<string> {
    try {
      console.log(`Generating image for: ${filename}`);
      
      const response: AxiosResponse<FalAIImageResponse> = await axios.post(
        this.baseUrl,
        {
          prompt,
          image_size: "portrait_16_9", // 9:16 aspect ratio for social media (portrait format)
          num_images: 1,
          expand_prompt: true, // Use MagicPrompt for better results
          rendering_speed: "BALANCED", // Balance between speed and quality
          style: "DESIGN" // Optimized for design/graphics content
        },
        {
          headers: {
            'Authorization': `Key ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      if (!response.data.images || response.data.images.length === 0) {
        throw new Error('No images generated from Fal.ai');
      }

      const firstImage = response.data.images[0];
      if (!firstImage?.url) {
        throw new Error('Invalid image response from Fal.ai');
      }

      const imageUrl = firstImage.url;
      
      // Download and save image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
      });

      const outputPath = path.join(outputDir, `${filename}.jpg`);
      
      // Process image with Sharp to ensure correct format and optimize
      await sharp(Buffer.from(imageResponse.data))
        .jpeg({ quality: 85 })
        .resize(1080, 1920, { // Ensure exact 1080x1920 resolution
          fit: 'cover',
          position: 'center'
        })
        .toFile(outputPath);

      console.log(`Image saved: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error(`Error generating image for ${filename}:`, error);
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        
        // Handle specific Ideogram API errors
        let message = 'Unknown API error';
        if (errorData?.detail && Array.isArray(errorData.detail)) {
          message = errorData.detail.map((err: any) => err.msg || err).join(', ');
        } else if (errorData?.detail) {
          message = errorData.detail;
        } else if (error.message) {
          message = error.message;
        }
        
        throw new Error(`Ideogram v3 API error (${status}): ${message}`);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Image generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate all background images for a video job
   */
  async generateAllBackgrounds(topic: string, questions: string[], outputDir: string): Promise<string[]> {
    const backgroundPaths: string[] = [];
    
    try {
      // Generate intro background
      const introbg = await this.generateIntroBackground(topic, outputDir);
      backgroundPaths.push(introbg);

      // Generate background for each question
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question) {
          throw new Error(`Question at index ${i} is undefined`);
        }
        const questionBg = await this.generateQuestionBackground(question, i, outputDir);
        backgroundPaths.push(questionBg);
      }

      return backgroundPaths;

    } catch (error) {
      // Cleanup any partially generated images
      for (const bgPath of backgroundPaths) {
        try {
          await fs.unlink(bgPath);
        } catch (cleanupError) {
          const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : 'Unknown cleanup error';
          console.warn(`Failed to cleanup image: ${bgPath}`, cleanupMessage);
        }
      }
      throw error;
    }
  }
} 