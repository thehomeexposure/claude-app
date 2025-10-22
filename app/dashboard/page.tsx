// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Request failed: ${res.status}`);
        }
        const data = (await res.json()) as { projects: Project[] };
        if (!cancelled) {
          setProjects(data.projects);
          setError(null);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2">Loading your projects…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-red-600">Error: {error}</p>
      </main>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Your Projects</h1>

      {projects && projects.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id} className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{p.name}</h2>
                <span className="text-sm opacity-70">
                  {p._count.images} img{p._count.images === 1 ? "" : "s"}
                </span>
              </div>
              {p.description ? (
                <p className="mt-2 text-sm opacity-80 line-clamp-3">
                  {p.description}
                </p>
              ) : null}
              <p className="mt-3 text-xs opacity-60">
                Updated {new Date(p.updatedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 opacity-70">No projects yet.</p>
      )}
    </main>
  );
}