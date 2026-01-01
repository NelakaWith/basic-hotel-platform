# Basic Hotel Platform

> **Note:** The Express API in this repo is a quick demo scaffold (not the FastAPI/SQLAlchemy stack described in the assessment brief). Use it only for exercising the frontend.

Internal admin tool that lets hotel staff sign in, manage properties, manage their room types, and capture rate adjustments with full history tracking. The project is split into an Express API (`api/`) backed by MySQL and a Next.js 13+ App Router client (`client/`).

## Demo Credentials

- Username: `admin`
- Password: `password123`

## Feature Checklist

- Auth: seeded admin credentials (`admin` / `password123`) issuing JWT access tokens.
- Hotels: list, create, edit, delete, and drill into a property for richer context.
- Room types: CRUD per hotel, effective-rate display (`base_rate + latest adjustment`), search scoped by hotel.
- Rate adjustments: form validates amount/date/reason, persists history, and surfaces both recent and full logs.
- UX niceties: optimistic loading states, toast-based feedback, guarded actions (confirmation dialog for destructive flows).

## Tech Stack

- **Backend:** Node 18, Express, MySQL (`mysql2`), JSON Web Tokens, Zod validation.
- **Frontend:** Next.js (App Router, React 18), TypeScript, Tailwind, shadcn/ui primitive components, Sonner toasts.
- **Tooling:** Vite-style dev server via Next.js, Nodemon for the API, ESLint/TypeScript configs per package.

## Repository Layout

- `api/` – Express service, DB access, schema bootstrapper, and seed script.
- `client/` – Next.js frontend with `/auth`, `/hotels`, `/room-types`, and nested detail routes.
- `run-dev.bat` – helper script (Windows) that launches both API and client dev servers.

## Prerequisites

- Node.js 18+
- npm 9+
- MySQL 8+ reachable for the API (default DB name `hotelsdb`).

## Backend Setup (`api/`)

1. `cd api`
2. Copy environment template: `cp .env.example .env` (or duplicate manually on Windows).
3. Edit `.env` with DB credentials plus `JWT_SECRET` and `PORT`.
4. Install dependencies: `npm install`
5. Start the dev server: `npm run dev` (nodemon) or run once with `npm start`.
6. Seed baseline data (admin user + sample hotel/room types): `npm run seed`

The API auto-creates tables if they do not exist (see `src/schema.js`). All authenticated endpoints expect `Authorization: Bearer <token>`.

## Frontend Setup (`client/`)

1. `cd client`
2. Install dependencies: `npm install`
3. Create `.env.local` overriding `NEXT_PUBLIC_API_BASE_URL` if the API is not on `http://localhost:4000`.
4. Run dev server: `npm run dev` (opens http://localhost:3000)

The app reads the stored JWT (`localStorage`) to authorize requests and redirects to `/auth` when unauthenticated.

## Running Both Services Together

From the repository root on Windows you can double-click `run-dev.bat` or execute it from a prompt to spawn both servers in separate terminals. On other platforms, start each service manually via the steps above.

## Usage Walkthrough

1. Visit `http://localhost:3000/auth` and sign in with `admin` / `password123`.
2. Land on the hotel list to manage properties (create/edit/delete, jump to detail pages).
3. Open a hotel to see its room types plus inline rate-adjustment controls.
4. Navigate to `/room-types` for a hotel-centric management view with adjustment/history dialogs.

## Trade-offs & Future Work

- **Database & migrations:** The spec called for Alembic/SQLAlchemy; this build uses MySQL with runtime schema creation for speed. Swap to a migration tool (Prisma, Sequelize, or actual Alembic + FastAPI) if stricter SQL change management is required.
- **Auth scope:** Single seeded admin user keeps the demo simple; extend with user CRUD/roles before production.
- **Testing:** Manual verification only. Adding API integration tests (Vitest/Jest + supertest) and component tests (Testing Library) would harden the codebase.
- **Hosting:** Local dev only. Containerization (Docker compose for API + DB + client) would simplify deployment.
