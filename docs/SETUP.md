# StreamSphere — Local Setup & Deployment Guide

This guide details how to set up, run, seed, and test StreamSphere locally or via Docker Compose.

---

## 1. Prerequisites

- **Node.js**: v20+ recommended (v18+ supported).
- **npm**: v9+.
- **PostgreSQL**: Local PostgreSQL service (running on port 5432) OR Docker.
- **Redis** *(Optional)*: If offline or unavailable, StreamSphere automatically utilizes a high-performance in-memory TTL cache fallback without throwing errors.

---

## 2. Quickstart (Manual Setup)

### Step 2.1: Clone & Configure Environment

1. Copy `.env.example` to `backend/.env`:
   ```bash
   cp .env.example backend/.env
   ```
2. Verify PostgreSQL credentials in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/streamsphere?schema=public"
   ```

### Step 2.2: Database Preparation & Seeding

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Generate Prisma Client & Sync Database Tables
npx prisma generate
npx prisma db push

# Seed 4 Demo Accounts, 4 Subscription Plans, 10 Genres, and 24 Catalogue Titles
npm run prisma:seed
```

### Step 2.3: Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Build or start frontend dev server
npm run dev
```

The frontend will start on `http://localhost:3000`.

### Step 2.4: Start Backend Server

```bash
# In the backend directory
npm run dev
```

The API will listen on `http://localhost:5000`. Health check endpoint: `http://localhost:5000/api/health`.

---

## 3. Running via Docker Compose

To run the entire platform (PostgreSQL, Redis, Express Backend, and React Frontend) in containerized isolation:

```bash
cd infrastructure
docker compose up --build -d
```

- Web Application: `http://localhost:3000`
- API Health Check: `http://localhost:5000/api/health`

To inspect container logs:
```bash
docker compose logs -f backend
```

To stop containers:
```bash
docker compose down
```

---

## 4. Running Automated Tests

StreamSphere includes integration tests verifying user authentication, duplicate email prevention, catalogue filtering, watchlist ownership, subscription checkout idempotency, playback authorization enforcement, payment webhook verification, and administrator role restrictions.

```bash
# Run backend test suite
cd backend
npm run test
```

Expected output:
```
✓ tests/api.test.ts (11 tests)
Test Files  1 passed (1)
Tests  11 passed (11)
```

---

## 5. Demo Test Accounts

The seed script creates 4 predefined demo accounts to test all user roles and tier states:

| Role / Tier | Email Address | Password | Privileges & Notes |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@streamsphere.com` | `Admin123!` | Access to Admin Console, metrics, video CRUD, plan editor. |
| **Premium VIP** | `sarah@streamsphere.com` | `User123!` | Full 4K HDR playback on all titles, 4 concurrent streams. |
| **Basic** | `john@streamsphere.com` | `User123!` | Access to Basic & Free titles in 720p HD. |
| **Free** | `emma@streamsphere.com` | `User123!` | Access to standard Free catalogue titles in 480p. |

> **Pro-Tip**: The login page features **1-Click Quick Fill buttons** for all demo accounts, so you can test transitions between Free and Premium accounts with zero typing.
