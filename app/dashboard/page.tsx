// app/dashboard/page.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";

type Project = {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string; // ISO
  _count: { images: number };
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) {
        // show server error body for debugging
        const text = await res.text();
        throw new Error(`GET /api/projects ${res.status}: ${text || res.statusText}`);
      }
      const data = (await res.json()) as { projects: Project[] };
      setProjects(data.projects);
    } catch (e: unknown) {
      setProjects(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`POST /api/projects ${res.status}: ${text || res.statusText}`);
      }
      // refresh list
      setName("");
      setDescription("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Create form */}
      <form onSubmit={onCreate} className="mt-6 grid gap-2 max-w-md">
        <input
          className="border rounded p-2"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="border rounded p-2"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="border rounded px-3 py-2 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Project"}
        </button>
      </form>

      {/* Status */}
      {loading ? (
        <p className="mt-6">Loading your projects…</p>
      ) : error ? (
        <p className="mt-6 text-red-600">Error: {error}</p>
      ) : projects && projects.length > 0 ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{p.name}</h2>
                <span className="text-sm opacity-70">
                  {p._count.images} img{p._count.images === 1 ? "" : "s"}
                </span>
              </div>
              {p.description ? (
                <p className="mt-2 text-sm opacity-80 line-clamp-3">{p.description}</p>
              ) : null}
              <p className="mt-3 text-xs opacity-60">
                Updated {new Date(p.updatedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 opacity-70">No projects yet.</p>
      )}
    </main>
  );
}