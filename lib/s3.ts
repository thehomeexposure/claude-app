// lib/s3.ts
import { put } from "@vercel/blob";

/**
 * Normalize various input types to a Blob without using `any`.
 */
function toBlob(
  data: Blob | File | ArrayBuffer | Uint8Array | string,
  contentType: string
): Blob {
  if (data instanceof Blob) return data;
  if (typeof File !== "undefined" && data instanceof File) return data;

  if (typeof data === "string") {
    return new Blob([data], { type: contentType });
  }

  if (data instanceof Uint8Array) {
    // Fix: convert to ArrayBuffer slice for compatibility with Blob
    const slice = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    );
    return new Blob([slice], { type: contentType });
  }

  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: contentType });
  }

  throw new TypeError("Unsupported data type for upload");
}

/**
 * Uploads data and returns a public URL string.
 * (Maintains old S3-style `uploadToS3` signature for compatibility)
 */
export async function uploadToS3(
  key: string,
  data: Blob | File | ArrayBuffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<string> {
  const filename = key?.trim() || `${Date.now()}`;
  const blob = toBlob(data, contentType);
  const uploaded = await put(filename, blob, {
    access: "public",
    contentType,
  });
  return uploaded.url; // return just the string URL
}

/**
 * Optional helper: upload and return both key + URL.
 */
export async function uploadToS3WithMeta(
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
  return { key: uploaded.pathname ?? filename, url: uploaded.url };
}

/**
 * Previously this was a presigned GET, but Blob files are public.
 * Return the key or URL directly for compatibility.
 */
export async function getPresignedGetUrl(keyOrUrl: string): Promise<string> {
  return keyOrUrl;
}
