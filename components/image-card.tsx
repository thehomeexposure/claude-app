"use client";

import { useMemo, useState } from "react";
import { Download, Trash2, ImageOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type PropertyImage = {
  id: string;
  url: string;        // can be a public URL OR a key you serve via signed GET
  createdAt: string;  // ISO
};

type ImageCardProps = {
  image: PropertyImage;
  onDelete: (id: string) => void;
  /**
   * Optional: if your objects aren’t publicly readable, provide this.
   * Return a temporary download URL (e.g. from /api/download?id=...).
   */
  onDownload?: (image: PropertyImage) => Promise<string> | void;
  onClick: () => void;
};

export function ImageCard({ image, onDelete, onDownload, onClick }: ImageCardProps) {
  const [imgOk, setImgOk] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // --- filename (safe: strips query/hash) ---
  const filename = useMemo(() => {
    try {
      const u = new URL(image.url, "http://dummy-base/");
      const last = u.pathname.split("/").filter(Boolean).pop() || "image";
      return decodeURIComponent(last);
    } catch {
      // if it's a key (no scheme), just split
      return image.url.split("?")[0].split("#")[0].split("/").pop() || "image";
    }
  }, [image.url]);

  // --- time-ago, with Intl.RelativeTimeFormat ---
  const timeAgo = useMemo(() => {
    const rt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    const created = new Date(image.createdAt).getTime();
    const diffSec = Math.round((created - Date.now()) / 1000); // negative in the past

    const map: [number, Intl.RelativeTimeFormatUnit][] = [
      [60, "second"],
      [60, "minute"],
      [24, "hour"],
      [7, "day"],
      [4.34524, "week"],
      [12, "month"],
      [Number.POSITIVE_INFINITY, "year"],
    ];

    let duration = Math.abs(diffSec), unit: Intl.RelativeTimeFormatUnit = "second";
    let value = diffSec;

    for (let i = 0; i < map.length; i++) {
      const [step, u] = map[i];
      if (duration < step) { unit = u; break; }
      value /= step;
      duration /= step;
    }

    return rt.format(Math.round(value), unit);
  }, [image.createdAt]);

  // --- actions ---
  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDelete(image.id);
  };

  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      setDownloading(true);
      // If parent supplies onDownload, prefer it (e.g., to get a signed GET URL)
      let url: string | void = undefined;
      if (onDownload) url = await onDownload(image);

      const href = (typeof url === "string" && url) ? url : image.url; // fallback if public

      // programmatic download (keeps your nice button)
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden border border-zinc-800/80 bg-zinc-900/60 transition-all hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/10 focus-within:border-blue-400/50"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-950">
        {imgOk ? (
          <Image
            src={image.url}
            alt={filename}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => setImgOk(false)}
            // optional blur placeholder if you have base64 on the model:
            // placeholder="blur"
            // blurDataURL={image.blurDataUrl}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-zinc-500">
            <ImageOff className="h-8 w-8" />
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 backdrop-blur-[1px] transition-opacity duration-300 group-hover:opacity-100" />

        {/* Action Buttons */}
        <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label="Download image"
            title="Download"
            className="h-9 w-9 border border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md transition hover:bg-zinc-900 focus-visible:ring-2 focus-visible:ring-blue-500"
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label="Delete image"
            title="Delete"
            className="h-9 w-9 border border-zinc-800/80 bg-zinc-900/80 backdrop-blur-md transition hover:bg-red-600/20 hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="border-t border-zinc-800/80 p-4">
        <p className="truncate text-sm font-medium text-zinc-100">{filename}</p>
        <p className="mt-1 text-xs text-zinc-400">{timeAgo}</p>
      </div>
    </Card>
  );
}
