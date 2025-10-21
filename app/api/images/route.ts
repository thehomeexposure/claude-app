import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    const images = await db.image.findMany({
      where: {
        userId: user.id,
        ...(projectId ? { projectId } : {}),
      },
      include: {
        jobs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Get images error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch images' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { projectId, filename, url } = body;

    const image = await db.image.create({
      data: {
        userId: user.id,
        projectId: projectId || undefined,
        originalUrl: url,
        filename,
        mimeType: 'image/png',
        size: 0,
      },
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Create image error:', error);
    return NextResponse.json(
      { error: 'Failed to create image' },
      { status: 500 }
    );
  }
}
