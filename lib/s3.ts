// lib/s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 client configuration
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

/** Type guard for Blob-like objects (have arrayBuffer function) */
function isBlobLike(x: unknown): x is { arrayBuffer: () => Promise<ArrayBuffer> } {
  if (typeof x !== "object" || x === null) return false;
  const maybe = x as Record<string, unknown>;
  const fn = maybe["arrayBuffer"];
  return typeof fn === "function";
}

/** Normalize input to a Buffer for upload. */
async function toBufferAsync(data: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return data;

  if (typeof data === "string") return Buffer.from(data);

  if (data instanceof Uint8Array) return Buffer.from(data);

  if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data));

  if (isBlobLike(data)) {
    const ab = await data.arrayBuffer();
    return Buffer.from(new Uint8Array(ab));
  }

  throw new TypeError("Unsupported data type for upload");
}

/** Download a file from R2 using its key or URL. */
export async function getFromS3(urlOrKey: string): Promise<Buffer> {
  let key = urlOrKey;
  if (urlOrKey.startsWith("http")) {
    const url = new URL(urlOrKey);
    key = url.pathname.slice(1); // drop leading slash
  }

  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  const response = await r2Client.send(command);
  if (!response.Body) throw new Error("Failed to fetch object from R2");

  const chunks: Uint8Array[] = [];
  for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/** Upload a file to R2 and return the public URL. */
export async function uploadToS3(
  key: string,
  data: unknown,
  contentType = "application/octet-stream"
): Promise<string> {
  const filename = key?.trim() || `${Date.now()}`;
  const buffer = await toBufferAsync(data);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: buffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
  return `${process.env.R2_PUBLIC_URL}/${filename}`;
}

/** Upload to R2 and return both key and URL. */
export async function uploadToS3WithMeta(
  key: string,
  data: unknown,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const filename = key?.trim() || `${Date.now()}`;
  const url = await uploadToS3(filename, data, contentType);
  return { key: filename, url };
}

/** Generate a presigned URL for getting an object from R2. */
export async function getPresignedGetUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return getSignedUrl(r2Client, command, { expiresIn });
}