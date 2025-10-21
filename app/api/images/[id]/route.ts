import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const image = await db.image.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        jobs: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        project: true,
      },
    });

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Get image error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
