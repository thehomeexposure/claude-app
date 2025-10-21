// lib/s3.ts
import { put } from "@vercel/blob";

/**
 * Normalize input to a Blob without `any`.
 * We always copy into a fresh Uint8Array so the backing buffer is a plain ArrayBuffer.
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
    // Copy into a fresh Uint8Array (guaranteed ArrayBuffer backing)
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    // @ts-expect-error: In some lib.d.ts variants BlobPart’s union confuses SAB; a fresh Uint8Array is valid BlobPart.
    return new Blob([copy], { type: contentType });
  }

  if (data instanceof ArrayBuffer) {
    // Wrap in a fresh Uint8Array (ArrayBufferView) to satisfy BlobPart
    const view = new Uint8Array(data);
    // @ts-expect-error: See note above; a fresh Uint8Array is valid BlobPart.
    return new Blob([view], { type: contentType });
  }

  throw new TypeError("Unsupported data type for upload");
}

/**
 * Keep legacy S3-style signature: return a STRING URL.
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
  return uploaded.url;
}

/**
 * Optional: need both key + URL.
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
 * Blob files are public; keep this for compatibility.
 */
export async function getPresignedGetUrl(keyOrUrl: string): Promise<string> {
  return keyOrUrl;
}