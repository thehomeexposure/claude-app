"use client"

import { useState } from "react"
import { Download, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface PropertyImage {
  id: string
  url: string
  createdAt: string
}

interface ImageCardProps {
  image: PropertyImage
  onDelete: (id: string) => void
  onDownload: (image: PropertyImage) => void
  onClick: () => void
}

export function ImageCard({ image, onDelete, onDownload, onClick }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(image.id)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload(image)
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
    <Card
      className="group relative overflow-hidden border border-border bg-card transition-all hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
        <Image
          src={image.url}
          alt={filename}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 backdrop-blur-md bg-background/80 hover:bg-background border border-border shadow-lg"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 backdrop-blur-md bg-background/80 hover:bg-destructive hover:text-destructive-foreground border border-border shadow-lg"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 border-t border-border">
        <p className="text-sm font-medium text-foreground truncate">{filename}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatTimeAgo(image.createdAt)}</p>
      </div>
    </Card>
  )
}
