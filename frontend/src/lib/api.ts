import type { VideoGenerationRequest, VideoGenerationResponse } from '@/types';

const API_BASE_URL = 'http://localhost:3000';

export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}

export const apiClient = {
  async generateVideo(data: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new APIError(response.status, `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(0, 'Network error or server unavailable');
    }
  },

  async getVideoStatus(videoId: string): Promise<VideoGenerationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/video-status/${videoId}`);
      
      if (!response.ok) {
        throw new APIError(response.status, `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(0, 'Network error or server unavailable');
    }
  },

  getVideoDownloadUrl(videoId: string): string {
    return `${API_BASE_URL}/api/download-video/${videoId}`;
  },

  getVideoStreamUrl(videoId: string): string {
    return `${API_BASE_URL}/api/stream-video/${videoId}`;
  }
}; 