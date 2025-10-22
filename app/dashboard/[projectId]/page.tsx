"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Image as ImageIcon, Upload, Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ImageCard } from "@/components/image-card"
import { ImageModal } from "@/components/image-modal"
import { UploadZone } from "@/components/upload-zone"

type Project = {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
  images: {
    id: string
    url: string
    createdAt: string
  }[]
}

type PropertyImage = {
  id: string
  url: string
  createdAt: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // UI state
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load project data
  const loadProject = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        cache: "no-store",
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(
          `GET /api/projects/${projectId} ${res.status}: ${text || res.statusText}`
        )
      }
      const data = (await res.json()) as { project: Project }
      setProject(data.project)
    } catch (e: unknown) {
      setProject(null)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId])

  // File upload handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Validate files
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

    if (fileArray.length > 10) {
      alert("Maximum 10 files allowed per upload")
      return
    }

    for (const file of fileArray) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        alert(`File ${file.name} is not a supported image type`)
        return
      }
      if (file.size > MAX_SIZE) {
        alert(`File ${file.name} exceeds 10MB limit`)
        return
      }
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      fileArray.forEach((file) => formData.append("files", file))
      formData.append("projectId", projectId)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      xhr.addEventListener("load", () => {
        if (xhr.status === 201) {
          setUploadProgress(100)
          setTimeout(() => {
            setIsUploading(false)
            setUploadProgress(0)
            loadProject()
          }, 1000)
        } else {
          const response = JSON.parse(xhr.responseText)
          alert(response.error || "Upload failed")
          setIsUploading(false)
          setUploadProgress(0)
        }
      })

      xhr.addEventListener("error", () => {
        alert("Upload failed. Please try again.")
        setIsUploading(false)
        setUploadProgress(0)
      })

      xhr.open("POST", "/api/upload")
      xhr.send(formData)
    } catch (err) {
      console.error("Upload error:", err)
      alert("Upload failed. Please try again.")
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Delete handler
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      // TODO: Implement delete API call
      alert("Delete functionality coming soon")
    }
  }

  // Download handler
  const handleDownload = (image: PropertyImage) => {
    window.open(image.url, "_blank")
  }

  // Calculate stats
  const totalImages = project?.images.length || 0
  const uploadedToday = project?.images.filter((img) => {
    const imgDate = new Date(img.createdAt)
    const today = new Date()
    return (
      imgDate.getDate() === today.getDate() &&
      imgDate.getMonth() === today.getMonth() &&
      imgDate.getFullYear() === today.getFullYear()
    )
  }).length || 0

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-secondary rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-secondary rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center border-destructive">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <svg
                className="h-8 w-8 text-destructive"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Project</h2>
            <p className="text-sm text-muted-foreground mb-6">
              {error || "Project not found"}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="mt-4">
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <p className="mt-1 text-muted-foreground">Property Photos</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <ImageIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Images</p>
                <p className="text-2xl font-bold text-foreground">{totalImages}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-3">
                <Upload className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uploaded Today</p>
                <p className="text-2xl font-bold text-foreground">{uploadedToday}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-3">
                <Check className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ready to Share</p>
                <p className="text-2xl font-bold text-foreground">{totalImages}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Upload Zone */}
        <UploadZone
          onFileUpload={handleFileUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
        />

        {/* Images Grid */}
        {project.images.length === 0 ? (
          <Card className="p-16 text-center border-dashed">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No images yet</h3>
            <p className="text-muted-foreground">Upload your first property photos to get started</p>
          </Card>
        ) : (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Property Images ({project.images.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {project.images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onClick={() => setSelectedImage(image)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      <ImageModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  )
}
