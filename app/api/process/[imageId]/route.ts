import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { addImageProcessingJob } from '@/lib/queue';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  try {
    const user = await requireAuth();
    const { imageId } = await params;
    const body = await req.json();

    // Verify image belongs to user
    const image = await db.image.findFirst({
      where: {
        id: imageId,
        userId: user.id,
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Determine steps based on configuration
    const steps: ('ENHANCE' | 'RERENDER' | 'UPSCALE')[] = ['ENHANCE'];

    // Add RERENDER step if enabled and prompt provided
    const allowRerender = process.env.AI_ALLOW_RERENDER === 'true';
    if (allowRerender && body.prompt) {
      steps.push('RERENDER');
    }

    // Always add UPSCALE as final step
    steps.push('UPSCALE');

    // Create job record
    const job = await db.job.create({
      data: {
        imageId,
        status: 'PENDING',
        steps,
      },
    });

    // Add to queue
    await addImageProcessingJob({
      imageId,
      jobId: job.id,
      steps,
    });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Process image error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
