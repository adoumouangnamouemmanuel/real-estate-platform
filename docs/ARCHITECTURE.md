# ByTe Real Estate Platform — Architecture

> **Document type:** Architecture Reference + Architecture Decision Records (ADRs)
> **Last updated:** July 13, 2026
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

| Service    | Internal Port | Public URL              | Exposed?  |
| ---------- | ------------- | ----------------------- | --------- |
| Frontend   | 3000          | https://app.byte.africa | Via Nginx |
| Backend    | 4000          | https://api.byte.africa | Via Nginx |
| PostgreSQL | 5432          | —                       | ❌ Never  |
| Redis      | 6379          | —                       | ❌ Never  |
| Nginx      | 80, 443       | Public internet         | ✅ Yes    |

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

| Data                    | Cache Key Pattern                  | TTL   | Invalidated When             |
| ----------------------- | ---------------------------------- | ----- | ---------------------------- |
| Property list (browse)  | `props:list:{md5(queryString)}`    | 30s   | Any property created/updated |
| Single property         | `props:single:{id}`                | 60s   | That property updated        |
| Developer profile       | `dev:profile:{id}`                 | 5 min | Profile updated              |
| Featured properties     | `props:featured`                   | 5 min | Featured flag changes        |
| Search results          | `search:{md5(q+filters)}`          | 15s   | Not cached (too dynamic)     |
| Developer notifications | Not cached (real-time requirement) | —     | —                            |

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

### Frontend Authentication (Phase 5, Mock-Backed)

The frontend's auth screens (login, register, forgot/reset password, logout) are built against `services/mocks/auth.mock.ts`, following the same mock-first pattern as the Properties/Developer domains (ADR-007). See [ADR-009](#adr-009-frontend-auth-forms-built-against-mocks-with-a-documented-cookie-limitation) for the full rationale and its known limitation.

**Client-side session lifecycle:**

```
App loads
    │
    ▼
useAuthBootstrap runs once (root layout)
    │
    ▼
authService.refresh() — real, not-yet-existent backend call
    │
    ├─ succeeds (future, once backend exists) → hydrate Zustand authStore
    │
    └─ fails (current, expected in dev — no backend) → store stays cleared
    │
    ▼
authStore.setBootstrapped() — isBootstrapping: false
    │
    ▼
RequireAuth-gated routes now render their real check instead of a loading state
```

- Access token lives only in the Zustand `authStore` (memory), never `localStorage` — consistent with the token strategy above.
- `RedirectIfAuthenticated` (wraps `(auth)` routes) does **not** block on `isBootstrapping` — it only redirects once bootstrap resolves to "authenticated," so the common anonymous-visitor case renders the form immediately rather than waiting out a refresh round-trip.
- `RequireAuth` (wraps `(dashboard)`/`(admin)`) **does** block on `isBootstrapping`, since protected content must never flash before session state is confirmed.

**Protected route flow (defense in depth, two independent layers):**

```
Request for /dashboard or /admin
    │
    ▼
Layer 1 — proxy.ts (server, runs first)
    → No auth cookie present → redirect to /login?redirect=/dashboard
    → Cookie present → request reaches the React tree
    │
    ▼
Layer 2 — RequireAuth (client component, wraps the route's layout)
    → isBootstrapping → <Loading />
    → not authenticated → redirect to /login?redirect=<path>
    → authenticated but role too low → redirect to /forbidden
      (ROLE_RANK: USER=0 < DEVELOPER=1 < ADMIN=2, checked with >=, matching
      the role-inheritance model in the Role-Based Authorization section above)
    → passes both checks → render children
```

`getSafeRedirectPath` (`lib/authRedirect.ts`) validates the `?redirect=` query param before it's ever passed to `router.push()` — it rejects protocol-relative (`//evil.example`), absolute-external (`https://evil.example`), and non-path (`javascript:...`) values, since that param is attacker-controllable (OWASP open-redirect guard).

**Error handling strategy:**

- Login always shows a single generic "Invalid email or password." message, regardless of which part failed — prevents user enumeration.
- `requestPasswordReset` always resolves successfully whether or not the email matches an account — same anti-enumeration reasoning, applied specifically to the reset flow.
- Registration _does_ disclose a duplicate email ("An account with this email already exists.") — a deliberate, documented UX tradeoff for that one flow, not an oversight.
- Password policy is length-only (8–128 characters), matching current NIST SP 800-63B / OWASP ASVS guidance that favors length over forced composition rules.

