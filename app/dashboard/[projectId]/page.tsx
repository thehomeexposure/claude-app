"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImgIcon,
  UploadCloud,
  Download,
  Trash2,
  Loader2,
  Camera,
} from "lucide-react";

type GalleryItem = {
  id: string;
  url: string;
  filename: string;
  createdAt: string; // ISO from API
};

type ImagesApiResponse = {
  images: { id: string; url: string; createdAt: string }[];
};

export default function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  // unwrap the Promise without making the component async
  const { projectId } = use(params);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [modal, setModal] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [deletingImages, setDeletingImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Load images for this project
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : "";
        const res = await fetch(`/api/images${qs}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname || `/dashboard/${projectId}`)}`;
          }
          return;
        }
        if (!res.ok) throw new Error("Failed to load images");
        const data = (await res.json()) as ImagesApiResponse;

        if (cancelled) return;

        const mapped: GalleryItem[] = (data.images ?? []).map((img) => ({
          id: img.id,
          url: img.url,
          filename: img.url.split("/").pop() || "image.jpg",
          createdAt: img.createdAt,
        }));

        setItems(mapped);
      } catch (err) {
        console.error("Load images error:", err);
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const now = Date.now();
    const uploadedToday = items.filter((i) => {
      const d = new Date(i.createdAt).getTime();
      return now - d < 24 * 60 * 60 * 1000;
    }).length;
    return { total, today: uploadedToday, ready: total };
  }, [items]);

  // Upload helpers
  const onPickFiles = () => fileInputRef.current?.click();
  const onPickCamera = () => cameraInputRef.current?.click();

  const uploadFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || (files as File[]).length === 0) return;

      // Hard-cap to 10 files per request (API enforces as well)
      const fileArr = Array.from(files).slice(0, 10);
      const form = new FormData();
      fileArr.forEach((f) => form.append("files", f));
      if (projectId) form.append("projectId", projectId);

      try {
        setUploading(true);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: form,
          credentials: "include",
        });
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname || `/dashboard/${projectId}`)}`;
          }
          return;
        }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || "Upload failed");
        }
        const payload = (await res.json()) as {
          images: { id: string; url: string; createdAt: string }[];
        };

        const appended: GalleryItem[] = (payload.images ?? []).map((img) => ({
          id: img.id,
          url: img.url,
          filename: img.url.split("/").pop() || "image.jpg",
          createdAt: img.createdAt,
        }));

        // Prepend new images
        setItems((prev) => [...appended, ...prev]);
      } catch (e) {
        console.error(e);
        // TODO: replace with your toast UI
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
      }
    },
    [projectId]
  );

  const onFilesChosen = (files: FileList | null) => uploadFiles(files);

  const onDelete = async (id: string) => {
    if (deletingImages.includes(id)) return;
    const confirmed =
      typeof window === "undefined" ||
      window.confirm("Delete this image? This cannot be undone.");
    if (!confirmed) return;
    setDeletingImages((prev) => [...prev, id]);
    const previous = items;
    setItems((prev) => prev.filter((i) => i.id !== id));

    try {
      const res = await fetch(`/api/images/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname || `/dashboard/${projectId}`)}`;
        }
        return;
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`DELETE /api/images/${id} ${res.status}: ${text || res.statusText}`);
      }
    } catch (error) {
      console.error(error);
      setItems(previous);
    } finally {
      setDeletingImages((prev) => prev.filter((value) => value !== id));
    }
  };

  return (
    <main className="min-h-[100svh] text-white">
      {/* subtle premium background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(1000px_600px_at_20%_-10%,rgba(59,130,246,0.12),transparent)]" />
      <div className="fixed inset-0 -z-10 bg-[#0a0a0b]" />

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 py-8">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            123 Main Street
          </h1>
          <p className="text-zinc-400 mt-1">Property Photos</p>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
          <StatCard
            label="Total Images"
            value={stats.total}
            accent="blue"
            icon={<ImgIcon className="h-5 w-5" />}
          />
          <StatCard
            label="Uploaded Today"
            value={stats.today}
            accent="green"
            icon={<UploadCloud className="h-5 w-5" />}
          />
          <StatCard
            label="Ready to Share"
            value={stats.ready}
            accent="purple"
            icon={<Download className="h-5 w-5" />}
          />
        </section>

        {/* Upload zone with drag & drop */}
        <UploadZone
          onPickFiles={onPickFiles}
          onPickCamera={onPickCamera}
          onDropFiles={(files) => uploadFiles(files)}
          uploading={uploading}
          projectId={projectId}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onFilesChosen(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onFilesChosen(e.target.files)}
        />

        {/* Grid */}
        <section className="mt-10">
          {loading ? (
            <LoadingState />
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((img) => (
                <li key={img.id}>
                  <ImageCard
                    item={img}
                    onOpen={() => setModal(img)}
                    onDelete={() => onDelete(img.id)}
                    deleting={deletingImages.includes(img.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Fullscreen modal */}
      {modal && (
        <ImageModal
          item={modal}
          onClose={() => setModal(null)}
          onDownload={() => window.open(modal.url, "_blank")}
        />
      )}
    </main>
  );
}

/* =============== UI bits =============== */

function StatCard({
  label,
  value,
  icon,
  accent = "blue",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: "blue" | "green" | "purple";
}) {
  const ring =
    accent === "blue"
      ? "hover:shadow-[0_0_30px_rgba(59,130,246,.15)]"
      : accent === "green"
      ? "hover:shadow-[0_0_30px_rgba(34,197,94,.15)]"
      : "hover:shadow-[0_0_30px_rgba(168,85,247,.15)]";

  const badge =
    accent === "blue"
      ? "bg-blue-500/15 text-blue-400 ring-1 ring-inset ring-blue-400/30"
      : accent === "green"
      ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-400/30"
      : "bg-violet-500/15 text-violet-400 ring-1 ring-inset ring-violet-400/30";

  return (
    <div
      className={`rounded-2xl border border-zinc-800/70 bg-zinc-950/60 px-5 py-5 backdrop-blur transition-all duration-200 ${ring}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${badge}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function UploadZone({
  onPickFiles,
  onPickCamera,
  onDropFiles,
  uploading,
  projectId,
}: {
  onPickFiles: () => void;
  onPickCamera: () => void;
  onDropFiles: (files: FileList | File[]) => void;
  uploading: boolean;
  projectId?: string;
}) {
  const [dragActive, setDragActive] = useState(false);

  // Prevent default for drag events
  const prevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    prevent(e);
    setDragActive(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    prevent(e);
    if (!dragActive) setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    prevent(e);
    setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    prevent(e);
    setDragActive(false);
    const files = e.dataTransfer?.files ?? null;
    if (files && files.length > 0) onDropFiles(files);
  };

  return (
    <section
      role="region"
      aria-label="Upload property photos"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={[
        "rounded-3xl border border-dashed p-8 sm:p-10 text-center transition-all duration-200",
        "bg-zinc-950/40 border-zinc-800/70",
        "hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,.15)]",
        dragActive ? "border-blue-500/60 shadow-[0_0_50px_rgba(59,130,246,.25)]" : "",
      ].join(" ")}
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-inset ring-blue-500/30 shadow-[0_0_35px_rgba(59,130,246,.25)]">
        {uploading ? (
          <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
        ) : (
          <UploadCloud className="h-10 w-10 text-blue-400" />
        )}
      </div>
      <h2 className="mt-5 text-xl font-medium">Upload Property Photos</h2>
      <p className="mt-2 text-zinc-400">
        Drag &amp; drop files here, or use the buttons below to take a photo or upload files
      </p>
      <p className="text-zinc-500">
        JPG, PNG, WEBP • Max 10MB per file
        {projectId ? <span className="ml-2">(Project: {projectId})</span> : null}
      </p>
      <div className="mt-6 flex gap-3 justify-center">
        <button
          type="button"
          disabled={uploading}
          onClick={onPickCamera}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium shadow-lg shadow-green-600/25 outline-none transition hover:bg-green-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 focus-visible:ring-offset-zinc-950 disabled:opacity-60"
        >
          <Camera className="h-4 w-4" />
          {uploading ? "Uploading…" : "Take Photo"}
        </button>
        <button
          type="button"
          disabled={uploading}
          onClick={onPickFiles}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium shadow-lg shadow-blue-600/25 outline-none transition hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 focus-visible:ring-offset-zinc-950 disabled:opacity-60"
        >
          <UploadCloud className="h-4 w-4" />
          {uploading ? "Uploading…" : "Choose Files"}
        </button>
      </div>
    </section>
  );
}

