# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts all Next.js routes; `app/api/**` contains HTTP handlers, while UI screens live under `app/dashboard`, `app/projects`, and `app/images`.
- `components/` holds reusable React pieces (e.g. upload button); create feature-specific folders when a component couples tightly to one route.
- Shared infra helpers (`db`, `redis`, `queue`, `s3`, `auth`) sit in `lib/`, and AI/upscaling integrations live in `services/`.
- Long-running jobs run from `workers/image-processor.ts`; Prisma schema and migrations sit in `prisma/`. Assets go in `public/`, reference docs in `docs/` and `SETUP.md`.

## Build, Test, and Development Commands
- `npm run dev` starts the Next.js dev server on http://localhost:3000.
- `npm run worker` launches the BullMQ processor; keep it running alongside the app during development.
- `npm run build` compiles a production bundle; follow with `npm run start` to sanity-check deploy artifacts.
- `npm run lint` executes `next lint` with the flat config.
- Database scripts: `npm run db:push`, `npm run db:migrate`, `npm run db:deploy`, and `npm run db:studio` manage schema changes and inspect data.

## Coding Style & Naming Conventions
- TypeScript is strict; prefer explicit types on exported functions and server actions.
- Keep two-space indentation and JSX formatting consistent with existing files; rely on ESLint autofix (`npm run lint -- --fix`) before commit.
- Components and classes use PascalCase, hooks/functions camelCase, and route segment folders remain lowercase kebab-case.
- Use the `@/` alias for shared modules instead of deep relative imports.

## Testing Guidelines
- No automated runner is bundled yet; add tests using React Testing Library or Playwright as features demand.
- Name colocated specs `*.test.ts(x)` and configure the chosen runner under `package.json` scripts.
- Until suites exist, validate flows manually (dev server + worker), run `npm run lint`, and document verification steps in the PR.

## Commit & Pull Request Guidelines
- Follow the concise, imperative commit style seen in history (`Add drag & drop upload zone`); add context in the body when touching multiple areas.
- PRs must describe intent, list impacted routes/services, link tracking issues, and call out schema or env changes.
- Attach UI screenshots or short Looms for visual updates, and note the commands executed (dev, worker, db) during verification.
