import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis';
import { db } from '../lib/db';
import { getFromS3, uploadToS3 } from '../lib/s3';
import { getAIService } from '../services/ai';
import { getUpScaler } from '../services/upscale';
import { ImageProcessingJob } from '../lib/queue';

const connection = redis;

async function processImageJob(job: Job<ImageProcessingJob>) {
  const { imageId, jobId, steps } = job.data;

  console.log(`Processing job ${jobId} for image ${imageId}`);
  console.log(`Steps: ${steps.join(' → ')}`);

  try {
    // Update job status
    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    // Get image record
    const image = await db.image.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Download original image
    let currentBuffer = await downloadImage(image.originalUrl);
    const results: Record<string, any> = {};

    // Execute each step
    for (const step of steps) {
      console.log(`Executing step: ${step}`);

      await db.job.update({
        where: { id: jobId },
        data: { currentStep: step },
      });

      switch (step) {
        case 'ENHANCE':
          currentBuffer = await enhanceStep(currentBuffer);
          results.enhance = { completed: true };
          break;

        case 'RERENDER':
          currentBuffer = await rerenderStep(currentBuffer);
          results.rerender = { completed: true };
          break;

        case 'UPSCALE':
          currentBuffer = await upscaleStep(currentBuffer);
          results.upscale = { completed: true };
          break;
      }
    }

    // Upload final result
    const finalKey = `processed/${imageId}/${Date.now()}-final.png`;
    const finalUrl = await uploadToS3(finalKey, currentBuffer, 'image/png');

    // Update image with processed URL
    await db.image.update({
      where: { id: imageId },
      data: { processedUrl: finalUrl },
    });

    // Update job as completed
    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        result: results,
      },
    });

    console.log(`Job ${jobId} completed successfully`);
  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error);

    // Update job as failed
    await db.job.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

async function downloadImage(url: string): Promise<Buffer> {
  // If it's an S3 key, fetch from S3
  if (url.includes('s3.amazonaws.com') || url.startsWith('uploads/')) {
    const key = url.split('/').slice(-3).join('/');
    return await getFromS3(key);
  }

  // Otherwise fetch from URL
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function enhanceStep(buffer: Buffer): Promise<Buffer> {
  const aiService = getAIService('openai');
  return await aiService.enhanceImage(buffer);
}

async function rerenderStep(buffer: Buffer): Promise<Buffer> {
  const aiService = getAIService('openai');
  const prompt = 'Create a high-quality, enhanced version of this image';
  return await aiService.rerenderImage(buffer, prompt);
}

async function upscaleStep(buffer: Buffer): Promise<Buffer> {
  const upscaler = getUpScaler('dummy');
  return await upscaler.upscale(buffer, 2);
}

// Create the worker
const worker = new Worker('image-processing', processImageJob, {
  connection,
  concurrency: 2,
  limiter: {
    max: 10,
    duration: 60000, // 10 jobs per minute
  },
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

console.log('Image processing worker started');

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing worker...');
  await worker.close();
  process.exit(0);
});
