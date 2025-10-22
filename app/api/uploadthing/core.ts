import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: '16MB', maxFileCount: 10 } })
    .middleware(async () => {
      const { userId } = await auth();

      if (!userId) throw new Error('Unauthorized');

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('Upload complete for userId:', metadata.userId);
      console.log('File URL:', file.url);

      // Create database entry
      const user = await db.user.findUnique({
        where: { clerkId: metadata.userId },
      });

      if (user) {
        // Auto-create a project if needed
        const defaultProject = await db.project.create({
          data: {
            userId: user.id,
            name: `Property ${new Date().toLocaleDateString()}`,
          },
        });

        await db.image.create({
          data: {
            userId: user.id,
            url: file.url,
            projectId: defaultProject.id,
            // Removed: filename, mimeType, size (these fields don't exist in your schema)
          },
        });
      }

      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;