import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

import { videoGenerationRequestSchema } from './validation';
import { VideoService } from './services/videoService';
import type { VideoGenerationResponse } from './types';

// Load environment variables
dotenv.config({ path: '../.env' });

const fastify = Fastify({
  logger: true
});

// Register plugins
fastify.register(cors, {
  origin: ['http://localhost:4321', 'http://127.0.0.1:4321'],
  credentials: true
});

// Get VideoService instance
const videoService = VideoService.getInstance();

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'OK',
    service: 'Video Generator Backend',
    timestamp: new Date().toISOString()
  };
});

// Serve assets for Remotion rendering
fastify.get<{
  Params: { jobId: string; filename: string };
}>('/assets/:jobId/:filename', async (request, reply) => {
  try {
    const { jobId, filename } = request.params;
    
    // Construct file path
    const filePath = path.join(process.cwd(), 'generated-videos', `job-${jobId}`, filename);
    
    // Check if file exists and is within the generated-videos directory (security)
    const normalizedFilePath = path.normalize(filePath);
    const baseDir = path.join(process.cwd(), 'generated-videos');
    
    if (!normalizedFilePath.startsWith(baseDir)) {
      reply.status(403);
      return { error: 'Access denied' };
    }

    try {
      await fs.access(normalizedFilePath);
    } catch {
      reply.status(404);
      return { error: 'File not found' };
    }

    // Set appropriate headers based on file extension
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.mp3') {
      reply.header('Content-Type', 'audio/mpeg');
    } else if (ext === '.jpg' || ext === '.jpeg') {
      reply.header('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      reply.header('Content-Type', 'image/png');
    }

    // Stream the file
    const stream = await fs.open(normalizedFilePath, 'r');
    return reply.send(stream.createReadStream());

  } catch (error) {
    fastify.log.error('Error serving asset:', error);
    reply.status(500);
    return { error: 'Internal server error' };
  }
});

// Generate video endpoint
fastify.post<{
  Body: unknown;
}>('/api/generate-video', async (request, reply) => {
  try {
    // Validate request body
    const validation = videoGenerationRequestSchema.safeParse(request.body);
    
    if (!validation.success) {
      reply.status(400);
      return {
        success: false,
        message: 'Dane wejściowe są nieprawidłowe',
        error: validation.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
      } as VideoGenerationResponse;
    }

    const requestData = validation.data;

    // Create video generation job
    const videoId = await videoService.createVideoJob(requestData);

    fastify.log.info(`Created video generation job: ${videoId}`);

    return {
      success: true,
      message: 'Zadanie generowania wideo zostało utworzone',
      videoId
    } as VideoGenerationResponse;

  } catch (error) {
    fastify.log.error('Error in generate-video endpoint:', error);
    
    reply.status(500);
    return {
      success: false,
      message: 'Wystąpił wewnętrzny błąd serwera',
      error: 'Internal server error'
    } as VideoGenerationResponse;
  }
});

// Get video status endpoint
fastify.get<{
  Params: { videoId: string };
}>('/api/video-status/:videoId', async (request, reply) => {
  try {
    const { videoId } = request.params;

    if (!videoId) {
      reply.status(400);
      return {
        success: false,
        message: 'ID wideo jest wymagane',
        error: 'Missing video ID'
      } as VideoGenerationResponse;
    }

    const job = await videoService.getVideoJob(videoId);

    if (!job) {
      reply.status(404);
      return {
        success: false,
        message: 'Nie znaleziono zadania generowania wideo',
        error: 'Video job not found'
      } as VideoGenerationResponse;
    }

    // Return status based on job status
    switch (job.status) {
      case 'pending':
      case 'processing':
        return {
          success: true,
          message: job.currentStep || 'Przetwarzanie...',
        } as VideoGenerationResponse;

      case 'completed':
        return {
          success: true,
          message: 'Wideo zostało pomyślnie wygenerowane',
          videoId: videoId
        } as VideoGenerationResponse;

      case 'failed':
        return {
          success: false,
          message: 'Błąd podczas generowania wideo',
          error: job.error || 'Unknown error'
        } as VideoGenerationResponse;

      default:
        reply.status(500);
        return {
          success: false,
          message: 'Nieznany status zadania',
          error: 'Unknown job status'
        } as VideoGenerationResponse;
    }

  } catch (error) {
    fastify.log.error('Error in video-status endpoint:', error);
    
    reply.status(500);
    return {
      success: false,
      message: 'Wystąpił wewnętrzny błąd serwera',
      error: 'Internal server error'
    } as VideoGenerationResponse;
  }
});

