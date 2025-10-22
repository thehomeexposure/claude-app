"use client"

import { Download, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface PropertyImage {
  id: string
  url: string
  createdAt: string
}

interface ImageModalProps {
  image: PropertyImage | null
  onClose: () => void
  onDelete: (id: string) => void
  onDownload: (image: PropertyImage) => void
}

export function ImageModal({ image, onClose, onDelete, onDownload }: ImageModalProps) {
  if (!image) return null

  const handleDelete = () => {
    onDelete(image.id)
    onClose()
  }

  const handleDownload = () => {
    onDownload(image)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "Just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const filename = image.url.split("/").pop() || "image.jpg"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-6xl w-full">
        {/* Close Button */}
        <Button
          size="icon"
          variant="secondary"
          className="absolute -top-12 right-0 h-10 w-10 bg-background/80 hover:bg-background backdrop-blur-md border border-border"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <Image
            src={image.url}
            alt={filename}
            fill
            className="object-contain"
          />
        </div>

        {/* Info Bar */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-card/80 backdrop-blur-md p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{filename}</p>
            <p className="text-xs text-muted-foreground">{formatTimeAgo(image.createdAt)}</p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button size="sm" variant="destructive" className="gap-2" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
