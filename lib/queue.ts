import { Queue } from 'bullmq';
import { redis } from './redis';

export type ImageProcessingJob = {
  imageId: string;
  jobId: string;
  steps: ('ENHANCE' | 'RERENDER' | 'UPSCALE')[];
};

const connection = redis;

export const imageProcessingQueue = new Queue<ImageProcessingJob>(
  'image-processing',
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: {
        count: 100,
        age: 60 * 60 * 24, // 24 hours
      },
      removeOnFail: {
        count: 1000,
      },
    },
  }
);

export const addImageProcessingJob = async (data: ImageProcessingJob) => {
  return await imageProcessingQueue.add('process-image', data, {
    jobId: data.jobId,
  });
};
