# ByTe Real Estate Platform — Architecture

> **Document type:** Architecture Reference + Architecture Decision Records (ADRs)
> **Last updated:** June 15, 2026
> **Owner:** Emmanuel (CTO)
> **Status:** Living document — update this file when any architectural decision changes.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Service Map](#3-service-map)
4. [Request Lifecycle](#4-request-lifecycle)
5. [Data Architecture](#5-data-architecture)
6. [Authentication & Authorization Flow](#6-authentication--authorization-flow)
7. [Media Pipeline](#7-media-pipeline)
8. [WhatsApp Integration Architecture](#8-whatsapp-integration-architecture)
9. [Notification System](#9-notification-system)
10. [Search Architecture](#10-search-architecture)
11. [Analytics Pipeline](#11-analytics-pipeline)
12. [Infrastructure & Deployment](#12-infrastructure--deployment)
13. [CI/CD Pipeline](#13-cicd-pipeline)
14. [Security Architecture](#14-security-architecture)
15. [Architecture Decision Records (ADRs)](#15-architecture-decision-records-adrs)

---

## 1. System Overview

ByTe is a **property discovery and trust platform** connecting real estate developers and agents with property seekers across African markets. The platform is built around three core architectural principles:

**1. Low-friction access** — Public browsing requires no account. Authentication only unlocks developer and account-scoped features.

**2. WhatsApp-first communication** — The platform does not handle in-app messaging. All negotiation flows through WhatsApp. The platform's job is to build trust and surface the right listing so the WhatsApp conversation can happen.

**3. Mobile-first, low-bandwidth** — Every architectural decision is evaluated against a mid-range Android device on a 3G connection in Accra, Nairobi, or Lagos.

### What ByTe is NOT

- Not a transaction platform. No payment handling, no contracts, no escrow.
- Not a chat platform. All communication happens on WhatsApp.
- Not a government registry integration. Land verification is out of scope for MVP.

---

## 2. High-Level Architecture

```
                        ┌─────────────────────────────────────────────────┐
                        │                   CLIENT LAYER                  │
                        │                                                 │
                        │   Browser / PWA (Next.js 14 — App Router)       │
                        │   Mobile Safari / Chrome on Android             │
                        │   375px viewport · 3G bandwidth budget          │
                        └──────────────────────┬──────────────────────────┘
                                               │ HTTPS
                                               ▼
                        ┌─────────────────────────────────────────────────┐
                        │                  EDGE / PROXY                   │
                        │                                                 │
                        │   Nginx (SSL termination, rate limiting,        │
                        │   gzip compression, static asset caching,       │
                        │   security headers)                             │
                        │                                                 │
                        │   app.byte.africa  ──► Next.js :3000            │
                        │   api.byte.africa  ──► Express API :4000        │
                        └──────────────┬──────────────────┬───────────────┘
                                       │                  │
                    ┌──────────────────▼──┐    ┌──────────▼──────────────┐
                    │   FRONTEND SERVICE  │    │    BACKEND API SERVICE  │
                    │                     │    │                         │
                    │   Next.js 14        │    │   Express + TypeScript  │
                    │   React 18          │    │   Prisma ORM            │
                    │   Tailwind CSS      │    │   Zod validation        │
                    │   Zustand + RQ      │    │   JWT auth              │
                    │   Mapbox GL JS      │    │   BullMQ workers        │
                    │   PostHog           │    │   Winston logger        │
                    │   Sentry            │    │   Sentry                │
                    └──────────────────── ┘    └──────────┬──────────────┘
                                                          │
                              ┌───────────────────────────┼────────────────────────┐
                              │                           │                        │
                   ┌──────────▼─────────┐   ┌────────────▼──────────┐  ┌──────────▼──────────┐
                   │    PostgreSQL 15    │   │      Redis 7          │  │   Cloudinary CDN    │
                   │                    │   │                        │  │                     │
                   │  Primary data store│   │  BullMQ job queues    │  │  Image + video      │
                   │  Full-text search  │   │  API response cache   │  │  storage + CDN      │
                   │  Prisma migrations │   │  Session store        │  │  Auto WebP/resize   │
                   └────────────────────┘   └────────────────────────┘  └─────────────────────┘

                              ┌───────────────────────────────────────────┐
                              │             THIRD-PARTY SERVICES          │
                              │                                           │
                              │  Resend (transactional email)             │
                              │  Mapbox (property location maps)          │
                              │  WhatsApp deeplinks (wa.me — no API key)  │
                              │  PostHog (analytics + feature flags)      │
                              │  Sentry (error monitoring)                │
                              │  UptimeRobot (uptime alerts)              │
                              └───────────────────────────────────────────┘
```

---

## 3. Service Map

```
byte-realestate/  (monorepo)
│
├── frontend/               Next.js 14 web app
│   Port: 3000 (dev)        Served via Nginx in production
│   Env: NEXT_PUBLIC_*      No secrets — all public vars
│
├── backend/                Express REST API
│   Port: 4000              Never exposed directly — behind Nginx
│   Env: All secrets        JWT keys, DB URL, Cloudinary, etc.
│
├── database/               Prisma schema + migrations
│   Managed by: Clement     Not a running service — schema source of truth
│
└── infrastructure/
    ├── postgres:5432       Never exposed to internet — internal Docker network only
    ├── redis:6379          Never exposed to internet — internal Docker network only
    └── nginx:80/443        Public-facing entry point
```

### Port Map

| Service    | Internal Port | Public URL                  | Exposed? |
|------------|---------------|-----------------------------|----------|
| Frontend   | 3000          | https://app.byte.africa     | Via Nginx |
| Backend    | 4000          | https://api.byte.africa     | Via Nginx |
| PostgreSQL | 5432          | —                           | ❌ Never |
| Redis      | 6379          | —                           | ❌ Never |
| Nginx      | 80, 443       | Public internet             | ✅ Yes   |

---

## 4. Request Lifecycle

### Public Browse Flow (No Auth)

```
User opens app.byte.africa/properties
          │
          ▼
   Nginx receives request
   → serves Next.js frontend (or cached HTML)
          │
          ▼
   Next.js SSR / ISR renders page
   → calls api.byte.africa/api/v1/properties
          │
          ▼
   Nginx proxies to Express API :4000
          │
          ▼
   rateLimiter middleware (100 req/min/IP)
   requestLogger middleware
          │
          ▼
   properties.router → properties.controller
          │
          ▼
   properties.service
   → checks Redis cache (key: "props:list:{hash_of_filters}")
   → CACHE HIT: return cached response (TTL: 30s)
   → CACHE MISS: query PostgreSQL via Prisma
          │
          ▼
   Prisma query with filters + pagination
   → PostgreSQL returns rows
          │
          ▼
   Service writes result to Redis cache
   → Returns ApiResponse to controller
          │
          ▼
   Controller sends JSON response
          │
          ▼
   Next.js hydrates React with data
   → React Query caches response client-side (stale: 60s)
          │
          ▼
   User sees property grid
```

### Authenticated Developer Flow (Create Listing)

```
Developer fills create listing form
          │
          ▼
   React Hook Form validates with Zod schema
          │
          ▼
   Images uploaded directly to Cloudinary
   (client-side, using signed upload preset)
   → Cloudinary returns { url, publicId } per image
          │
          ▼
   Form submits to POST /api/v1/properties
   with { ...propertyData, media: [{ url, publicId }] }
   Authorization: Bearer {accessToken}
          │
          ▼
   authenticate middleware validates JWT
   → Decodes { userId, role, developerId }
          │
          ▼
   validate middleware runs Zod schema on req.body
          │
          ▼
   properties.controller → properties.service
          │
          ▼
   properties.service:
   → Creates Property record in PostgreSQL
   → Creates PropertyMedia records
   → Invalidates Redis cache for developer's listings
   → Enqueues notification job in BullMQ
          │
          ▼
   BullMQ notification worker processes job:
   → Creates Notification record in DB
   → (Future: send push notification)
          │
          ▼
   API returns 201 { success: true, data: { property } }
          │
          ▼
   Frontend redirects to /properties/{slug}
   React Query invalidates properties cache
```

---

## 5. Data Architecture

### Database Choice: PostgreSQL over MongoDB

See [ADR-002](#adr-002-postgresql-over-mongodb) for full rationale.

### Entity Relationship Overview

```
User ──────────────── DeveloperProfile
 │  (1:1, optional)         │
 │                          │ (1:N)
 │                          ▼
 │                       Property ─────── PropertyMedia (N images/videos)
 │                          │
 │                          │ (1:N)
 │  (N:M via)               ▼
 └──── PropertyFavorite    Appointment
 │
 │  (1:N)
 └──── DeveloperRating ──── DeveloperProfile
 │
 └──── Report (target: Property or Developer)

DeveloperProfile (1:N)──── Notification
Property (1:N) ──────────── PropertyAnalytics (daily rollup per property)
```

### Caching Strategy

| Data                     | Cache Key Pattern                      | TTL    | Invalidated When             |
|--------------------------|----------------------------------------|--------|------------------------------|
| Property list (browse)   | `props:list:{md5(queryString)}`        | 30s    | Any property created/updated |
| Single property          | `props:single:{id}`                    | 60s    | That property updated        |
| Developer profile        | `dev:profile:{id}`                     | 5 min  | Profile updated              |
| Featured properties      | `props:featured`                       | 5 min  | Featured flag changes        |
| Search results           | `search:{md5(q+filters)}`              | 15s    | Not cached (too dynamic)     |
| Developer notifications  | Not cached (real-time requirement)     | —      | —                            |

### Data Retention

- Property view events: stored in `PropertyAnalytics` as daily rollups. Raw events are not stored.
- Refresh tokens: purged after expiry via a daily cleanup job.
- Notifications: kept indefinitely (no volume concern at MVP scale).
- Soft deletes: Properties use `status: SUSPENDED` not hard delete. Hard delete is admin-only.

---

## 6. Authentication & Authorization Flow

### Token Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│  ACCESS TOKEN                                                        │
│  Type: JWT (HS256)                                                  │
│  Expiry: 15 minutes                                                 │
│  Payload: { userId, role, developerId, iat, exp }                  │
│  Sent as: Authorization: Bearer {token} header                      │
│  Stored client-side: memory only (Zustand store, not localStorage) │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  REFRESH TOKEN                                                       │
│  Type: Opaque random string (crypto.randomBytes(64).toString('hex'))│
│  Expiry: 7 days                                                     │
│  Stored server-side: refresh_tokens table (hashed)                 │
│  Sent to client: HttpOnly, Secure, SameSite=Strict cookie          │
│  Rotation: new refresh token issued on every /auth/refresh call    │
└─────────────────────────────────────────────────────────────────────┘
```

### Silent Refresh Flow

```
React app starts
      │
      ▼
Access token in memory?
      │
   No ──► POST /api/v1/auth/refresh (sends HttpOnly cookie automatically)
              │
              ├─ 200: new access token → store in Zustand → user is authenticated
              │
              └─ 401: cookie expired/invalid → user sees login page
      │
   Yes ──► Decode JWT, check exp
              │
              ├─ exp > now+2min: use it
              │
              └─ exp ≤ now+2min: silent refresh (same flow above)
```

### Role-Based Authorization

```
Role: USER
  └─ Can: browse, search, favorite (with account), rate developers,
          schedule appointments, submit reports

Role: DEVELOPER
  └─ Inherits: all USER permissions
  └─ Can: create/edit/delete own listings, view own analytics,
          manage own appointments, view own notifications,
          update own developer profile

Role: ADMIN
  └─ Inherits: all DEVELOPER permissions
  └─ Can: verify/ban developers, suspend any listing,
          view/resolve all reports, access admin panel
```

Authorization is enforced in two places:
1. **Middleware layer** — `authorize(Role.DEVELOPER)` on routes requiring developer role.
2. **Service layer** — ownership checks (e.g., `if (property.developerId !== req.user.developerId) throw new ApiError(403)`). This is the critical layer. Middleware is defense in depth.

---

## 7. Media Pipeline

ByTe uses **client-side direct upload** to Cloudinary. Images never pass through the Express backend server. This is a deliberate architectural choice to keep the API server lean and avoid bandwidth costs.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MEDIA UPLOAD FLOW                                │
│                                                                         │
│  1. Developer selects images in <MediaUploader> component               │
│                                                                         │
│  2. Frontend calls POST /api/v1/uploads/signature                       │
│     → Backend generates Cloudinary signed upload params                 │
│     → Returns: { signature, timestamp, apiKey, cloudName, folder }      │
│                                                                         │
│  3. Frontend uploads DIRECTLY to Cloudinary API                         │
│     → POST https://api.cloudinary.com/v1_1/{cloudName}/image/upload    │
│     → Sends: file + signature + timestamp + folder                      │
│     → Cloudinary validates signature (prevents unsigned uploads)        │
│                                                                         │
│  4. Cloudinary returns: { url, publicId, width, height, format }        │
│     → Cloudinary auto-generates WebP variant                            │
│     → Cloudinary serves via global CDN                                  │
│                                                                         │
│  5. Frontend stores { url, publicId } in form state                     │
│     → Included in final POST /api/v1/properties payload                 │
│     → Backend saves PropertyMedia records with url + publicId           │
│                                                                         │
│  6. On image delete:                                                     │
│     → Frontend calls DELETE /api/v1/uploads/:publicId                   │
│     → Backend calls Cloudinary destroy API (server-side, authenticated) │
│     → Backend deletes PropertyMedia record                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Image Transformation Strategy

Cloudinary URL transformations are used to serve appropriately sized images for each context:

| Context              | Transformation                        | Example |
|----------------------|---------------------------------------|---------|
| Property card (grid) | w_400,h_280,c_fill,f_auto,q_auto     | 400×280, auto format, auto quality |
| Property gallery     | w_1200,h_800,c_limit,f_auto,q_auto   | Max 1200px, preserve ratio |
| Developer avatar     | w_80,h_80,c_fill,g_face,r_max,f_auto | 80×80 circle, face-detect crop |
| OG image             | w_1200,h_630,c_fill,f_jpg,q_90       | Fixed OG size |

All transformation URLs are built in `lib/cloudinary.ts` on the frontend. Never hardcode transformation strings in components.

### Limits

- Maximum images per listing: **10**
- Maximum file size per image: **10 MB**
- Maximum file size per video: **50 MB**
- Allowed image formats: JPEG, PNG, WebP
- Allowed video formats: MP4, MOV
- Enforced at: Multer middleware (size) + Cloudinary upload preset (format + size)

---

## 8. WhatsApp Integration Architecture

WhatsApp integration uses `wa.me` deeplinks exclusively. No WhatsApp Business API, no API key, no cost.

### Deeplink Format

```
https://wa.me/{internationalNumber}?text={encodedMessage}

Example:
https://wa.me/233244123456?text=Hi%2C%20I%27m%20interested%20in%20your%20property%3A%20%22Luxury%203BR%20Apartment%20in%20East%20Legon%22%20listed%20on%20ByTe.%20Can%20we%20discuss%3F
```

### Security Consideration: Number Masking

Developer WhatsApp numbers are **never rendered in HTML source** on page load. This prevents scraping of phone numbers by bots.

```
Flow:
1. User clicks "Contact on WhatsApp" button
2. onClick handler fires (no link in DOM before click)
3. POST /api/v1/analytics/events { type: "WHATSAPP_CLICK", propertyId }
4. GET /api/v1/properties/{id}/whatsapp-link
   → Backend fetches developer's whatsappNumber
   → Backend builds deeplink with pre-filled message
   → Returns { deeplink: "https://wa.me/..." }
5. Frontend opens deeplink in new tab: window.open(deeplink, '_blank')
```

This adds ~200ms latency to the WhatsApp click but protects developer numbers from scrapers. The UX is acceptable because the user has already expressed intent by clicking.

### Pre-filled Message Template

```typescript
// lib/whatsapp.ts
export function buildWhatsAppMessage(property: {
  title: string;
  city: string;
  listingType: 'SALE' | 'RENT';
  price: number;
}): string {
  const action = property.listingType === 'SALE' ? 'purchase' : 'rent';
  return (
    `Hi, I'm interested in the ${action} of your property: ` +
    `"${property.title}" in ${property.city}, listed on ByTe. ` +
    `Can we discuss the details?`
  );
}
```

---

## 9. Notification System

### Notification Types

| Type                         | Trigger                                          | Delivery         |
|------------------------------|--------------------------------------------------|------------------|
| `PROPERTY_LIKED`             | User adds property to favorites                 | In-app           |
| `PROPERTY_VIEWED_MILESTONE`  | Property reaches 10, 50, 100, 500 views         | In-app           |
| `APPOINTMENT_REQUESTED`      | Guest schedules a visit                          | In-app + Email   |
| `APPOINTMENT_CONFIRMED`      | Developer confirms appointment                   | Email to guest   |
| `DEVELOPER_VERIFIED`         | Admin verifies developer account                 | In-app + Email   |

### Notification Flow

```
Event occurs (e.g., user favorites a property)
          │
          ▼
  Service layer enqueues job:
  notificationQueue.add('send-notification', {
    developerId,
    type: 'PROPERTY_LIKED',
    propertyId,
    propertyTitle
  })
          │
          ▼
  BullMQ worker picks up job:
  → Creates Notification record in PostgreSQL
  → If email required: enqueues email job in emailQueue
          │
          ▼
  emailQueue worker:
  → Renders email template
  → Sends via Resend API
          │
          ▼
  Developer polls GET /api/v1/notifications
  (React Query refetches every 30 seconds on notifications page)
```

### Why Polling, Not WebSockets

For MVP, notification delivery uses **polling** (React Query refetch interval) rather than WebSockets or Server-Sent Events. Rationale:
- Simpler to implement and debug
- No persistent connection overhead on a single VPS
- Notification latency of 30s is acceptable for the use case (likes, views)
- WebSockets can be added in v2 when concurrent user load justifies it

---

## 10. Search Architecture

### MVP: PostgreSQL Full-Text Search

Search is implemented using PostgreSQL's native `tsvector` / `tsquery` full-text search.

```sql
-- The searchVector column (managed by Prisma + trigger)
-- Automatically updated on INSERT and UPDATE via PostgreSQL trigger

ALTER TABLE properties ADD COLUMN search_vector tsvector;

CREATE INDEX idx_properties_search_vector ON properties USING GIN (search_vector);

-- Trigger to keep searchVector in sync
CREATE OR REPLACE FUNCTION update_property_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.address, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.region, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Search Query Building

```typescript
// search.service.ts
const query = await prisma.$queryRaw`
  SELECT p.*, ts_rank(p.search_vector, query) AS rank
  FROM properties p, plainto_tsquery('english', ${searchTerm}) query
  WHERE p.search_vector @@ query
    AND p.status = 'ACTIVE'
    ${city ? Prisma.sql`AND p.city ILIKE ${`%${city}%`}` : Prisma.empty}
    ${priceMax ? Prisma.sql`AND p.price <= ${priceMax}` : Prisma.empty}
  ORDER BY rank DESC, p.created_at DESC
  LIMIT ${limit} OFFSET ${offset}
`;
```

### v2 Migration Path: Meilisearch

If PostgreSQL FTS becomes a performance bottleneck (query time > 500ms at scale), the plan is:

1. Deploy Meilisearch as a new Docker service
2. Sync existing properties to Meilisearch index on startup
3. Add Meilisearch indexing calls to `properties.service.ts` on create/update/delete
4. Switch `search.service.ts` to query Meilisearch instead of PostgreSQL
5. The API contract remains identical — no frontend changes required

This migration is designed to be a **backend-only change**, which is why the search endpoint is isolated in its own service from day one.

---

## 11. Analytics Pipeline

### Event Types

| Event              | Triggered By                    | Stored In              |
|--------------------|---------------------------------|------------------------|
| `property_view`    | GET /api/v1/properties/:id      | PropertyAnalytics (aggregated daily) |
| `whatsapp_click`   | POST /api/v1/analytics/events   | PropertyAnalytics (aggregated daily) |
| `property_liked`   | POST /api/v1/favorites/:id      | PropertyFavorite count |

### Aggregation Strategy

Raw view events are not stored individually (no event log table). Instead, the backend uses **atomic increments** directly on the `PropertyAnalytics` daily row:

```sql
-- On each property view
INSERT INTO property_analytics (property_id, date, views)
VALUES ({propertyId}, CURRENT_DATE, 1)
ON CONFLICT (property_id, date)
DO UPDATE SET views = property_analytics.views + 1;
```

This is efficient for write-heavy analytics at MVP scale. An event store (Kafka, ClickHouse) is appropriate for v2 when analytical queries become complex.

---

## 12. Infrastructure & Deployment

### Server Specification

```
Provider:   Hetzner Cloud (recommended) or DigitalOcean
Plan:       CX31 (4 vCPU, 8 GB RAM, 160 GB NVMe SSD)
OS:         Ubuntu 22.04 LTS
Location:   Frankfurt, EU (lowest latency to West Africa)
Cost:       ~€15–20/month (Hetzner) | ~$48/month (DigitalOcean)
```

### Docker Compose (Production)

```yaml
# infrastructure/docker-compose.prod.yml

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: byte_realestate
      POSTGRES_USER: byte_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal
    # NOT exposed to host — internal network only

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - internal
    # NOT exposed to host — internal network only

  backend:
    image: byte/backend:${GIT_SHA}
    restart: always
    env_file: .env.production
    networks:
      - internal
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: byte/frontend:${GIT_SHA}
    restart: always
    env_file: .env.frontend.production
    networks:
      - internal
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/sites-available:/etc/nginx/conf.d:ro
      - certbot_certs:/etc/letsencrypt:ro
      - certbot_www:/var/www/certbot:ro
    networks:
      - internal
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  redis_data:
  certbot_certs:
  certbot_www:

networks:
  internal:
    driver: bridge
```

### Backup Strategy

```
Database backup (pg_dump):
  Schedule: Daily at 02:00 WAT (01:00 UTC)
  Retention: 30 daily backups
  Storage: Cloudflare R2 (S3-compatible, free egress)
  Script: /infrastructure/scripts/backup-db.sh
  Alert: UptimeRobot monitors a /api/health?backup=last endpoint
         that returns timestamp of last successful backup

Backup restore test:
  Frequency: Weekly (manual, by Clement)
  Process: Restore to a local Docker Postgres, run smoke queries
```

---

## 13. CI/CD Pipeline

```
Developer pushes branch
         │
         ▼
   GitHub Actions triggers: ci.yml
         │
   ┌─────┴──────────────────────────────────┐
   │              CI JOBS (parallel)         │
   │                                         │
   │  job: lint                              │
   │  → npm run lint (frontend + backend)   │
   │  → Fail if any ESLint error            │
   │                                         │
   │  job: test                              │
   │  → npm test --workspace=backend        │
   │    (Jest + Supertest, Postgres test DB) │
   │  → npm test --workspace=frontend       │
   │    (Vitest + React Testing Library)    │
   │                                         │
   │  job: build                             │
   │  → npm run build --workspace=frontend  │
   │    (Next.js build — catches TS errors) │
   │  → npm run build --workspace=backend   │
   │    (tsc --noEmit)                      │
   └─────────────────────────────────────────┘
         │
         │ All jobs green?
         ▼
   PR can be reviewed and merged to develop
         │
         ▼
   Merge to develop triggers: deploy-staging.yml
   → Docker builds images: byte/backend:{sha}, byte/frontend:{sha}
   → Pushes to GitHub Container Registry (ghcr.io)
   → SSH into staging VPS
   → docker compose pull && docker compose up -d
   → Run Prisma migrations
   → Smoke test: curl https://staging.api.byte.africa/api/health
         │
         ▼
   Emmanuel reviews staging
         │
         ▼
   Manual trigger: deploy-production.yml
   → Same image (already built for staging) promoted to production
   → Zero-downtime: docker compose up -d --no-deps backend
   → Wait for health check
   → docker compose up -d --no-deps frontend
   → Post to team WhatsApp: "✅ Deploy {sha} to production — all green"
```

---

## 14. Security Architecture

### Defense Layers

```
Layer 1: Network
  → Nginx: only ports 80 and 443 open to internet
  → UFW firewall: blocks all other ports
  → PostgreSQL and Redis: internal Docker network only, never exposed

Layer 2: Application (Nginx)
  → HTTPS enforced (HTTP → HTTPS 301 redirect)
  → SSL: TLS 1.2 minimum, TLS 1.3 preferred
  → Security headers: HSTS, X-Frame-Options, X-Content-Type-Options,
    Content-Security-Policy, Referrer-Policy
  → Rate limiting: 100 req/min on API, 5 req/min on auth routes

Layer 3: Application (Express)
  → Helmet.js: sets all recommended security headers
  → CORS: whitelist only app.byte.africa and localhost:3000 (dev)
  → Rate limiting: express-rate-limit per IP per route group
  → Request body size: 1MB max (json) to prevent payload attacks
  → File uploads: MIME type validation + size limits via Multer

Layer 4: Authentication
  → JWT access tokens: 15-minute expiry, HS256
  → Refresh tokens: opaque, hashed in DB, HttpOnly cookie
  → Bcrypt: 12 rounds for all password hashing
  → Brute force protection: 5 failed logins → 15-minute lockout

Layer 5: Authorization
  → Middleware: role check on all protected routes
  → Service layer: ownership check on all mutating operations
  → Admin routes: require both JWT auth AND ADMIN role
  → Principle of least privilege: DEVELOPER role cannot see other devs' analytics

Layer 6: Data
  → Prisma ORM: parameterized queries prevent SQL injection
  → No raw SQL except for FTS queries (all parameterized via Prisma.sql)
  → WhatsApp numbers: never in HTML source before user interaction
  → Cloudinary: signed uploads only (no unsigned upload preset in production)
```

---

## 15. Architecture Decision Records (ADRs)

### ADR-001: Monorepo Structure

**Date:** June 15, 2026
**Status:** Accepted
**Decision:** Use a single Git repository with npm workspaces for frontend, backend, and database.

**Context:** The team of 4 needs to share types, coordinate schema changes with API changes, and keep CI/CD simple.

**Consequences:**
- ✅ Single PR can span frontend + backend + schema change
- ✅ Shared TypeScript types possible between packages
- ✅ One CI/CD pipeline to maintain
- ⚠️ Repository grows in size over time
- ⚠️ All engineers must be careful not to introduce circular dependencies between packages

---

### ADR-002: PostgreSQL over MongoDB

**Date:** June 15, 2026
**Status:** Accepted
**Decision:** Use PostgreSQL as the primary database, not MongoDB.

**Context:** The initial proposal mentioned both PostgreSQL and MongoDB as options.

**Rationale:**
- Property data is inherently relational: properties belong to developers, which have ratings, which belong to users, which have favorites.
- Enforcing data integrity (e.g., a property cannot exist without a developer) is critical for a trust platform. PostgreSQL's foreign key constraints enforce this at the database level.
- PostgreSQL's native full-text search (tsvector/GIN) covers MVP search needs without adding a search service.
- Prisma ORM has excellent PostgreSQL support and type-safe query generation.
- The team has more combined experience with PostgreSQL.

**Consequences:**
- ✅ ACID guarantees — no orphaned records, no data inconsistency
- ✅ Full-text search built in (saves running Elasticsearch for MVP)
- ✅ One database to operate and back up
- ⚠️ Schema changes require migrations (managed by Prisma Migrate)
- ⚠️ Flexible/unstructured data (e.g., property "amenities") stored as JSON column

---

### ADR-003: Next.js App Router (not Pages Router)

**Date:** June 15, 2026
**Status:** Accepted
**Decision:** Use Next.js 14 with the App Router, not the legacy Pages Router.

**Rationale:**
- App Router enables React Server Components — critical for property listing pages where SEO and initial load performance matter.
- Nested layouts reduce boilerplate (dashboard layout, public layout, admin layout).
- Built-in support for ISR with `revalidate` makes property pages cached and fast without a separate caching layer.
- The App Router is the future of Next.js. Starting with Pages Router would require migration later.

**Consequences:**
- ✅ RSC for property pages = faster FCP, better SEO
- ✅ Route groups for clean URL organization
- ✅ Built-in ISR for property pages
- ⚠️ Learning curve: "use client" / "use server" distinction must be understood by Claude (frontend engineer)
- ⚠️ Some React libraries not yet compatible with RSC — must use "use client" directive carefully

---

### ADR-004: Cloudinary for Media Storage

**Date:** June 15, 2026
**Status:** Accepted
**Decision:** Use Cloudinary for all image and video storage, not self-hosted MinIO or AWS S3.

**Rationale:**
- Auto-generates WebP variants and resizes on the fly via URL parameters.
- Global CDN included — critical for serving images fast on African mobile networks.
- Client-side direct upload (with signed presets) means images never hit the Express server — keeps the API server lean.
- Free tier covers MVP usage.
- `publicId` allows server-side deletion without storing full URLs in the DB.

**Consequences:**
- ✅ Zero image processing code to write
- ✅ Global CDN without managing CloudFront or nginx cache
- ✅ URL-based transformations (resize, crop, format) without any server code
- ⚠️ Vendor dependency — if Cloudinary pricing changes, migration effort is non-trivial
- ⚠️ Free tier limits: 25 GB storage, 25 GB bandwidth/month. Monitor this.

---

### ADR-005: VPS over Managed Cloud (Vercel/Railway/Render)

**Date:** June 15, 2026
**Status:** Accepted
**Decision:** Self-host on a VPS (Hetzner) with Docker Compose, not use managed platforms like Vercel + Railway.

**Rationale:**
- Cost: Hetzner CX31 at ~€15/month vs Vercel Pro (~$20/month) + Railway (~$20/month) = €15 vs $40+.
- Control: Full control over Nginx config, Redis, PostgreSQL tuning, networking.
- Scalability path: Adding more services (Meilisearch, background workers) is trivial on a VPS, expensive on managed platforms.
- Skills: Emmanuel's DevOps skills make VPS management a strength, not a burden.
- Unified domain: Easier to manage subdomains on a single server.

**Consequences:**
- ✅ Lower monthly cost
- ✅ No vendor lock-in on hosting
- ✅ Full control over infrastructure
- ⚠️ Emmanuel owns all server maintenance, security patching, and uptime
- ⚠️ No automatic scaling — if traffic spikes, manual intervention required
- ⚠️ Single point of failure (mitigated by backups + UptimeRobot alerts)

---

### ADR-006: No In-App Chat (WhatsApp-First)

**Date:** June 15, 2026
**Status:** Accepted
**Decision:** ByTe will never build in-app messaging for MVP. All communication goes through WhatsApp deeplinks.

**Rationale:**
- In-app chat requires: real-time infrastructure (WebSockets), message storage, notification delivery, read receipts, media sharing — weeks of engineering for a feature users already have for free on WhatsApp.
- Trust in African real estate markets is built via WhatsApp. Users trust WhatsApp conversations more than unknown in-app chat systems.
- Building in-app chat competes with WhatsApp's UX, which users know and prefer.
- Every hour spent on in-app chat is an hour not spent on listings, search, or trust features.

**Consequences:**
- ✅ Eliminates a major scope risk
- ✅ Aligns with actual user behavior
- ✅ Zero real-time messaging infrastructure to maintain
- ⚠️ ByTe has no visibility into conversations between developers and users
- ⚠️ Cannot track conversion from WhatsApp click to actual transaction

---

*ByTe Real Estate Platform — ARCHITECTURE.md*
*Maintained by Emmanuel (CTO). Update this document when any architectural decision changes.*
*Last updated: June 15, 2026*
