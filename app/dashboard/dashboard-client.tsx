// app/dashboard/dashboard-client.tsx
"use client";

import { useEffect, useState, FormEvent, useMemo } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { images: number };
};

type UserProfile = {
  displayName: string;
  email: string | null;
  imageUrl: string | null;
};

export default function DashboardClient() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // form state
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`GET /api/projects ${res.status}: ${text || res.statusText}`);
      }
      const data = (await res.json()) as {
        projects: Project[];
        user: UserProfile | null;
      };
      setProjects(data.projects);
      setProfile(data.user);
    } catch (e: unknown) {
      setProjects(null);
      setProfile(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const greetingName = useMemo(() => {
    if (!profile) return "Agent";
    return profile.displayName || profile.email || "Agent";
  }, [profile]);

  const avatarInitial = useMemo(() => {
    const source = profile?.displayName || profile?.email || "Agent";
    return source.trim().charAt(0).toUpperCase();
  }, [profile]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST /api/projects ${res.status}: ${text || res.statusText}`);
      }
      setName("");
      setDescription("");
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(projectId: string) {
    if (deletingId) return;
    const confirmed = typeof window !== "undefined" ? window.confirm("Delete this project and all associated images?") : true;
    if (!confirmed) return;

    setDeletingId(projectId);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/sign-in";
        }
        return;
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`DELETE /api/projects/${projectId} ${res.status}: ${text || res.statusText}`);
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="relative min-h-screen bg-[#040405] text-zinc-200">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,rgba(59,130,246,0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-12">
          <div>
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-zinc-900/70 shadow-lg shadow-black/40">
                {profile?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.imageUrl}
                    alt={greetingName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-zinc-200">
                    {avatarInitial}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Welcome back</p>
                <h1 className="text-2xl font-semibold text-white">Hello, {greetingName}</h1>
                {profile?.email && (
                  <p className="text-xs text-zinc-500">{profile.email}</p>
                )}
              </div>
            </div>
            <p className="mt-4 max-w-xl text-sm text-zinc-400">
              Manage luxury property shoots, review processed galleries, and launch new workstreams in seconds.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-blue-600/30 transition-transform hover:-translate-y-0.5 hover:bg-blue-500"
          >
            {showForm ? "Cancel" : "+ New Project"}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="mb-10 rounded-2xl border border-white/10 bg-zinc-950/80 p-6 shadow-2xl shadow-black/50 backdrop-blur">
            <h2 className="text-lg font-semibold text-white mb-4">Create New Project</h2>
            <form onSubmit={onCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Project Name
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-white shadow-inner shadow-black/40 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  placeholder="e.g., 123 Main Street Listing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Description (optional)
                </label>
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-sm text-white shadow-inner shadow-black/40 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Add details about this project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={creating || !name.trim()}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setName("");
                    setDescription("");
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-600/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="flex items-center justify-center py-14 text-sm text-zinc-500">
            Loading your projects...
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/${project.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 p-6 transition duration-200 hover:border-white/30 hover:bg-zinc-900/60"
              >
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    void handleDelete(project.id);
                  }}
                  disabled={deletingId === project.id}
                  className="absolute right-4 top-4 inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-200 transition hover:border-red-400/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-start justify-between">
                  <h2 className="line-clamp-1 text-lg font-medium text-white transition group-hover:text-blue-400">
                    {project.name}
                  </h2>
                  <div className="ml-3 inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-200">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {project._count.images}
                  </div>
                </div>

                {project.description && (
                  <p className="mt-4 line-clamp-2 text-sm text-zinc-400">
                    {project.description}
                  </p>
                )}

                <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
                  <span>
                    <span className="text-zinc-300">Created:</span>{" "}
                    {new Date(project.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="inline-flex items-center gap-2 text-blue-200 transition group-hover:text-blue-100">
                    View project
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/15 bg-zinc-950/60 py-16 text-center">
            <svg
              className="mx-auto h-12 w-12 text-zinc-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-white">No projects yet</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Launch your first property collection to begin processing imagery.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-6 inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
            >
              Create Project
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