function ImageCard({
  item,
  onOpen,
  onDelete,
  deleting = false,
}: {
  item: GalleryItem;
  onOpen: () => void;
  onDelete: () => void;
  deleting?: boolean;
}) {
  return (
    <div
      className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/40"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <img
        src={item.url}
        alt={item.filename}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
      />

      {/* hover overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-zinc-900/30 to-transparent backdrop-blur-[1.5px]" />
      </div>

      {/* meta + actions */}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="pointer-events-none">
          <div className="text-sm font-medium">{item.filename}</div>
          <div className="text-xs text-zinc-400">{formatTimeAgo(item.createdAt)}</div>
        </div>
        <div className="flex gap-2">
          <button
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/70 text-zinc-100 backdrop-blur ring-1 ring-inset ring-zinc-700/60 transition hover:bg-zinc-700"
            aria-label="Download"
            onClick={(e) => {
              e.stopPropagation();
              window.open(item.url, "_blank");
            }}
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800/70 text-red-300 backdrop-blur ring-1 ring-inset ring-zinc-700/60 transition hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Delete"
            disabled={deleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageModal({
  item,
  onClose,
  onDownload,
}: {
  item: GalleryItem;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[85svh] w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={item.url}
          alt={item.filename}
          className="w-full object-contain max-h-[78svh]"
        />
        <div className="flex items-center justify-between border-t border-zinc-800 p-3">
          <div>
            <div className="text-sm font-medium">{item.filename}</div>
            <div className="text-xs text-zinc-400">{formatTimeAgo(item.createdAt)}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDownload}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-800/80 px-3 py-2 text-sm ring-1 ring-inset ring-zinc-700 hover:bg-zinc-700"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-3xl border border-zinc-800/70 bg-zinc-950/50 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/60 ring-1 ring-inset ring-zinc-700">
        <ImgIcon className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="mt-5 text-lg font-medium">No photos yet</h3>
      <p className="mt-1 max-w-md text-zinc-400">
        Drag &amp; drop images above or click <span className="text-white">Choose Files</span> to start uploading.
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 rounded-3xl border border-zinc-800/70 bg-zinc-950/50 py-16 text-zinc-300">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Fetching images…</span>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
