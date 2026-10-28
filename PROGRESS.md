# Local Job Match - Progress Tracker

## Current State
- **Current task**: None (Phase 6 complete)
- **Current phase**: Phase 6 - Evidence-Led Iteration (complete)
- **Next task**: None (all planned phases complete)

## Recently Completed
- [x] Phase 6 - Evidence-led iteration: milestones/payment/messaging/geospatial deferred with documented decisions
- [x] Phase 5 - Pilot readiness: end-to-end journey, auth/discovery/jobs/quotation/review/admin tests, backup/recovery runbook, policy and launch checklist docs
- [x] Phase 4 - Status transitions, reviews, reports, admin moderation, audit logs, analytics
- [x] Phase 3 - Quotation acceptance: `POST/PATCH /quotations/{quotationId}/accept` creates booking, updates statuses, status history
- [x] Phase 3 - Quotation comparison: `GET /jobs/{jobId}` and `GET /jobs/{jobId}/quotations` include quotation and expert details
- [x] Phase 3 - Invitations and quotations: `POST /jobs/{jobId}/invitations`, `PUT /experts/me/quotations`, `POST /jobs/{jobId}/quotations`
- [x] Phase 3 - Job creation/editing/photo upload: `POST /jobs`, `PATCH /jobs/{jobId}`, `POST /jobs/{jobId}/photos`
- [x] Phase 2 - Admin verification queue: `GET /admin/experts/pending-verification`, `POST /admin/experts/{expertId}/verification-decision` (admin-only)
- [x] Phase 2 - Public expert profile: `GET /experts/{expertId}` returns public profile with verification status
- [x] Phase 2 - Build category/township search with pagination: `/categories`, `/locations/cities`, `/locations/townships`, `/experts` search endpoints
- [x] Phase 2 - Expert profiles, skills, service areas, portfolio: `/experts/me/profile`, `/me/skills`, `/me/areas`, `/me/portfolio` endpoints verified
- [x] Phase 1 - Create shared UI patterns and Burmese/English localization: persisted language preference, expanded base locale files
- [x] Phase 1 - Seed categories, cities, and townships: Yangon + 6 townships + 6 categories via `prisma db seed`
- [x] Phase 1 - Implement authentication/session handling: OTP request/verify, DB-backed sessions with HTTP-only cookies, `/users/me` get/patch, roles array
- [x] Phase 1 - Set up PostgreSQL and Prisma migrations: Prisma 7 schema with starter tables, initial migration applied to `local_job_match`, generated client wired via `@prisma/adapter-pg`
- [x] Phase 1 - Application and repository structure: npm workspaces (`apps/api`, `apps/web`, `packages/shared`), strict TypeScript, ESLint 9, Prettier, Vitest, GitHub Actions CI
- [x] Phase 1 - Health endpoint and frontend health panel: verified `GET /api/v1/health` end-to-end through the Vite dev proxy
- [x] Phase 0 - Validate Requirements: Defined launch city/townships, categories, recruited experts, confirmed OTP/hosting providers
- [x] Project documentation reviewed: PRD.md, ARCHITECTURE.md, DATABASE.md, API.md, SECURITY.md, IMPLEMENTATION_PLAN.md

## This Session
- [x] Added catalog module: `/categories`, `/locations/cities`, `/locations/townships` endpoints
- [x] Added expert search endpoint `GET /experts` with filters and cursor pagination
- [x] Implemented expert profiles module: profile create/get/patch, skills/areas/portfolio replace endpoints
- [x] Added `ExpertPortfolioItem` model and `expert_profiles` migration
- [x] Verified expert profile flow end-to-end (create, skills, areas, portfolio, get)
- [x] Persisted language preference on startup in `i18n/index.ts`; expanded base locale files (common/auth/errors)
- [x] Added seed script `prisma/seed.ts` with Yangon, 6 townships, 6 categories; configured `prisma db seed`
- [x] Implemented auth module: `auth.service.ts`, schemas, controller, routes; users module with `/users/me`
- [x] Added `authContext` middleware and wired into app; cookie-based sessions
- [x] Added `UserRole` enum, `roles`, `Session`, `OtpChallenge` models and migration `auth_sessions`
- [x] Made `AUTH_SESSION_SECRET` required in env config
- [x] Verified OTP request/verify, `/users/me` get/patch, logout end-to-end
- [x] Set up Prisma 7: created `apps/api/prisma/schema.prisma` (starter tables + enums), `apps/api/prisma.config.ts`, applied initial migration `20261027093851_init`
- [x] Wired Prisma client via `@prisma/adapter-pg` in `apps/api/src/lib/prisma.ts`
- [x] Made `DATABASE_URL` required in env config; synced `apps/api/.env`
- [x] Added Prisma npm scripts and generate step to build/typecheck
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
1. Implement public profile pages and verification labels (Phase 2)
   - GET /experts/{expertId} public profile
   - Verification status display
2. Build admin verification queue
   - Admin view pending verification experts
   - Admin verification decision endpoint
3. Jobs and quotations (Phase 3)

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