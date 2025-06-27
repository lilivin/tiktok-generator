import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const fastify = Fastify({
  logger: true
});

// Register CORS plugin
fastify.register(cors, {
  origin: ['http://localhost:4321', 'http://127.0.0.1:4321'],
  credentials: true
});

// Hello World route
fastify.get('/', async (request, reply) => {
  return {
    message: 'Hello World! 🚀',
    service: 'Backend - Node.js z Fastify',
    stack: 'TypeScript + Fastify',
    timestamp: new Date().toISOString()
  };
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return {
    status: 'OK',
    service: 'Video Generator Backend',
    timestamp: new Date().toISOString()
  };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.BACKEND_PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Backend server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 