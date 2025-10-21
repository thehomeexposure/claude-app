import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { addImageProcessingJob } from '@/lib/queue';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    const body = await req.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    // Get the failed job
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'FAILED') {
      return NextResponse.json(
        { error: 'Can only retry failed jobs' },
        { status: 400 }
      );
    }

    // Update job status
    const updatedJob = await db.job.update({
      where: { id: jobId },
      data: {
        status: 'RETRYING',
        retryCount: job.retryCount + 1,
        error: null,
      },
    });

    // Re-add to queue
    await addImageProcessingJob({
      imageId: job.imageId,
      jobId: job.id,
      steps: job.steps as ('ENHANCE' | 'RERENDER' | 'UPSCALE')[],
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error('Retry job error:', error);
    return NextResponse.json(
      { error: 'Failed to retry job' },
      { status: 500 }
    );
  }
}
