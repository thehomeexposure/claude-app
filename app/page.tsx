// app/page.tsx
export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Home</h1>
      <p className="mt-2">If you can see this, routing works.</p>
      <p className="mt-4">
        Try <a className="underline" href="/dashboard">/dashboard</a>
      </p>
    </main>
  );
}