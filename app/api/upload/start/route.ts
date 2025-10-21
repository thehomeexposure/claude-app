import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadToS3 } from '@/lib/s3';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    const key = `uploads/${user.id}/${Date.now()}-${file.name}`;
    const url = await uploadToS3(key, buffer, file.type);

    // Create image record
    const image = await db.image.create({
      data: {
        userId: user.id,
        projectId: projectId || undefined,
        originalUrl: url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
