// lib/s3.ts  — AWS SDK v3 version

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.S3_REGION!;
const BUCKET = process.env.S3_BUCKET!;
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY!;
const ENDPOINT = process.env.S3_ENDPOINT; // optional (e.g., Cloudflare R2, MinIO)

export const s3 = new S3Client({
  region: REGION,
  ...(ENDPOINT ? { endpoint: ENDPOINT, forcePathStyle: true } : {}),
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

// High-level upload (handles streams/large files)
export async function uploadBuffer(key: string, body: Buffer, contentType?: string) {
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });
  await uploader.done();
  return `s3://${BUCKET}/${key}`;
}

// Simple put (small payloads)
export async function putObject(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string
) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return `s3://${BUCKET}/${key}`;
}

// Presigned GET URL (to show/download in UI)
export async function getPresignedGetUrl(key: string, expiresIn = 3600) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
}