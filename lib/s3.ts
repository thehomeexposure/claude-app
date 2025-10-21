// lib/s3.ts
import { put } from "@vercel/blob";

/** Normalize input to a Blob */
function toBlob(
  data: Blob | File | ArrayBuffer | Uint8Array | string,
  contentType: string
): Blob {
  if (data instanceof Blob) return data;
  if (typeof File !== "undefined" && data instanceof File) return data;
  if (typeof data === "string") return new Blob([data], { type: contentType });
  if (data instanceof Uint8Array) return new Blob([data], { type: contentType });
  if (data instanceof ArrayBuffer)
    return new Blob([new Uint8Array(data)], { type: contentType });
  throw new TypeError("Unsupported data type for upload");
}

/**
 * Keep legacy S3 helper signature: return a STRING URL.
 */
export async function uploadToS3(
  key: string,
  data: Blob | File | ArrayBuffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<string> {
  const filename = key?.trim() || `${Date.now()}`;
  const blob = toBlob(data, contentType);
  const uploaded = await put(filename, blob, { access: "public", contentType });
  return uploaded.url; // <-- string, matches existing callers
}

/**
 * If you ever need both key + url, use this.
 */
export async function uploadToS3WithMeta(
  key: string,
  data: Blob | File | ArrayBuffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const filename = key?.trim() || `${Date.now()}`;
  const blob = toBlob(data, contentType);
  const uploaded = await put(filename, blob, { access: "public", contentType });
  return { key: uploaded.pathname ?? filename, url: uploaded.url };
}

/** Presigned GET isn’t needed on Blob; assets are public. */
export async function getPresignedGetUrl(keyOrUrl: string): Promise<string> {
  return keyOrUrl;
}
