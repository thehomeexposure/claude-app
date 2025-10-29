// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToS3 } from "@/lib/s3";

export const dynamic = "force-dynamic";

// Max file size: 16MB
const MAX_FILE_SIZE = 16 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Parse multipart form data
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const projectId = formData.get("projectId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Limit to 10 files per upload
    if (files.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 files per upload" },
        { status: 400 }
      );
    }

    // Auto-create a project if one isn't provided
    let finalProjectId = projectId;

    if (!finalProjectId) {
      const defaultProject = await db.project.create({
        data: {
          userId: user.id,
          name: `Property ${new Date().toLocaleDateString()}`,
        },
      });
      finalProjectId = defaultProject.id;
    } else {
      // Verify user owns the project
      const project = await db.project.findFirst({
        where: {
          id: finalProjectId,
          userId: user.id,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }
    }

    const uploadedImages = [];

    // Process each file
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `File ${file.name} is not an image` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 16MB limit` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop() || "jpg";
      const key = `images/${user.id}/${timestamp}-${randomString}.${extension}`;

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to R2
      const url = await uploadToS3(key, buffer, file.type);

      // Create database record
      const image = await db.image.create({
        data: {
          userId: user.id,
          projectId: finalProjectId,
          url,
        },
      });

      uploadedImages.push({
        id: image.id,
        url: image.url,
        createdAt: image.createdAt,
      });
    }

    return NextResponse.json(
      {
        success: true,
        projectId: finalProjectId,
        images: uploadedImages,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
