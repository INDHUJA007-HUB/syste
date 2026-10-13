# 🎬 StreamSphere — Full-Stack OTT Video Streaming & Subscription Platform

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald)](https://github.com)
[![Tests](https://img.shields.io/badge/Tests-11%20Passed-brightgreen)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-cyan)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2F18-blue)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-indigo)](https://www.prisma.io/)

**StreamSphere** is a modern, responsive, and secure OTT video streaming and subscription platform inspired by leading entertainment services. It features adaptive bitrate video streaming, multi-tier subscription entitlement gates, HMAC-signed media token delivery, personal watchlists, continuous viewing progress resumption, and an administrative control center.

---

## 🌟 Key Capabilities & Features

### 1. 🎞️ Cinematic UI/UX & Responsive Streaming
- **Cinema Dark Aesthetics**: Tailored `#0a0d14` obsidian palette with crimson (`#e50914`) and electric indigo accents, glassmorphic headers, and smooth micro-interactions.
- **Cinematic Hero Banner**: Large banner featuring high-resolution backdrops, metadata tags, instant "Play Movie" action, and watchlist toggles.
- **Integrated Video Player**: HTML5 and HLS (`hls.js`) adaptive bitrate streaming with play/pause, 10s skip buttons, scrubber progress bar, volume controls, playback speed selector (0.5x–2x), and fullscreen mode.
- **Instant Playback Resumption**: Continuous heartbeat saves position every 5 seconds to PostgreSQL; prompt offers 1-click resumption across sessions.

### 2. 🔐 Rigorous Playback Authorization & Signed Media (Section 7)
- **Zero Browser Authority**: The client is never trusted for entitlement validation.
- **Entitlement Policy Engine**:
  - `FREE`: Access to all Free tier catalogue entries (480p).
  - `BASIC` ($7.99/mo): Access to Basic & Free movies in 720p HD.
  - `STANDARD` ($12.99/mo): Access to Standard, Basic & Free in 1080p Full HD on 2 simultaneous screens.
  - `PREMIUM` ($17.99/mo): Full VIP library including 4K Ultra HD and 4 concurrent screens.
- **HMAC-SHA256 Signed Media Tokens**: Video streams are protected with short-lived signed tokens (`/api/media/stream/:videoId?token=...`) embedding user ID, video ID, and session expiration, preventing hotlinking and unrestricted URL exposure.

### 3. 💳 Sandbox Payment Gateway & Idempotent Checkout (Section 8)
- **Order Summary & Sandbox Simulator**: Safe sandbox checkout supporting 1-click test cards (Visa, Mastercard, and simulated card decline).
- **Idempotency Protection**: Every checkout operation accepts an `idempotencyKey` to prevent duplicate charges.
- **HMAC Webhook Verification**: `POST /api/payments/webhook` verifies cryptographic signatures (`x-webhook-signature`) and activates subscriptions transactionally.

### 4. 📊 Administrator Management Console (Section 10)
- **Live Platform Metrics**: Real-time cards showing total users, active subscriptions, published titles, and total gross revenue.
- **Catalogue CRUD**: Create, edit, and delete movies with genre tagging, duration, rating, and plan tier requirements (automatically flushes Redis cache).
- **Subscription & Transaction Logs**: Live payment audit trail showing customer details and billing status.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router DOM, React Hook Form, Zod, Lucide React, Hls.js |
| **Backend** | Node.js, Express, TypeScript, RESTful architecture, Prisma ORM, Bcrypt, JWT (Short-lived 15m access + 7d rotating refresh tokens) |
| **Database & Cache** | PostgreSQL 16/18, Redis 7 (with transparent high-performance in-memory TTL cache fallback) |
| **Infrastructure** | Docker Compose, Multi-stage builds, TLS/HTTPS readiness, Helmet security headers, CORS protection |
| **Testing** | Vitest, Supertest integration test suite (11 unit & integration tests) |

---

## 🚀 Quick Start Guide

### 1. Database Setup & Seeding

```bash
# In the backend directory
cd backend
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
```

This seeds 4 demo accounts, 4 subscription plans, 10 genres, and 24 rich movie catalogue titles with valid public video sources.

### 2. Launch Backend API Server

```bash
npm run dev
# Running on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 3. Launch Frontend Web App

```bash
cd ../frontend
npm install
npm run dev
# Running on http://localhost:3000
```

---

## 🧪 Demo Test Accounts

The platform includes 1-Click Login buttons on the sign-in page:

| Account | Email | Password | Role / Plan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@streamsphere.com` | `Admin123!` | Administrator (Full Console Access) |
| **Sarah** | `sarah@streamsphere.com` | `User123!` | Active Premium Tier (4K VIP Access) |
| **John** | `john@streamsphere.com` | `User123!` | Active Basic Tier (720p Access) |
| **Emma** | `emma@streamsphere.com` | `User123!` | Free Tier Member (Ad-Supported) |

---

## 📂 Project Structure

```
streamsphere/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # 13 relational models & indexes
│   │   └── seed.ts             # Demo users, plans, genres, 24 titles
│   ├── src/
│   │   ├── config/             # Environment, Prisma singleton, Redis fallback
│   │   ├── controllers/        # Request controllers
│   │   ├── middleware/         # Auth, Role, ErrorHandler, RateLimiter, Zod
│   │   ├── routes/             # REST modular endpoints
│   │   ├── schemas/            # Zod validation schemas
│   │   ├── services/           # Domain business logic & HMAC signing
│   │   └── utils/              # Token generation, password hashing
│   └── tests/
│       └── api.test.ts         # 11 Vitest integration tests
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, VideoCard, Carousel, HeroBanner, PlanCard
│   │   ├── context/            # AuthContext & entitlement checks
│   │   ├── pages/              # Landing, Home, Details, Player, Plans, Checkout, Dashboard, Admin
│   │   ├── services/           # Axios API client & auto-refresh interceptors
│   │   └── types/              # TypeScript interface definitions
│   └── index.html
├── infrastructure/
│   └── docker-compose.yml      # Multi-container Postgres, Redis, App stack
├── docs/
│   ├── HLD.md                  # High-Level Architecture & Context Diagrams
│   ├── LLD.md                  # Low-Level Sequence & Database ER Diagrams
│   ├── API.md                  # Complete REST API Specification
│   └── SETUP.md                # Detailed Local & Production Setup Guide
├── .env.example
└── README.md
```

---

## 🛡️ Production Recommendations & Limitations

1. **Cloud Transcoding**: For local development, StreamSphere streams legal, open-source Creative Commons high-definition videos (e.g., Blender Open Projects: *Tears of Steel*, *Cosmos Laundromat*, *Big Buck Bunny*, *Sintel*). In production, configure an AWS Elemental MediaConvert or FFmpeg queue worker consuming an S3 ingest bucket.
2. **Cloud CDN & DRM**: The backend generates short-lived HMAC signed tokens. In multi-region deployments, integrate AWS CloudFront Signed Cookies or Cloudflare Stream Token Authentication with Widevine/FairPlay DRM where required by content licensors.
3. **Live Payment Gateways**: The sandbox simulator provides idempotent checkout and HMAC webhook processing. For production, swap mock handler keys with verified Stripe or Adyen webhook endpoints.
