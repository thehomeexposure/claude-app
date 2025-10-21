// lib/s3.ts
// Blob-backed shim to keep existing imports working after moving off S3.
import { put } from "@vercel/blob";

/**
 * Uploads arbitrary data and returns a public URL and key.
 * Compatible signature with your old S3 helper.
 */
export async function uploadToS3(
  key: string,
  data: Buffer | Uint8Array | ArrayBuffer | string | Blob | File,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const filename = key?.trim() || `${Date.now()}`;

  let body: any = data as any;
  if (
    typeof Blob !== "undefined" &&
    (data instanceof Uint8Array ||
      data instanceof ArrayBuffer ||
      // @ts-ignore Buffer check when running in Node
      (typeof Buffer !== "undefined" && (data as any) instanceof Buffer) ||
      typeof data === "string")
  ) {
    body = new Blob([data as any], { type: contentType });
  }

  const uploaded = await put(filename, body, {
    access: "public",
    contentType,
  });

  return {
    key: uploaded.pathname ?? filename,
    url: uploaded.url,
  };
}

// Optional stub so other imports compile if present.
export async function getPresignedGetUrl(key: string): Promise<string> {
  return key; // Blob assets are already public
}