**Known limitation:** mock `login`/`register` cannot set a real `HttpOnly` cookie (that requires a `Set-Cookie` header from an actual server), so session state does not survive a full page reload in this mock environment. **Update (Phase 6):** this used to also mean `proxy.ts`'s cookie check always won over `RequireAuth`, blocking the dashboard entirely — even the client-side redirect immediately after a successful mock login re-triggers `proxy.ts` (Next re-runs middleware on the RSC fetch behind every navigation, not just full page loads). `lib/mockSessionCookie.ts` now sets a non-`HttpOnly` marker cookie on login/register and clears it on logout, purely to satisfy `proxy.ts`'s presence check — see [ADR-010](#adr-010-dashboard-shell--the-mock-session-cookie-fix). `RequireAuth`'s role-forbidden path specifically is still unreachable via a real click path (no user-facing affordance ever points a wrong-role user at a dashboard route) and remains unit-tested only.

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

| Context              | Transformation                       | Example                            |
| -------------------- | ------------------------------------ | ---------------------------------- |
| Property card (grid) | w_400,h_280,c_fill,f_auto,q_auto     | 400×280, auto format, auto quality |
| Property gallery     | w_1200,h_800,c_limit,f_auto,q_auto   | Max 1200px, preserve ratio         |
| Developer avatar     | w_80,h_80,c_fill,g_face,r_max,f_auto | 80×80 circle, face-detect crop     |
| OG image             | w_1200,h_630,c_fill,f_jpg,q_90       | Fixed OG size                      |

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
  listingType: "SALE" | "RENT";
  price: number;
}): string {
  const action = property.listingType === "SALE" ? "purchase" : "rent";
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

| Type                        | Trigger                                 | Delivery       |
| --------------------------- | --------------------------------------- | -------------- |
| `PROPERTY_LIKED`            | User adds property to favorites         | In-app         |
| `PROPERTY_VIEWED_MILESTONE` | Property reaches 10, 50, 100, 500 views | In-app         |
| `APPOINTMENT_REQUESTED`     | Guest schedules a visit                 | In-app + Email |
| `APPOINTMENT_CONFIRMED`     | Developer confirms appointment          | Email to guest |
| `DEVELOPER_VERIFIED`        | Admin verifies developer account        | In-app + Email |

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

| Event            | Triggered By                  | Stored In                            |
| ---------------- | ----------------------------- | ------------------------------------ |
| `property_view`  | GET /api/v1/properties/:id    | PropertyAnalytics (aggregated daily) |
| `whatsapp_click` | POST /api/v1/analytics/events | PropertyAnalytics (aggregated daily) |
| `property_liked` | POST /api/v1/favorites/:id    | PropertyFavorite count               |

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

- Cost: Hetzner CX31 at ~~€15/month vs Vercel Pro (~~$20/month) + Railway (~$20/month) = €15 vs $40+.
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

### ADR-007: Frontend Domains Built Against Typed Mock Services, Not Stubbed Pages

**Date:** July 12, 2026
**Status:** Accepted
**Decision:** With no backend endpoints implemented yet, the Properties and Developer domains were built as complete, production-shaped frontend features backed by `services/*.service.ts` functions that return realistic mock data — not placeholder pages waiting on the API.

**Rationale:**

- Every mock service function's signature matches the query contract this document already specifies (§10 Search query building, §8 WhatsApp deeplink flow) — swapping in a real `fetch`/Axios call later is a query-building change inside one file, not a component redesign.
- `services/mocks/` holds the raw fixture data (`properties.mock.ts`, `developers.mock.ts`); `*.service.ts` files hold the filtering/sorting/pagination logic that will survive the swap. Developer records are defined once and referenced by both a property's embedded `developer` field and the developer's own profile, so frontend fixtures can't drift the way two independent mocks would.
- The WhatsApp deeplink flow (`lib/whatsapp.ts`'s `getWhatsAppLink`) is genuinely async and click-triggered even in mock form, preserving the number-masking shape from §8 rather than short-circuiting it.
- Two feature flags (`FEATURES.WHATSAPP_CONTACT`, `FEATURES.MAP_VIEW`) gate the two capabilities that are frontend-complete but backend-blocked (real developer phone numbers; a Mapbox key), so the UI ships honestly disabled rather than fake-functional.

**Consequences:**

- ✅ Backend integration for these domains is scoped to `services/*.service.ts` — no frontend component changes expected.
- ✅ Frontend and backend teams can work in parallel against this document's contracts without a shared staging API.
- ⚠️ Mock data (18 properties, 3 developers) is hand-authored for variety across categories/cities, not representative of real inventory scale — pagination/empty-state UX should be re-verified once real data volumes exist.
- ⚠️ `AUTH_COOKIE_NAME` and the WhatsApp-link/developers endpoint shapes are frontend assumptions pending backend confirmation; see `frontend/TODO.md`.

---

### ADR-008: Vitest + React Testing Library for Unit/Integration, Playwright for E2E

**Date:** July 13, 2026
**Status:** Accepted
**Decision:** The frontend's testing stack is Vitest + React Testing Library for unit and integration tests, and Playwright (+ `@axe-core/playwright`) for end-to-end and automated accessibility testing. No Jest.

**Rationale:**

- This is Next.js's own current recommendation for the App Router: Vitest is ESM-native and doesn't need the SWC/Babel juggling Jest requires to work with Turbopack and Server Components, and it shares a Jest-compatible assertion API so there's no new mental model.
- Next's own docs are explicit that Vitest **cannot** render `async` Server Components — our route `page.tsx` files (`await searchParams`, `await params`, direct `await propertyService...` calls) fall in that category. Rather than work around this, the boundary is respected: presentational and `"use client"` components are unit-tested directly; the `*View` composition components (`PropertyDetailView`, `DeveloperProfileView`, etc.) are integration-tested by rendering them directly with fixture data, bypassing the async page wrapper; the async pages themselves are only exercised by Playwright, which drives a real running server end-to-end.
- Playwright covers what Vitest structurally cannot: real navigation, real Next.js metadata/title behavior, and cross-browser/responsive verification via its project matrix (Chromium, Firefox, WebKit, plus mobile Chrome/Safari viewports).
- Mocking happens at the service boundary (`vi.mock("@/services", ...)`), not the hook or component layer — integration tests exercise the real `useProperties`/`useDevelopers` hooks and a real `QueryClient`, so a broken hook or a broken React Query wiring would actually fail the test.

**Consequences:**

- ✅ `npm run test` / `test:coverage` (Vitest) and `npm run e2e` (Playwright) are independent — CI runs both on every PR (`frontend` and `frontend-e2e` jobs), but `frontend-e2e` only runs the `chromium-desktop` project for speed; the full 5-project matrix is for local/nightly use.
- ✅ Two genuine cross-browser findings surfaced immediately by running the full matrix once: Playwright's `.fill()` doesn't reliably trigger React's controlled-input `onChange` in WebKit (use `.pressSequentially()` for real keystroke simulation instead), and axe-scanning a client-navigated page right after `networkidle` can race Next's async-`generateMetadata` title commit (wait for the actual expected title, not just non-empty, before scanning). Both were test-authoring fixes, not application bugs — recorded here so they aren't rediscovered from scratch.
- ⚠️ Server Components with real async data fetching have no unit-test safety net by design — a regression in `getPropertyBySlug`'s error handling, for example, is only caught by the Playwright 404 tests, not a fast unit test. Acceptable given Next's own constraint, but worth remembering when triaging a slow CI failure.

---

### ADR-009: Frontend Auth Forms Built Against Mocks, With a Documented Cookie Limitation

**Date:** July 13, 2026
**Status:** Accepted
**Decision:** Login, registration, forgot-password, and reset-password are implemented as complete, production-shaped UI backed by `services/mocks/auth.mock.ts` (in-memory `MOCK_ACCOUNTS` array, `MOCK_RESET_TOKENS` map), extending the same mock-first pattern used for Properties and Developers (ADR-007), rather than waiting on the real backend.

**Rationale:**

- `services/auth.service.ts`'s function signatures (`login`, `register`, `logout`, `requestPasswordReset`, `validateResetToken`, `resetPassword`) already match this document's token strategy and role model (§6) — swapping in real HTTP calls is a body-of-function change, not a redesign of the forms, store, or route guards.
- Building real forms (React Hook Form + Zod validation, loading/error/success states, accessible controls) against a mock service surfaces real UX and validation bugs early — one was caught this way (see the `withPasswordMatchResolver` fix below) that a stubbed page never would have.
- A single, explicit, documented limitation is preferable to a fake `document.cookie` write that would misrepresent how session persistence will actually work once a real backend exists.

**The limitation:** a mock `login`/`register` running entirely in the browser cannot set a real `HttpOnly` `Set-Cookie` header — only a server response can do that. Consequently:

- Session state does not survive a full page reload in this mock environment. `authService.refresh()` deliberately still calls the real (not-yet-existent) backend and always fails in dev — this is correct behavior to keep, not a bug to patch around.
- `proxy.ts`'s server-side cookie check always wins over `RequireAuth`'s client-side check, so `RequireAuth`'s role-forbidden (`/forbidden`) redirect path is unreachable via full-navigation E2E testing today. It's covered instead by a unit test (`RequireAuth.test.tsx`) using a mocked Zustand store.

**Consequences:**

- ✅ Auth backend integration is scoped to `services/auth.service.ts` — no expected changes to forms, store, or route guard components.
- ✅ The validation-bug class this surfaced (Zod's `.refine()`/`.check()` short-circuiting on multi-field errors — see `lib/validation/withPasswordMatchResolver.ts`) would very likely have shipped unnoticed behind a stubbed page.
- ⚠️ E2E coverage of the `RequireAuth` role-forbidden path is currently unit-test-only, not full-browser — re-verify via Playwright once real cookies exist.
- ⚠️ `AUTH_COOKIE_NAME` (see `frontend/TODO.md`) remains a frontend assumption pending backend confirmation of the real cookie name.

> **Superseded in part by [ADR-010](#adr-010-dashboard-shell--the-mock-session-cookie-fix):** the "no fake cookie" stance above held while the cookie limitation was cosmetic — no `RequireAuth`-gated page had real content to reach. Phase 6 made it a hard blocker (the dashboard was unreachable in any browser, full stop), which changed the calculus. See ADR-010.

---

### ADR-010: Dashboard Shell + the Mock-Session-Cookie Fix

**Date:** July 14, 2026
**Status:** Accepted
**Decision:** Phase 6.0 builds a dedicated dashboard shell — `DashboardShell`/`DashboardTopBar`/`DashboardSidebar`/`DashboardMobileNav`/`DashboardUserMenu`, plus the shared primitives every later dashboard module will reuse — mounted inside the `(dashboard)` route group Phase 5 already guards with `proxy.ts` + `RequireAuth`. It also introduces `lib/mockSessionCookie.ts`, a mock-only marker cookie set on login/register and cleared on logout.

**Why the cookie fix was necessary, not optional:** building real dashboard content exposed that `proxy.ts` (Next middleware) re-runs on every navigation — including the client-side RSC fetch behind the redirect that fires immediately after a successful mock login — not just full page loads. Since mock `login`/`register` never set `AUTH_COOKIE_NAME`, `proxy.ts` bounced every attempt to reach `/dashboard` back to `/login`, even in the same authenticated browser session. `RequireAuth`'s own logic never even ran; the redirect happened at the network layer before React mounted. Under the "Every phase must be independently deployable" / "no placeholder functionality" bar this phase was built against, a dashboard that cannot be reached in any real browser session fails that bar outright — this needed a real fix, not a documentation note.

**The fix:** `setMockSessionCookie()`/`clearMockSessionCookie()` write/clear a non-`HttpOnly` cookie named `AUTH_COOKIE_NAME` with a value that carries no auth power of its own (`proxy.ts` only checks presence, never decodes it) — the actual access token still lives only in the in-memory Zustand store, per §6's token strategy. Called from `authService.login`/`register`/`logout`. Deliberately **not** called from `refresh()`, which still calls the real, not-yet-existent backend and still fails in dev — so the already-documented "session doesn't survive a full reload" limitation (ADR-009) is unchanged; this fix only unblocks the immediate post-login navigation within one browser session.

**Feature-flag-gated navigation:** `components/dashboard/dashboard-nav.ts` is the single source of truth for all seven dashboard destinations, shared by `DashboardSidebar` (desktop) and `DashboardMobileNav` (mobile), so the two can't drift. Every destination beyond Dashboard Home is gated by its own flag in `constants/features.ts` (`DASHBOARD_PROPERTIES`, `DASHBOARD_APPOINTMENTS`, `DASHBOARD_NOTIFICATIONS`, `DASHBOARD_PROFILE`, `DASHBOARD_SETTINGS`; Analytics reuses the pre-existing `DEVELOPER_ANALYTICS` flag) and renders as a real, disabled control with a "Soon" badge when off — the same idiom `FEATURES.WHATSAPP_CONTACT`/`MAP_VIEW` already established, not a new pattern. Each later phase flips one boolean and adds its page; the nav config needs no changes.

**Consequences:**

- ✅ The dashboard is genuinely reachable end-to-end in dev and E2E (`e2e/dashboard.spec.ts`) for the first time — Phase 5's `RequireAuth` role-forbidden path being unit-test-only is now scoped correctly: it's _specifically_ about the absence of a click path for a wrong-role user, not a symptom of the cookie problem, which is fixed.
- ✅ Every later Phase 6.x module (My Properties, Appointments, Analytics, Notifications, Profile, Settings) ships by flipping its flag and adding a page — no shell or nav changes anticipated.
- ✅ Primitives scaffolded via the shadcn CLI already configured in this repo (`components.json`, style `base-nova`, `@base-ui/react`) rather than hand-rolled: `Card`, `Table`, `Tabs`, `Dialog`, `Drawer`, `DropdownMenu`, `sonner`'s `Toaster` — matching `Button`/`Checkbox`/`Badge`'s existing provenance exactly, not a second component vocabulary.
- ⚠️ `services/mocks/auth.mock.ts` now seeds a second account (`developer@byte.africa`, role `DEVELOPER`) purely so the dashboard is reachable at all in dev/E2E without a real backend granting roles — flagging so it isn't mistaken for test data drift.
- ⚠️ The mock session cookie is a Phase-6-only shim; `lib/mockSessionCookie.ts` is explicitly marked `TODO(backend)` for deletion once real `Set-Cookie` login responses exist.

---

### ADR-011: Dashboard Home — One Data Seam, Per-Widget States, Server-Composed

**Date:** July 23, 2026
**Status:** Accepted
**Decision:** Phase 6.1 builds the Developer Dashboard Home on the Phase 6.0 shell without altering it. The page (`app/(dashboard)/dashboard/page.tsx`) is a Server Component that lays out the grid and composes seven widgets: a welcome header, six KPI tiles, Recent Listings, Appointment Overview, Notifications preview, Quick Actions, and an Activity Timeline. All dashboard data flows through a single new `dashboardService` (mock-backed, one method per future endpoint), consumed via per-widget React Query hooks in `hooks/useDashboard.ts`. No widget calls Axios or a mock directly — same contract as `propertyService`/`developerService` (ADR-007).

**Why one service, many hooks:** each widget maps to its own future endpoint (`GET /api/v1/dashboard/{summary,metrics,listings,appointments,notifications,activity}`) and owns its own loading/empty/error state, so a slow or failing section never blocks the rest of the page. React Query's stable query keys also let the welcome header and the KPI grid share a single `metrics` fetch rather than requesting it twice. Backend integration is a change inside `dashboardService` and nowhere else — the mock data (`services/mocks/dashboard.mock.ts`) models one authenticated developer's own workspace, distinct from the public cross-developer catalogue.

**Server vs Client split:** presentational primitives (`DashboardSection`, `StatusBadge`, `ActivityTimeline`, `QuickActions`) carry no `"use client"` and stay server-renderable; only the data-fetching widgets and interactive pieces (tabs) are Client Components. The page itself statically prerenders (confirmed in the build output), with the client widgets hydrating and fetching. The welcome greeting reads the name from the in-memory auth store (instant, no flash) while company/summary come through the service.

**New reusable primitives (not one-offs):** `DashboardSection` (the single titled-card shell every widget renders inside, with a semantic `<h2>`), `StatusBadge` with domain wrappers `PropertyStatusBadge`/`AppointmentStatusBadge` (label carries meaning; a coloured dot is supplementary and `aria-hidden`, keeping the monochrome brand WCAG 1.4.1-clean), and `ActivityTimeline` (shape-driven, so backend integration only swaps what fills it). KPIs reuse the existing `StatCard`; `Property` gained one additive optional field (`updatedAt`) rather than a parallel listing type. Quick Actions and the listing/notification "View all"/"Edit" affordances reuse the shell's feature-flag idiom (ADR-010): each points at a real route and renders disabled with a "Soon" badge until its phase (`DASHBOARD_PROPERTIES` etc.) flips — never a link to a page that doesn't exist yet.

**Consequences:**

- ✅ Phase 6.2+ modules (My Properties, Appointments, Notifications, Profile) flip their flag and add a page; the home widgets' "View all"/"Edit"/Quick-Action links light up automatically with no home-page changes.
- ✅ Every widget satisfies the accessibility bar (semantic headings, keyboard-operable tabs/menus, and explicit loading/empty/error states); the existing dashboard axe scan now covers the full overview at zero violations.
- ⚠️ **Roadmap renumber:** the earlier roadmap listed "My Properties + Property Editor" as Phase 6.1. The approved dashboard spec makes **Dashboard Home** 6.1 and shifts My Properties to 6.2 — a naming change, not a scope change.
- ⚠️ Per-widget **error-state** tests live in the full-page integration test, not the light per-widget unit tests: a rejected React Query fetch in a very light render trips a node/vitest unhandled-rejection false positive (the error is, in fact, stored in query state) that a heavier tree doesn't — the same reason the properties/developers domains assert error states at the view level. Documented in `TODO.md`; not a product defect.

---

_ByTe Real Estate Platform — ARCHITECTURE.md_
_Maintained by Emmanuel (CTO). Update this document when any architectural decision changes._
