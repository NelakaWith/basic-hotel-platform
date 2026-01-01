# Basic Hotel Platform API

Express + MySQL backend for the minimal hotel admin tool. Includes auth, hotel CRUD, room type CRUD, and rate adjustments with history. Tables bootstrap automatically at startup.

## Prerequisites

- Node 18+
- MySQL 8+ available and a database created (default name `hotelsdb`).

## Setup

1. Copy env template and adjust as needed:
   - `cp .env.example .env`
   - Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; also `PORT`, `JWT_SECRET`.
2. Install Node deps: `npm install`
3. Start the API (auto-creates tables in MySQL): `npm run dev` (with nodemon) or `npm start`.
4. Seed initial data (admin user + demo hotel): `npm run seed` (idempotent; run after DB is reachable).

## Authentication

- Seeded user: `admin` / `password123`
- `POST /api/login` with `{ "username": "admin", "password": "password123" }` → `{ token }`
- Authenticated routes expect `Authorization: Bearer <token>`.

## Key Endpoints

- `GET /health`
- `POST /api/login`
- Hotels: `GET /api/hotels`, `POST /api/hotels`, `GET /api/hotels/:id`, `PUT /api/hotels/:id`, `DELETE /api/hotels/:id`
- Room types: `GET /api/hotels/:hotelId/room-types`, `POST /api/hotels/:hotelId/room-types`, `PUT /api/room-types/:id`, `DELETE /api/room-types/:id`
- Rate adjustments: `GET /api/room-types/:id/adjustments`, `POST /api/room-types/:id/adjustments`

`GET /api/hotels/:id` returns room types with `effective_rate` derived from the latest adjustment on or before today: `effective_rate = base_rate + adjustment_amount`.

## Notes / Trade-offs

- Uses MySQL via `mysql2` with simple runtime schema creation in `src/schema.js`. Swap to migrations if preferred.
- Validation via zod; errors return 400 with message. Auth returns 401 on bad/expired token.
- Effective rate uses the latest adjustment with `effective_date <= now`; history is retrievable per room type.
