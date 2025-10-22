"use client"

import { useRef, useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface UploadZoneProps {
  onFileUpload: (files: FileList | null) => void
  isUploading: boolean
  uploadProgress: number
}

export function UploadZone({ onFileUpload, isUploading, uploadProgress }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    onFileUpload(e.dataTransfer.files)
  }

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileUpload(e.target.files)
  }

  return (
    <Card
      className={cn(
        "mb-8 border-2 border-dashed border-border bg-card/50 p-12 text-center transition-all cursor-pointer",
        "hover:border-primary/50 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/10",
        isDragging && "border-primary bg-primary/10 scale-[1.02]",
        isUploading && "pointer-events-none opacity-50",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <div className="mx-auto flex flex-col items-center">
        <div className="rounded-full bg-primary/10 p-6 mb-4">
          <Upload className="h-10 w-10 text-primary" />
        </div>

        <h3 className="text-xl font-semibold text-foreground mb-2">
          {isDragging ? "Drop your files here" : "Upload Property Photos"}
        </h3>

        <p className="text-sm text-muted-foreground mb-6">JPG, PNG, WEBP • Max 10MB per file</p>

        <Button
          size="lg"
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
          type="button"
        >
          Choose Files
        </Button>
      </div>

      {isUploading && (
        <div className="mt-6">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300 shadow-lg shadow-primary/50"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
        </div>
      )}
    </Card>
  )
}
