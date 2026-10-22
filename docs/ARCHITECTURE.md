# Architecture and Project Structure

## 1. Architecture Decision

Use a **modular monolith backend** with a separate frontend for the Local Job Match MVP. Keep the code simple, maintainable, and ready for future expansion.

### Technology Stack

- **Frontend:** React + TypeScript + Vite
- **UI:** shadcn/ui + Tailwind CSS
- **Routing:** React Router
- **API state:** TanStack Query
- **Backend:** Node.js + Express + TypeScript
- **API:** REST + JSON
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **File storage:** Local server filesystem
- **Authentication:** Phone OTP + secure sessions
- **Testing:** Vitest + Supertest + Playwright

## 2. Project Structure

```text
local-job-match/
├── apps/
│   ├── web/                  # React frontend
│   │   └── src/
│   │       ├── components/   # shadcn/ui and shared components
│   │       ├── features/     # Auth, jobs, experts, bookings
│   │       ├── routes/
│   │       ├── lib/          # API client and utilities
│   │       └── i18n/         # Burmese and English
│   └── api/                  # Express backend
│       └── src/
│           ├── modules/      # Business modules
│           ├── middleware/
│           ├── config/
│           ├── common/
│           ├── app.ts
│           └── server.ts
├── packages/
│   └── shared/               # Optional shared types
├── storage/
│   └── uploads/              # Local uploaded files
├── prisma/
│   └── schema.prisma
├── tests/
├── docs/
├── .env.example
├── .gitignore
└── README.md
```

Create directories as needed rather than generating empty folders in advance.

## 3. Backend Modules

Organize backend code by business domain:

- `auth` — authentication and sessions
- `users` — user accounts and roles
- `experts` — expert profiles, skills, and service areas
- `catalog` — service categories and townships
- `jobs` — job requests and attachments
- `quotations` — expert offers and acceptance
- `bookings` — scheduling and job progress
- `reviews` — ratings and feedback
- `files` — uploads and file access
- `notifications` — in-app notifications
- `admin` — verification, reports, and moderation

Each module should separate routes, controllers, validation, and business logic where appropriate.

**Controllers handle HTTP requests. Services enforce business rules. Prisma handles database access.** Avoid unnecessary abstraction.

## 4. API and Data Flow

Use the `/api/v1` prefix.

1. React sends a request to the Express API.
2. Middleware handles authentication and security.
3. Zod validates the input.
4. A service executes business rules.
5. Prisma reads or updates PostgreSQL.
6. The API returns a consistent JSON response.

Use database transactions for critical operations, especially quotation acceptance and booking creation. Enforce authorization and resource ownership on the backend.

## 5. File Storage

Use the backend server's local filesystem for the MVP.

- Store uploads under `storage/uploads/`, outside the frontend's public directory.
- Allow only approved file types and enforce file-size limits.
- Generate random filenames; never trust client-provided paths.
- Check authorization before serving private job attachments.
- Store file metadata and generated storage keys in PostgreSQL, not file contents.
- Configure the storage directory through `UPLOAD_DIR`.
- Exclude uploaded files from Git and maintain backups.

Create a small storage interface and implement `LocalFileStorage` first. This allows migration to S3-compatible object storage later without changing business logic.

**Important:** Use persistent disk storage. Local files can be lost during server failures or deployments on ephemeral filesystems.

## 6. Security and Configuration

- Use phone OTP and secure session cookies.
- Validate all API inputs on the server.
- Enforce role-based permissions and resource ownership.
- Rate-limit authentication and upload endpoints.
- Keep secrets in environment variables.
- Configure HTTPS, CORS, and security headers in production.
- Never expose secrets or private uploads publicly.

Example `.env.example`:

```dotenv
NODE_ENV=development
API_PORT=4000
WEB_ORIGIN=http://localhost:5173
DATABASE_URL=
AUTH_SESSION_SECRET=
OTP_PROVIDER_API_KEY=
UPLOAD_DIR=./storage/uploads
MAX_UPLOAD_SIZE_MB=8
```

## 7. Implementation Rules

1. Build the frontend and backend as separate applications in one repository.
2. Use PostgreSQL and Prisma migrations.
3. Support Burmese and English, MMK, and mobile-first layouts.
4. Keep business logic in backend services.
5. Test critical workflows, permissions, file uploads, and booking transactions.
6. Implement one feature at a time and keep documentation updated.
7. Do not introduce Next.js, microservices, cloud storage, or another database unless explicitly approved.
8. Read `PRD.md`, `DATABASE.md`, `API.md`, and `SECURITY.md` before implementation.

## 8. Future Considerations

Add cloud storage, background jobs, advanced geographic search, messaging integrations, or payment processing only when actual product requirements justify them.
