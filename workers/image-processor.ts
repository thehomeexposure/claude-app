// workers/image-processor.ts
// Thin worker helpers for reading/writing blobs using our lib/s3 utilities.

import { getFromS3, uploadToS3, getPresignedGetUrl } from "@/lib/s3";

/**
 * Read blob bytes for processing.
 * Accepts either a full URL (preferred) or a key (requires BLOB_PUBLIC_BASE_URL).
 * Returns Uint8Array so downstream image libs can consume it.
 */
export async function readBlobBytes(keyOrUrl: string): Promise<Uint8Array> {
  const buf = await getFromS3(keyOrUrl); // Node Buffer from lib/s3
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

/**
 * Resolve a public URL (if your pipeline needs to pass a URL to clients/UI).
 * For keys, this uses lib/s3 resolver (BLOB_PUBLIC_BASE_URL) to build the URL.
 */
export async function resolveBlobUrl(keyOrUrl: string): Promise<string> {
  return getPresignedGetUrl(keyOrUrl);
}

/**
 * Upload processed data and return a public URL.
 * Mirrors an S3-style signature but writes to Vercel Blob via lib/s3.
 */
export async function writeBlob(
  key: string,
  data: Blob | File | ArrayBuffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ url: string }> {
  const url = await uploadToS3(key, data, contentType);
  return { url };
}

/**
 * Example job type for this worker. Adjust fields to your actual job payload.
 */
export type ImageJob = {
  input: string;           // key or full URL to source image
  outputKey: string;       // where to write processed result
  passthrough?: boolean;   // if true, just copy bytes unmodified
  // add transform options here later (resize, format, quality, etc.)
};

/**
 * Example entry point: processes an image and writes the result.
 * Currently a no-op passthrough (reads bytes and re-uploads).
 * Replace the middle section with your actual image processing logic.
 */
export default async function processImage(job: ImageJob): Promise<{ url: string }> {
  const { input, outputKey, passthrough = true } = job;

  // 1) Read source bytes
  const srcBytes = await readBlobBytes(input);

  // 2) (Optional) Transform bytes here (e.g., with sharp, Squoosh, etc.)
  // For now: passthrough (no transform)
  const outBytes: Uint8Array = srcBytes;

  // 3) Upload processed result
  const { url } = await writeBlob(
    outputKey,
    outBytes,                 // Uint8Array is fine; lib/s3 will wrap to Blob
    "application/octet-stream"
  );

  return { url };
}