// Download video endpoint
fastify.get<{
  Params: { videoId: string };
}>('/api/download-video/:videoId', async (request, reply) => {
  try {
    const { videoId } = request.params;

    if (!videoId) {
      reply.status(400);
      return { error: 'Missing video ID' };
    }

    const job = await videoService.getVideoJob(videoId);

    if (!job) {
      reply.status(404);
      return { error: 'Video job not found' };
    }

    if (job.status !== 'completed' || !job.filePath) {
      reply.status(400);
      return { error: 'Video is not ready for download' };
    }

    // Check if file exists
    try {
      await fs.access(job.filePath);
    } catch {
      reply.status(404);
      return { error: 'Video file not found' };
    }

    // Set appropriate headers for video download
    reply.header('Content-Type', 'video/mp4');
    reply.header('Content-Disposition', `attachment; filename="quiz-${videoId}.mp4"`);

    // Stream the file
    const stream = await fs.open(job.filePath, 'r');
    return reply.send(stream.createReadStream());

  } catch (error) {
    fastify.log.error('Error in download-video endpoint:', error);
    
    reply.status(500);
    return { error: 'Internal server error' };
  }
});

// Stream video endpoint for in-browser playback
fastify.get<{
  Params: { videoId: string };
}>('/api/stream-video/:videoId', async (request, reply) => {
  try {
    const { videoId } = request.params;

    if (!videoId) {
      reply.status(400);
      return { error: 'Missing video ID' };
    }

    const job = await videoService.getVideoJob(videoId);

    if (!job) {
      reply.status(404);
      return { error: 'Video job not found' };
    }

    if (job.status !== 'completed' || !job.filePath) {
      reply.status(400);
      return { error: 'Video is not ready for streaming' };
    }

    // Check if file exists
    try {
      await fs.access(job.filePath);
    } catch {
      reply.status(404);
      return { error: 'Video file not found' };
    }

    // Get file stats for proper range handling
    const stat = await fs.stat(job.filePath);
    const fileSize = stat.size;
    const range = request.headers.range;

    if (range) {
      // Handle range requests for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      reply.status(206);
      reply.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Content-Length', chunksize.toString());
      reply.header('Content-Type', 'video/mp4');

      const stream = await fs.open(job.filePath, 'r');
      return reply.send(stream.createReadStream({ start, end }));
    } else {
      // No range request, send entire file
      reply.header('Content-Length', fileSize.toString());
      reply.header('Content-Type', 'video/mp4');
      reply.header('Accept-Ranges', 'bytes');

      const stream = await fs.open(job.filePath, 'r');
      return reply.send(stream.createReadStream());
    }

  } catch (error) {
    fastify.log.error('Error in stream-video endpoint:', error);
    
    reply.status(500);
    return { error: 'Internal server error' };
  }
});

// Root endpoint with API info
fastify.get('/', async (request, reply) => {
  return {
    message: 'Video Generator API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      generateVideo: 'POST /api/generate-video',
      videoStatus: 'GET /api/video-status/:videoId',
      downloadVideo: 'GET /api/download-video/:videoId',
      streamVideo: 'GET /api/stream-video/:videoId'
    },
    timestamp: new Date().toISOString()
  };
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  if (error.validation) {
    reply.status(400).send({
      success: false,
      message: 'Błąd walidacji danych',
      error: error.message
    });
  } else {
    reply.status(500).send({
      success: false,
      message: 'Wewnętrzny błąd serwera',
      error: 'Internal server error'
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.BACKEND_PORT) || 3000;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
    
    await fastify.listen({ port, host });
    
    console.log(`🚀 Backend server running on http://${host}:${port}`);
    console.log(`📁 Generated videos will be stored in: ${path.join(process.cwd(), 'generated-videos')}`);
    
    // Schedule cleanup of old jobs every hour
    setInterval(() => {
      videoService.cleanupOldJobs(24).catch(error => {
        console.error('Error during cleanup:', error);
      });
    }, 60 * 60 * 1000); // Every hour
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 