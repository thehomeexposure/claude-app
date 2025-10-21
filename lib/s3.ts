// lib/s3.ts
// Vercel Blob–backed shim to keep existing imports working after moving off S3.
import { put } from "@vercel/blob";

/**
 * Normalize various input types to a Blob without using `any`.
 */
function toBlob(
  data: Blob | File | ArrayBuffer | Uint8Array | string,
  contentType: string
): Blob {
  if (data instanceof Blob) return data;
  // In browsers, File extends Blob – this guard keeps types explicit.
  if (typeof File !== "undefined" && data instanceof File) return data;

  if (typeof data === "string") {
    return new Blob([data], { type: contentType });
  }
  if (data instanceof Uint8Array) {
    return new Blob([data], { type: contentType });
  }
  if (data instanceof ArrayBuffer) {
    return new Blob([new Uint8Array(data)], { type: contentType });
  }

  // If you need Node.js Buffer support in the future, convert upstream to Uint8Array.
  throw new TypeError("Unsupported data type for upload");
}

/**
 * Uploads data and returns a public URL and a key.
 * Kept compatible with the previous S3 helper name.
 */
export async function uploadToS3(
  key: string,
  data: Blob | File | ArrayBuffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const filename = key?.trim() || `${Date.now()}`;
  const blob = toBlob(data, contentType);

  const uploaded = await put(filename, blob, {
    access: "public",
    contentType,
  });

  // Blob returns a public CDN URL; `pathname` is the stored key.
  return {
    key: uploaded.pathname ?? filename,
    url: uploaded.url,
  };
}

/**
 * Previously you may have used a presigned GET; Blob files are public,
 * so just return the key/URL you stored. Keep this to avoid refactors.
 */
export async function getPresignedGetUrl(keyOrUrl: string): Promise<string> {
  return keyOrUrl;
}
