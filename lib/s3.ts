// lib/s3.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ---- Client (Cloudflare R2) ----
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // e.g. https://<accountid>.r2.cloudflarestorage.com
  forcePathStyle: true,              // <- important for R2
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_BASE = process.env.R2_PUBLIC_URL; // e.g. https://cdn.thehomeexposure.com (or your bucket public URL)

// ---- Utilities ----
function getKeyFromUrl(urlOrKey: string): string {
  if (!urlOrKey.startsWith("http")) return urlOrKey.trim().replace(/^\/+/, "");
  const u = new URL(urlOrKey);
  // strip leading slash
  return u.pathname.replace(/^\/+/, "");
}

/** Normalize input to a Node Buffer for upload. */
async function toBuffer(
  data: Blob | File | ArrayBuffer | Uint8Array | string | Buffer
): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return data;
  if (typeof data === "string") return Buffer.from(data);
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data));
  // Blob/File in Next API routes supports arrayBuffer()
  // (avoid instanceof because Blob comes from web runtime)
  // @ts-expect-error - runtime check
  if (data && typeof data.arrayBuffer === "function") {
    // @ts-expect-error - runtime check
    const ab: ArrayBuffer = await data.arrayBuffer();
    return Buffer.from(new Uint8Array(ab));
  }
  throw new TypeError("Unsupported data type for upload");
}

// ---- Public API ----
export async function getFromS3(urlOrKey: string): Promise<Buffer> {
  const Key = getKeyFromUrl(urlOrKey);

  const res = await r2Client.send(
    new GetObjectCommand({ Bucket: BUCKET_NAME, Key })
  );

  if (!res.Body) throw new Error("Failed to fetch object from R2");

  const chunks: Uint8Array[] = [];
  for await (const chunk of res.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Upload and return a public URL (or a path if no PUBLIC_BASE set). */
export async function uploadToS3(
  key: string,
  data: Blob | File | ArrayBuffer | Uint8Array | string | Buffer,
  contentType = "application/octet-stream",
  opts?: {
    cacheControl?: string;          // e.g. "public, max-age=31536000, immutable"
    contentDisposition?: string;    // e.g. `inline; filename="photo.jpg"`
  }
): Promise<string> {
  const Key = key?.trim() || `${Date.now()}`;
  const Body = await toBuffer(data);

  const input: PutObjectCommandInput = {
    Bucket: BUCKET_NAME,
    Key,
    Body,
    ContentType: contentType,
  };

  if (opts?.cacheControl) input.CacheControl = opts.cacheControl;
  if (opts?.contentDisposition) input.ContentDisposition = opts.contentDisposition;

  await r2Client.send(new PutObjectCommand(input));

  return PUBLIC_BASE ? `${PUBLIC_BASE.replace(/\/$/, "")}/${Key}` : Key;
}

/** Upload and return both key + URL. */
export async function uploadToS3WithMeta(
  key: string,
  data: Blob | File | ArrayBuffer | Uint8Array | string | Buffer,
  contentType = "application/octet-stream",
  opts?: { cacheControl?: string; contentDisposition?: string }
): Promise<{ key: string; url: string }> {
  const Key = key?.trim() || `${Date.now()}`;
  const url = await uploadToS3(Key, data, contentType, opts);
  return { key: Key, url };
}

/** Presigned GET (for private buckets). */
export async function getPresignedGetUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const Key = getKeyFromUrl(key);
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key });
  return getSignedUrl(r2Client, command, { expiresIn });
}