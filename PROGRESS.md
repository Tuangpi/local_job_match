# Local Job Match - Progress Tracker

## Current State
- **Current task**: Phase 1 - Set up PostgreSQL and Prisma migrations (not started)
- **Current phase**: Phase 1 - Project Foundation (in progress)
- **Next task**: Initialize Prisma schema and first migration

## Recently Completed
- [x] Phase 1 - Application and repository structure: npm workspaces (`apps/api`, `apps/web`, `packages/shared`), strict TypeScript, ESLint 9, Prettier, Vitest, GitHub Actions CI
- [x] Phase 1 - Health endpoint and frontend health panel: verified `GET /api/v1/health` end-to-end through the Vite dev proxy
- [x] Phase 0 - Validate Requirements: Defined launch city/townships, categories, recruited experts, confirmed OTP/hosting providers
- [x] Project documentation reviewed: PRD.md, ARCHITECTURE.md, DATABASE.md, API.md, SECURITY.md, IMPLEMENTATION_PLAN.md

## This Session
- [x] Created root workspace: `package.json` (workspaces, scripts), `tsconfig.base.json`, `tsconfig.json` (project references)
- [x] Added tooling: `eslint.config.js` (flat config, type-checked), `.prettierrc.json`, `.prettierignore`, `.editorconfig`
- [x] Added `.env.example` (blank values) and `.gitignore`
- [x] Added CI workflow `.github/workflows/ci.yml` (typecheck, lint, format, test, build)
- [x] Created `packages/shared` with domain enums, API envelope, and error codes
- [x] Created `apps/api`: Express 5 app with helmet, CORS, request IDs, structured JSON logging, error handler, health module (routes/controller/service)
- [x] Created `apps/web`: Vite + React 19 + Tailwind 4, i18n (`my`/`en`), typed API client, React Router layout, health panel
- [x] Created local `.env` with PostgreSQL credentials (gitignored)
- [x] Verified all checks pass and booted the API + web dev server

## blockers
- None currently; repository foundation is in place and verified

## Next Steps
1. Set up PostgreSQL and Prisma migrations (Phase 1 task 2)
   - Initialize `prisma/schema.prisma` from docs/DATABASE.md
   - Create and apply the first migration against `local_job_match`
2. Implement authentication/session handling
3. Seed categories, cities, and townships
4. Create shared UI patterns and Burmese/English localization

## Recent Decisions
- Modular monolith architecture with Node.js + Express + TypeScript backend
- React + TypeScript + Vite frontend with shadcn/ui + Tailwind CSS
- PostgreSQL with Prisma ORM and Zod validation
- Phone OTP authentication for MVP
- Free access pilot period before monetization testing
- Burmese and English localization required
- npm workspaces monorepo: `apps/api`, `apps/web`, `packages/shared`
- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- ESLint 9 flat config with type-checked rules; Prettier for formatting
- Vitest + Supertest for API, Vitest + Testing Library for web; Playwright deferred
- Express 5, React 19, Vite 7, Tailwind CSS 4
- API responses use the `{ data }` / `{ error: { code, message } }` envelope from docs/API.md
- Every request carries an `x-request-id` and one structured JSON log line
- Markdown files are excluded from Prettier to preserve the existing docs style
- npm 11 blocks install scripts by default; `esbuild` is approved via `allowScripts` in package.json

## Metrics to Track (from PRD)
- Number of active experts per township/category
- Number of valid job requests
- Share of requests receiving at least one quotation
- Median time to first response
- Quotation acceptance rate
- Job completion rate
- Repeat customer rate
- Expert retention
- Cancellation and complaint rates