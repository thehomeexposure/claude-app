// app/dashboard/[projectId]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  images: {
    id: string;
    url: string;
    createdAt: string;
  }[];
};

type UploadingFile = {
  file: File;
  preview: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
};

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // UI state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load project data
  const loadProject = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `GET /api/projects/${projectId} ${res.status}: ${text || res.statusText}`
        );
      }
      const data = (await res.json()) as { project: Project };
      setProject(data.project);
    } catch (e: unknown) {
      setProject(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  // Toast notification
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // File validation
  const validateFiles = (files: File[]): string | null => {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (files.length > 10) {
      return "Maximum 10 files allowed per upload";
    }

    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return `File ${file.name} is not a supported image type`;
      }
      if (file.size > MAX_SIZE) {
        return `File ${file.name} exceeds 10MB limit`;
      }
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validationError = validateFiles(fileArray);

    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    uploadFiles(fileArray);
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  // Remove file from upload queue
  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Upload files to R2
  const uploadFiles = async (files: File[]) => {
    const newUploadingFiles: UploadingFile[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: "uploading",
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("projectId", projectId);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadingFiles((prev) =>
            prev.map((uf, idx) =>
              idx >= prev.length - files.length
                ? { ...uf, progress }
                : uf
            )
          );
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 201) {
          setUploadingFiles((prev) =>
            prev.map((uf, idx) =>
              idx >= prev.length - files.length
                ? { ...uf, progress: 100, status: "success" }
                : uf
            )
          );

          showToast(`Successfully uploaded ${files.length} image${files.length > 1 ? "s" : ""}`, "success");

          setTimeout(() => {
            setUploadingFiles((prev) => prev.filter((uf) => uf.status !== "success"));
            loadProject();
          }, 2000);
        } else {
          const response = JSON.parse(xhr.responseText);
          const errorMsg = response.error || "Upload failed";

          setUploadingFiles((prev) =>
            prev.map((uf, idx) =>
              idx >= prev.length - files.length
                ? { ...uf, status: "error", error: errorMsg }
                : uf
            )
          );

          showToast(errorMsg, "error");
        }
      });

      xhr.addEventListener("error", () => {
        setUploadingFiles((prev) =>
          prev.map((uf, idx) =>
            idx >= prev.length - files.length
              ? { ...uf, status: "error", error: "Upload failed" }
              : uf
          )
        );
        showToast("Upload failed. Please try again.", "error");
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Upload failed. Please try again.", "error");
      setUploadingFiles([]);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-32 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors mb-6 group"
          >
            <svg
              className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
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
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Error Loading Project
            </h2>
            <p className="text-sm text-red-700">{error || "Project not found"}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors mb-4 group"
          >
            <svg
              className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="text-gray-600 text-lg">{project.description}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-semibold text-blue-900">
                  {project.images.length}{" "}
                  {project.images.length === 1 ? "Image" : "Images"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">Created {formatDate(project.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Upload Images
            </h2>
            <p className="text-gray-600 mb-6">
              Drag and drop your real estate photos or click to browse
            </p>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-blue-500 bg-blue-50 scale-[1.02]"
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={uploadingFiles.some((f) => f.status === "uploading")}
              />

              <div className="flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {isDragging ? "Drop your files here" : "Click to upload or drag and drop"}
                </h3>
                <p className="text-gray-500 mb-4">
                  JPG, JPEG, PNG, or WEBP files
                </p>

                <div className="flex items-center gap-8 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>Max 10 files</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                      />
                    </svg>
                    <span>10MB max per file</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Uploading Files Preview */}
            {uploadingFiles.length > 0 && (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Uploading {uploadingFiles.length}{" "}
                  {uploadingFiles.length === 1 ? "file" : "files"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadingFiles.map((uploadingFile, index) => (
                    <div
                      key={index}
                      className="relative bg-gray-50 rounded-xl overflow-hidden border border-gray-200"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-video relative bg-gray-200">
                        <Image
                          src={uploadingFile.preview}
                          alt={uploadingFile.file.name}
                          fill
                          className="object-cover"
                        />
                        {/* Status Overlay */}
                        {uploadingFile.status === "success" && (
                          <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center">
                            <svg
                              className="w-12 h-12 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                        {uploadingFile.status === "error" && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center">
                            <svg
                              className="w-12 h-12 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900 truncate flex-1">
                            {uploadingFile.file.name}
                          </p>
                          {uploadingFile.status === "uploading" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeUploadingFile(index);
                              }}
                              className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span>{formatFileSize(uploadingFile.file.size)}</span>
                          {uploadingFile.status === "uploading" && (
                            <span>{uploadingFile.progress}%</span>
                          )}
                          {uploadingFile.status === "success" && (
                            <span className="text-green-600 font-medium">Complete</span>
                          )}
                          {uploadingFile.status === "error" && (
                            <span className="text-red-600 font-medium">Failed</span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        {uploadingFile.status === "uploading" && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${uploadingFile.progress}%` }}
                            />
                          </div>
                        )}

                        {uploadingFile.status === "error" && uploadingFile.error && (
                          <p className="text-xs text-red-600 mt-1">{uploadingFile.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Images Grid */}
        {project.images.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Project Gallery ({project.images.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {project.images.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-square bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <Image
                    src={image.url}
                    alt={`Image from ${project.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white text-sm mb-3">
                        {formatDate(image.createdAt)}
                      </p>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedImage(image.url)}
                          className="flex-1 px-3 py-2 bg-white text-gray-900 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                          View
                        </button>
                        <button
                          onClick={() => window.open(image.url, "_blank")}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No images yet
            </h3>
            <p className="text-gray-500 mb-6">
              Upload your first property photos to get started
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Upload Images
            </button>
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full">
            <Image
              src={selectedImage}
              alt="Full size view"
              fill
              className="object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-4 rounded-lg shadow-lg border flex items-center gap-3 animate-slide-up ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-900"
                : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-900"
                : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            {toast.type === "success" && (
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {toast.type === "error" && (
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            {toast.type === "info" && (
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <p className="font-medium">{toast.message}</p>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="ml-4 hover:opacity-70 transition-opacity"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
