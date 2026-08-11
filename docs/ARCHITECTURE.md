# ByTe Real Estate Platform — Architecture

> **Document type:** Architecture Reference + Architecture Decision Records (ADRs)
> **Last updated:** July 24, 2026
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
| `APPOINTMENT_CANCELLED`     | Either party cancels a booked visit     | In-app + Email |
| `APPOINTMENT_RESCHEDULED`   | Developer reschedules a visit           | In-app + Email |
| `APPOINTMENT_COMPLETED`     | Developer marks a visit complete        | In-app         |
| `APPOINTMENT_NO_SHOW`       | Developer marks a visit as no-show      | In-app         |
| `LISTING_PUBLISHED`         | A draft listing goes live               | In-app         |
| `LISTING_SUSPENDED`         | A listing is suspended                  | In-app         |
| `DRAFT_REMINDER`            | A draft has had no activity for N days  | In-app         |
| `DEVELOPER_VERIFIED`        | Admin verifies developer account        | In-app + Email |

The eight appointment/listing/draft types (added in Phase 6.6, see ADR-015) are the frontend's `NotificationType` union (`frontend/types/index.ts`) — a real backend produces them from the same mutations that already enqueue `notificationQueue.add(...)` jobs elsewhere in this document (appointment status changes, listing publish/suspend). A generic `SYSTEM` type (not tied to any single trigger — performance summaries, account events) rounds out the frontend union.

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

The frontend already implements this exact cadence today, against the mock service: `hooks/useNotifications.ts`'s `useUnreadNotificationCount` runs on a 30s `refetchInterval` — the nav badge and page header both stay current without any component polling logic of their own. This is also the identified real-time extension point (see ADR-015): a future WebSocket push handler only needs to write into this one query's cache entry (`queryClient.setQueryData`/`invalidateQueries` on the `["notifications", "unread-count"]` key) — no component here would need to change.

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

| Event                      | Triggered By                     | Stored In                             |
| -------------------------- | --------------------------------- | -------------------------------------- |
| `property_view`            | GET /api/v1/properties/:id        | PropertyAnalytics (aggregated daily)  |
| `whatsapp_click`           | POST /api/v1/analytics/events     | PropertyAnalytics (aggregated daily)  |
| `property_liked`           | POST /api/v1/favorites/:id        | PropertyFavorite count                |
| `appointment_confirmed`    | POST /api/v1/analytics/events\*   | AppointmentAnalytics (planned)        |
| `appointment_rescheduled`  | POST /api/v1/analytics/events\*   | AppointmentAnalytics (planned)        |
| `appointment_completed`    | POST /api/v1/analytics/events\*   | AppointmentAnalytics (planned)        |
| `appointment_cancelled`    | POST /api/v1/analytics/events\*   | AppointmentAnalytics (planned)        |
| `appointment_no_show`      | POST /api/v1/analytics/events\*   | AppointmentAnalytics (planned)        |

\* The appointment lifecycle events are emitted today via `frontend/lib/telemetry.ts`'s `trackAppointmentEvent` — a documented no-op seam (dev-only `console.debug`) called from every `appointmentService` mutation (Phase 6.4). No backend endpoint exists yet; wiring one is a one-line change inside that function, not a hunt through every call site.

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

### ADR-012: My Properties — Split Feature Flag, Status-Rule Single Source, Serial E2E Mutations

**Date:** July 24, 2026
**Status:** Accepted
**Decision:** Phase 6.2 builds My Properties (`/listings`) on the Phase 6.0 shell and the Phase 6.1 primitives: listing management only — search, filter, sort, pagination, status changes, and delete. The create/edit form is explicitly out of scope and ships as its own phase (6.3). A new `listingService` (mock-backed, `services/mocks/listings.mock.ts`) and `hooks/useListings.ts` (one query hook, four mutation hooks) drive `ListingsView`, which composes `ListingsStatusSummary`, `ListingsFilterBar`, `ListingsBulkActionsBar`, `ListingsTable`, and `DeleteListingDialog` — mirroring `PropertiesView`/`DevelopersView`'s URL-driven-filters pattern (ADR-007) rather than inventing a new one.

**Splitting `DASHBOARD_PROPERTIES`:** Phase 6.0 gated the entire "My Properties" nav destination — page and future editor alike — behind one flag. Shipping only the listing table this phase meant that flag could no longer also gate Add/Edit. `constants/features.ts` now has `DASHBOARD_PROPERTIES` (the nav item and `/listings` — flipped `true` this phase) and a new sibling `DASHBOARD_PROPERTY_EDITOR` (Add Property, Edit listing — stays `false`). Every place Phase 6.1 gated "Add Property"/"Edit listing" behind `DASHBOARD_PROPERTIES` (`QuickActions`, `RecentListings`'s row menu) was repointed to `DASHBOARD_PROPERTY_EDITOR`; their "View all"/"View Listings" links stayed on `DASHBOARD_PROPERTIES` and now light up as real links, since `/listings` exists. Same "Soon"-badge idiom (ADR-010), just two flags instead of one where the phase boundary cut a single destination in half.

**One status-rule source, read by two UIs:** `STATUS_TRANSITIONS` (which moves are valid from a given `PropertyStatus`) and `DELETABLE_STATUSES` (only `DRAFT` and `SUSPENDED` — anything with real transaction history must be suspended first) live once in `services/listing.service.ts`. Both the per-row action menu (`ListingsTable`) and the bulk actions toolbar read from the same exports, so a business-rule change can't update one UI and silently miss the other. Bulk mutations (`bulkUpdateStatus`/`bulkDelete`) apply only to whichever selected rows the action is actually valid for and report what they skipped, rather than failing the whole operation because one row in a mixed-status selection doesn't qualify.

**Toasts, for real this time:** Phase 6.0 scaffolded `sonner`'s `Toaster` but nothing ever called `toast()`. `hooks/useListings.ts`'s four mutations are the first real consumer — success/error feedback for status changes, deletes, and their bulk equivalents.

**Consequences:**

- ✅ Phase 6.3 (Property Editor) flips `DASHBOARD_PROPERTY_EDITOR` and adds `/listings/new` + `/listings/[slug]/edit`; every "Add Property"/"Edit listing" control already wired to that flag lights up with no further changes to My Properties, Recent Listings, or Quick Actions.
- ✅ `MOCK_LISTINGS` (the developer's portfolio) and `MOCK_DASHBOARD_LISTINGS` (Dashboard Home's "recent" list, shipped in 6.1) are deliberately independent datasets — Phase 6.1 was already reviewed and this phase doesn't touch it. A real backend serves both from one table; until then, a status change in My Properties doesn't retroactively update what Dashboard Home shows.
- ⚠️ `MOCK_LISTINGS` is a mutable module-level array (same idiom as `auth.mock.ts`), so `e2e/listings.spec.ts`'s mutating tests (publish/delete/bulk) run under `test.describe.configure({ mode: "serial" })` — concurrent workers racing the same in-memory array produced flaky row counts during development. The unit-level mutation tests in `listing.service.test.ts` snapshot/restore the array around each other for the same reason.
- ⚠️ E2E tests reach `/listings` only by clicking the sidebar link after login, never `page.goto("/listings?...")` — per ADR-009, the mock session lives only in memory and doesn't survive a full page load, so a direct `goto` to a protected route lands on the sign-in-required fallback even with the mock session cookie present. Every dashboard e2e spec already followed this convention; documented explicitly here since it's easy to trip over when a test wants to deep-link into a specific filter state.

---

### ADR-013: Property Editor — Autosave Baselines, Explicit Upload State, History-API URL Sync

**Date:** July 24, 2026
**Status:** Accepted
**Decision:** Phase 6.3 builds the create (`/listings/new`) and edit (`/listings/[slug]/edit`) experience as one `ListingForm`, parameterized by mode — the fields are identical; only initial values and submit semantics differ. A single React Hook Form instance is the sole source of truth for field values (shared with every section via `FormProvider`); a lightweight `ListingEditorProvider` holds cross-cutting metadata that isn't itself a form field — identity (null until a brand-new draft's first save mints one), autosave status, and whether a publish is in flight — so section components and the publish bar can read it without prop-drilling, without ever duplicating what React Hook Form already owns.

**One schema, two profiles:** `lib/validation/listing.ts` exports `listingSchema` (every field lenient — a draft can be nearly empty) and `publishListingSchema = listingSchema.extend({...stricter})`. The publish profile is always a structural superset of the base, never an independently authored schema that could drift from it.

**Autosave sends only what changed:** `useAutosaveListing` extracts the dirty-fields subset via React Hook Form's `dirtyFields` and PATCHes just that through `listingService.updateListing`. It's gated to `DRAFT` status only — a live, publicly-visible listing shouldn't change under a buyer's nose mid-edit — and stops scheduling further silent retries after three consecutive failures (a manual "Retry" affordance always resets the counter).

**Explicit upload state machine:** `useUploadQueue` models each file's lifecycle as QUEUED → UPLOADING → UPLOADED, or UPLOADING → FAILED with a user-triggered retry back to UPLOADING — not a boolean `isUploading` flag, so the UI can show each file's own status independently while a batch uploads in parallel. Reordering uses explicit "move earlier/later" buttons that swap an explicit per-photo `order` field (not drag-and-drop, which would need a new dependency and its own keyboard-accessibility work from scratch) — display order is decoupled from array/insertion position because an async upload queue can finish out of order, and array index alone can't be trusted to mean "what the developer sees."

**`useNavigationGuard` is generic, not listing-specific** — any future dashboard form can adopt the same `{ shouldBlock, message }` → `guardNavigation(action)` API, paired with a generic `NavigationGuardDialog` (in `components/common/`, not `components/dashboard/listings/`).

**Three real bugs found and fixed during implementation** (all in the diff, none shipped):

1. **My Properties' "Edit listing" row action was never actually wired.** Phase 6.2 built it as a disabled placeholder (the editor didn't exist yet); flipping `DASHBOARD_PROPERTY_EDITOR` alone would have left a live-looking menu item with no `href`. Caught by the first E2E run against the real flag flip, not by any unit test — the row's `disabled` state was already covered, its link target never was. Fixed with the same `render={<Link .../>}` pattern `RecentListings`'s equivalent action already used.

2. **`router.replace()` to adopt a new draft's real URL could unmount the whole page mid-edit.** The original design (matching the Phase 6.3 review) called for updating the address bar from `/listings/new` to `/listings/[slug]/edit` via Next's router the instant autosave minted an identity. But these are two different leaf routes in the App Router — a genuine `router.replace()` navigation between them unmounts and remounts the page from a fresh server fetch, discarding anything the developer typed after the autosave snapshot that triggered the create, and orphaning any in-flight continuation (Publish's own follow-up status update, specifically, never ran — the component it was scheduled on had already been torn down). **Fix:** use `window.history.replaceState` directly for that one URL sync. It fixes up what a page refresh or copy-pasted link lands on without ever invoking Next's router — the component keeps running uninterrupted, exactly as intended.

3. **A field cleared of "dirty" state by autosave/save could stay dirty forever afterward**, permanently and incorrectly triggering the unsaved-changes guard on every later navigation attempt. `form.reset(undefined, { keepValues: true, keepDirty: false })` keeps the displayed values but never supplies a new baseline for React Hook Form's dirty comparison — every subsequent edit kept comparing against the *original* `defaultValues` from when the form first mounted. **Fix:** pass a freshly-read `form.getValues()` (read at reset-time, not a snapshot captured before the save's network `await`) as the reset baseline, in `useAutosaveListing` and both of `ListingForm`'s explicit-save paths.

**Consequences:**

- ✅ Every future dashboard form (Company Profile, Account Settings, once those phases ship) can reuse `useNavigationGuard` + `NavigationGuardDialog` as-is — the API was never listing-specific.
- ✅ Backend integration for media is a single-file swap: `services/upload.service.ts`'s `uploadFile`/`deleteUpload` stand in for `POST /api/v1/uploads/signature` + a direct-to-Cloudinary upload (ARCHITECTURE.md §7) and `DELETE /api/v1/uploads/:publicId`; `MediaUploader` and `useUploadQueue` never change.
- ⚠️ `useAutosaveListing`'s `enabled` gate cancels a *scheduled* debounce timer immediately once Publish/Delete starts, but can't cancel a save whose network call was already mid-flight in the same tick — no `AbortController`-based cancellation exists yet. Acceptable at today's mock latency; revisit only if this surfaces against real backend latency.
- ⚠️ A real testing lesson from this phase, not a product issue: Playwright's `getByText` does case-insensitive *substring* matching by default. `MediaUploader`'s own section description ("...the cover image.") satisfied an E2E wait for the "Cover" badge before any upload had actually finished, producing a flaky-looking failure that was actually a bad test assertion. Fixed with `{ exact: true }`; documented here so future specs don't rediscover it the hard way.

---

### ADR-014: Appointments — Centralized Action Policy, Independent Dataset, No-Op Telemetry Seam

**Date:** July 24, 2026
**Status:** Accepted
**Decision:** Phase 6.4 builds the developer's appointment book (`/appointments`) as a full business workflow — lifecycle management, not just a list — reusing every dashboard primitive already established by My Properties (Phase 6.2) and the Property Editor (Phase 6.3) rather than inventing new ones: `DashboardPageContainer`, `Table`, `Dialog`, `Drawer`, `DropdownMenu`, `Pagination`, `FilterChips`, and the URL-driven-filters + React Query pattern from `ListingsView`.

**Lifecycle as a graph, not a line:** `AppointmentStatus` extends the Phase 6.1 four-state enum (`REQUESTED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`) with `RESCHEDULED` and `NO_SHOW` — both needed to represent a real viewing's outcome (a rescheduled booking isn't "still requested," and a booked visit that nobody attends isn't "cancelled," since the developer didn't cancel it). `COMPLETED`, `CANCELLED`, and `NO_SHOW` are terminal; `REQUESTED` can only move to `CONFIRMED` or `CANCELLED`; `CONFIRMED`/`RESCHEDULED` can move to `RESCHEDULE`, `COMPLETE`, `NO_SHOW`, or `CANCEL`. Mirrors the `STATUS_TRANSITIONS` graph pattern already proven by `listing.service.ts`.

**`AppointmentActionPolicy` (`lib/appointmentActionPolicy.ts`) centralizes the business rules**, not `appointment.service.ts` — a pure-logic module the row action menu, the bulk actions toolbar, the details drawer, and the service's own transition validation all read from, so a rule change can't update one surface and silently miss another. It exposes `getActions(status)` (every action valid from a status), `getBulkActions()` (the fixed, bulk-safe subset), `isValidTransition(from, to)`, and `isTerminal(status)`. An `AppointmentActionContext { role?: UserRole }` parameter is threaded through today unused — reserved so a future role-based permission check (e.g. an ADMIN seeing every action, a read-only support role seeing none) is a change inside this one module, not a new parameter every call site has to learn.

**Bulk actions are deliberately narrower than per-row actions:** the toolbar only ever offers Confirm and Cancel (`ACTION_DEFINITIONS[key].bulkSafe`) — Reschedule needs a per-row date/time input that can't sensibly batch, and Complete/No-Show are outcomes of one specific visit, not something to apply across a mixed selection. This is enforced at the policy layer, not just hidden in the UI, so `appointmentService.bulkUpdateStatus` can never be called with a target the toolbar wouldn't have offered.

**Deliberately independent mock dataset:** matching the ADR-011/012 precedent (`MOCK_DASHBOARD_LISTINGS` vs `MOCK_LISTINGS`), `services/mocks/appointments.mock.ts`'s array is separate from `dashboard.service.ts`'s existing, already-shipped `MOCK_APPOINTMENTS` (Phase 6.1's Dashboard Home widget). A real backend serves both from one table; this phase doesn't touch the reviewed widget's data or its query key.

**`ActivityTimeline` reused for per-appointment history**, not a new component: each mock appointment carries its own `history: ActivityItem[]`, appended to by every mutation (`appendHistory` in `appointment.service.ts`), and the details drawer renders it through the same `ActivityTimeline` Dashboard Home's Recent Activity section already uses — the component was already shape-driven (`ActivityItem[]` in, nothing else), so no changes were needed beyond extending `ActivityType`'s icon map for the four new appointment lifecycle events (`APPOINTMENT_CONFIRMED`, `APPOINTMENT_RESCHEDULED`, `APPOINTMENT_CANCELLED`, `APPOINTMENT_NO_SHOW`).

**No-op telemetry seam:** `lib/telemetry.ts`'s `trackAppointmentEvent` is called from every status-changing mutation in `appointment.service.ts`, but only `console.debug`s outside production today — see §11's updated Event Types table. The seam exists so every call site is already correct and in place; wiring a real `POST /api/v1/analytics/events` endpoint later is a one-line change inside that one function.

**A real bug found and fixed during implementation, not shipped:** the Appointments table groups rows by scheduled date with an interleaved single-cell header row (e.g. "Today", "Jul 26, 2026") between actual appointment rows — discovered while writing this phase's own E2E spec, where `page.getByRole("row").nth(1)` sometimes selected a date-group header instead of a data row, and a plain "has a checkbox" filter still matched the column header's own "select all" checkbox. Fixed by filtering for a row containing its own "Actions for `<name>`" button, which only real appointment rows have.

**Consequences:**

- ✅ Every future dashboard bulk-action surface (Notifications, once that phase ships) can reuse the same "policy exposes a narrower bulk subset than per-row actions" pattern without re-deriving it.
- ✅ Role-based permissioning, when it eventually lands, is a change to `AppointmentActionPolicy` alone — every call site (row menu, bulk bar, drawer, service validation) already threads an (unused) context parameter through.
- ⚠️ `AppointmentTimeframe`'s `"overdue"` bucket (still-`REQUESTED`, past-dated) is computed client-side against `Date.now()` at query time — acceptable at mock scale; a real backend would likely compute this server-side against a consistent clock instead of relying on every client's local time.

---

### ADR-015: Notifications — Shared Platform Seam, Granular Type + Derived Category, Lifecycle Modeled as an Enum

**Date:** July 24, 2026
**Status:** Accepted
**Decision:** Phase 6.6 builds `notificationService` as the one seam every current and future module reads/writes notifications through — not "a notifications page" bolted onto the dashboard, but the same infrastructure a Notifications page, the Dashboard Home preview widget, and the nav badge all already share. Nothing outside `notification.service.ts` may import `notifications.mock.ts` directly, mirroring how `appointmentService`/`listingService` are the only consumers of their own mock arrays.

**Widened `NotificationType`, same move as ADR-014's `AppointmentStatus`:** the Phase 6.1 `Notification.type` was a coarse 4-value enum (`APPOINTMENT | LISTING | MESSAGE | SYSTEM`) used only to pick a preview icon. It's now a granular 10-value union — `APPOINTMENT_REQUESTED/CONFIRMED/CANCELLED/RESCHEDULED/COMPLETED/NO_SHOW`, `LISTING_PUBLISHED/SUSPENDED`, `DRAFT_REMINDER`, `SYSTEM` — matching what a real event actually is, not just which section it belongs to. One pre-existing inconsistency was fixed while widening it: the old `MESSAGE` type (an "enquiry" notification) represented in-app messaging, which **ADR-006 already rules out entirely** (WhatsApp-first, no in-app chat). Nothing in this app has ever been able to produce a `MESSAGE` notification legitimately; it's gone, and the one Phase 6.1 mock row that used it now reads as a `DRAFT_REMINDER` instead.

**Category is derived, never stored:** the filter bar groups by a coarser `NotificationCategory` (`APPOINTMENT`/`LISTING`/`SYSTEM`), computed from `NotificationType` via one lookup table (`NOTIFICATION_CATEGORY` in `notification.service.ts`) — the same "one place a mapping can be wrong" reasoning behind `AppointmentActionPolicy`. A notification is never inconsistent with its own category because there's no separate category field to drift.

**Lifecycle is a single enum, not two booleans — a deliberate deviation from the literal request.** The requested lifecycle (Unread → Read → Archived) reads as a strict progression, not two independent flags. The obvious non-breaking alternative — keep `read: boolean`, add an optional `archivedAt?: string` — would let an invalid state exist structurally (archived-but-unread) and require every reader to know an unwritten rule ("archived implies read"). `status: "UNREAD" | "READ" | "ARCHIVED"` can't represent that invalid state and reads better everywhere a switch/filter touches it. This *is* a breaking rename of an existing Phase 6.1 field, but the blast radius was exactly one widget (`NotificationsPreview.tsx`), its test, and five mock rows in `dashboard.mock.ts` — small and contained enough that the cleaner model won out over strict backward compatibility. `ARCHIVED` is fully designed in (the type, the service, the filter parser all tolerate it) but nothing produces or exposes it yet — no archive action, no archive tab — per this phase's explicit "design for it, don't build the UI" instruction.

**Card list, not `Table`, for the same reason `NotificationsPreview` already chose one:** notifications are heterogeneous inbox items (icon, title, body, timestamp), not comparable tabular rows. `Table`/`Pagination`/`Drawer`/`DashboardSection`/`FilterChips` are all reused as-is; `Table` specifically is not, despite being listed as a candidate for reuse — the wrong semantic fit here, matching the precedent Dashboard Home already set for this exact data shape.

**Navigation: nav badge only, no top-bar bell.** Dashboard Home's `NotificationsPreview` widget already gives a persistent quick-glance surface from the page every session starts on; a second always-visible top-bar dropdown would duplicate it for marginal benefit, and no other module (Appointments, My Properties) has an equivalent top-bar mini-view either. Since "Notifications" falls outside the mobile bottom bar's primary 3 destinations (into the "More" sheet), the "More" tab itself carries an aggregate unread dot so mobile users get a signal without an extra tap — see `DashboardMobileNav.tsx`.

**Real-time extension point:** `useUnreadNotificationCount` (`hooks/useNotifications.ts`) polls every 30s — the exact cadence already documented in §9's "Why Polling, Not WebSockets" — against its own query key (`["notifications", "unread-count"]`). A future WebSocket push handler needs only to call `queryClient.setQueryData`/`invalidateQueries` on that one key; the nav badge, the page header, and any future consumer update automatically, with zero component changes.

**A real bug found and fixed during implementation, not shipped:** `markAsRead` called `findNotificationOrThrow` (which throws synchronously on an unknown id) from inside a plain arrow function typed to return a `Promise`, not an `async` function — so an unknown id threw synchronously at call time instead of yielding a rejected promise, breaking any `await expect(...).rejects` caller. Caught by this method's own "rejects an unknown id" test, fixed by making the method `async`. The identical shape exists in `appointment.service.ts`'s `updateStatus`/`reschedule` (calling `findAppointmentOrThrow` from non-`async` arrows) but is untested and unreachable through the current UI (no call site ever passes an id that isn't already a real row's) — left as-is rather than opportunistically touching Phase 6.4 code in this phase; noted in TODO.md.

**Consequences:**

- ✅ Any future module that needs to notify a developer (Analytics thresholds, Profile/Company changes) extends `NotificationType` and the one `NOTIFICATION_CATEGORY` lookup — never touches a component to add a new kind of notification.
- ✅ Real-time delivery, when it lands, is a change inside `notificationService`'s query layer alone — every UI surface (badge, list, drawer) already reads through React Query and re-renders on cache updates without modification.
- ⚠️ The identical "synchronous throw from a non-`async` Promise-returning arrow" bug pattern is now known to exist in `appointment.service.ts` too (untested, unreachable via UI) — see TODO.md's Technical Debt for the specific methods, left unfixed to keep this phase's footprint to Notifications.

---

### ADR-016: Analytics — Domain Model Separated from Presentation, Action Needed as First-Class, One Real Chart

**Date:** July 24, 2026
**Status:** Accepted
**Decision:** Phase 6.7 builds `/analytics` as a cross-domain read model over the appointments and listings domains, not a new domain with its own mock array. `analytics.service.ts` owns zero data of its own — it composes `listingService.getListings()` and `appointmentService.getAppointments()`, then hands the results to a pure calculation layer, matching the ADR-011/012/014 precedent that consumers of another domain's data go through that domain's service, never its mock file.

**Business logic lives in `lib/analyticsCalculations.ts`, not the service or the components** — a pure-function module (`buildAppointmentFunnel`, `buildPortfolioComposition`, `buildActionNeeded`, `buildAnalyticsStats`, `dailyEventCounts`) with no service or React coupling, directly unit-testable without mocking React Query or the service layer. `analytics.service.ts`'s only job is fetching the two domains' current state and threading it through these functions — the same "policy module the surfaces read from" shape as `AppointmentActionPolicy` (ADR-014), applied to derivation instead of transition rules. `isOverdueAppointment` was extracted out of `appointment.service.ts` into `lib/appointmentActionPolicy.ts` as a shared exported predicate so the "overdue" definition used by Appointments' own timeframe filter and Analytics' Action Needed can't drift apart into two copies of the same rule.

**Action Needed and Insights are first-class, not optional additions, per this phase's explicit brief.** `AnalyticsActionNeeded` renders above the fold, before the period selector — three possible flags (`OVERDUE_APPOINTMENTS`, `STALE_DRAFTS`, `HIGH_CANCELLATION_RATE`), each a real deep link into the exact filtered view that explains it (`/appointments?timeframe=overdue`, `/listings?status=draft`). Severity is a `StatusBadge` (`"high"`/`"medium"`, danger/warning tone), matching Notifications' and Appointments' existing "status is never color-only" convention. `HIGH_CANCELLATION_RATE` only fires once `totalRequested >= 5` in the period — flagging a 100% cancellation rate off one cancelled appointment would be noise, not signal.

**Current-state vs. period-scoped is a real split in the type system, not a convention to remember.** `PortfolioComposition` and Action Needed reflect the portfolio's state right now (a stale draft doesn't stop being stale because you changed the period selector to "90d"); `AppointmentFunnel` and its four rates are the only period-scoped shape, cohorted by each appointment's `APPOINTMENT_REQUESTED` history timestamp — an appointment with no such history entry is excluded from every period's cohort rather than guessed into one, since Phase 6.1 seed data predates the history-tracking convention Phase 6.4 introduced.

**"One real chart" — a deliberate rejection of "dashboards have charts."** Every stat besides the appointment funnel is a `StatCard` (reused from Phase 6.0, its `trend` prop rendered as `Sparkline` for the first time by a second real consumer) or a plain `Table`. The funnel is the only place a bar visualization improves on a number or table, per this phase's explicit "if a chart doesn't improve understanding over a number or table, don't include it" instruction — and even there, `AppointmentFunnelChart` ships a toggle to an equivalent, fully visible `<table>` with identical data, not a screen-reader-only summary string, since a text summary would lose per-stage detail a sighted user gets from the bars.

**`SwipeableStatRow` — a new mobile primitive, not a variant of an existing grid.** The stat row is a horizontally-swipeable (CSS scroll-snap) strip below `sm`, a plain `grid-cols-2`/`grid-cols-4` above it — the first scroll-snap pattern in this codebase, reusable by any future phase that needs an always-visible, no-scroll-required stat strip on mobile.

**Deliberately no polling.** Unlike Notifications' 30s `refetchInterval` (ADR-015), `useAnalyticsSnapshot` fetches once per period selection with no real-time extension point — analytics summarizing appointments and listings isn't the kind of data a developer expects to watch update live the way an unread count is.

**Per-property view counts are a known, undisguised gap.** The data model has no per-listing view-tracking field at all — only a single hardcoded aggregate. Rather than fabricate a per-property breakdown the mock data can't support, "Top Properties by Views" is excluded from this phase entirely; `analytics.service.ts` carries a `TODO(backend)` naming the real `GET /api/v1/developers/me/analytics?period=` endpoint this whole service is standing in for.

**Consequences:**

- ✅ A future phase adding a new metric extends `lib/analyticsCalculations.ts` with another pure function and a stat entry — no component needs to change its data-fetching shape.
- ✅ The overdue-appointment rule is now defined in exactly one place (`isOverdueAppointment`), read by both Appointments' timeframe filter and Analytics' Action Needed.
- ⚠️ `buildAppointmentFunnel`'s cohorting depends on `history` entries that only exist from Phase 6.4 onward — appointments seeded before that phase are silently excluded from every period's funnel rather than counted incorrectly. A real backend migration would need to backfill or explicitly flag pre-history rows.
- ⚠️ All aggregation (funnel rates, portfolio counts, action-needed thresholds) runs client-side over every listing and appointment fetched via a 1000-row page size — acceptable at mock scale, but a real backend should compute these aggregates server-side once portfolios reach thousands of listings or tens of thousands of appointments, per this phase's own scalability review.

---

## Platform Readiness Review — July 2026

A no-new-features audit of the full 8-domain platform (Authentication, Dashboard Shell, Dashboard Home, My Properties, Property Editor, Appointments, Notifications, Analytics), run after Phase 6.7 to determine backend-integration readiness. This section is the durable record; `TODO.md`'s Technical Debt section carries the itemized Medium/Low findings, and `CHANGELOG.md` records what was fixed.

**Executive summary.** The architecture is coherent, not drifted, after 8 domains — shared seams (`useFilterNavigation`, one-mock-file-per-service, status-transition graphs, a single policy/lookup module per domain) are genuinely reused, not reinvented, and this was verified against the code, not just the ADR prose. The platform is **not** ready for backend integration as-is, but not because of frontend quality — the blockers are exactly the ones already named throughout this document's ADRs and `TODO.md`: the mock-session-cookie shim, unconfirmed cookie-name/shape assumptions, and client-side aggregation standing in for endpoints that don't exist yet. Nothing found in this review suggests the frontend needs re-architecting before that integration begins.

**Architecture health.** Coherent. The one real duplication risk is the filter-bar pattern, now independently implemented across 5 domains at similar size — past this project's own "third domain" extraction trigger, flagged as Medium in `TODO.md`. `AppointmentActionContext`'s unused role-based extension point is honestly documented as speculative, not hidden over-engineering.

**Domain-by-domain.** All 8 domains are individually cohesive and internally consistent with their own conventions. Cross-domain, one real inconsistency: `dashboard.service.ts` is the only domain whose read methods return bare arrays with an ad hoc `limit` param instead of the `{page,pageSize} → PaginatedResult` shape every other domain uses — harmless at "top 5 widget" scale, flagged as Medium debt. Backend readiness varies domain-to-domain: Properties/Listings/Developers/Notifications map cleanly onto a REST contract; Analytics and Dashboard Home both do real aggregation client-side over fetched rows (`analytics.service.ts`'s `ALL_ITEMS_PAGE_SIZE = 1000`, `dashboard.service.ts`'s `MOCK_TOTAL_PROPERTY_VIEWS` hardcoded constant) that a real backend must instead compute server-side — both already carry `TODO(backend)` markers naming the real endpoint.

**API readiness.** Query keys are a hierarchical array pattern almost everywhere; `useProperties`/`useDevelopers` used bare string literals instead of an exported constant (fixed this pass) and `useListingEditor` hardcoded a second `["listings"]` literal instead of importing the one `useListings.ts` already exports (fixed this pass — both were real key-drift risks, not cosmetic). No `app/**/error.tsx` boundary exists anywhere; every domain instead handles `isError` inline — consistent as an idiom, but zero defense against a thrown render error. The `QueryClient` had no `defaultOptions` at all, meaning every query used the library default of retrying every failure (including a real backend's 404s) three times — fixed this pass with a `retry` function that stops retrying 4xx responses and a 30s `staleTime`. Every mutation across every domain correctly invalidates its query key on success — no missing invalidation found anywhere. No optimistic updates exist (deliberate, uniform choice, not a gap). Appointment/Notification services mutate and return the same in-memory object reference held in their mock array — serializes fine over JSON today, but is not representative of a real HTTP response shape; not a blocking issue, just worth remembering when the mocks are deleted.

**State management.** Ownership is clear and non-duplicated: exactly one Zustand store (`authStore`, session identity, memory-only token), exactly one domain Context (`ListingEditorProvider`, explicitly never shadowing RHF's own form state), and URL-filter parsing centralized one-function-per-domain in `lib/*Filters.ts` with only a trivial 3-line helper duplicated five times (not a real problem). One real bug found and fixed this pass: `AppointmentsView`/`NotificationsView` held a full `Appointment`/`Notification` object in `useState`, captured at click time and never updated — if a mutation invalidated the query while the details drawer or reschedule dialog was open, the open panel kept showing stale status/read-state. Fixed by storing only the id and deriving the object from the live query result by id every render. The identical, lower-stakes pattern remains in `ListingsView`'s single-delete confirmation dialog (only a title could go stale, not the action's target id) — left as Low debt.

**Design system.** Stronger than expected: `StatusBadge`, `FilterChips`, `Pagination`, and `EmptyState` are genuinely cross-domain with zero forking. Two real gaps: three near-identical table/list loading-skeleton implementations that should collapse into one shared primitive (Medium debt), and `SwipeableStatRow` — built in Phase 6.7 specifically to solve "dense KPI row on mobile" — was never retrofitted onto Dashboard Home's own `DashboardKpis`, which still uses a plain grid (Medium debt, a deliberate-decision-needed inconsistency rather than an oversight to silently fix).

**Accessibility.** Automated axe scans are clean across every page, but two gaps sit beneath that floor: `ListingsTable`/`AppointmentsTable` — the app's two richest data views — render as styled `<div>` grids, not semantic `<table>`/`<tr>`/`<td>`, even though `components/ui/table.tsx` already exists and Analytics' own components use it; screen reader users lose row/column/table-size announcements entirely. Flagged High but deliberately **not** fixed in this pass — converting two production tables with row selection, bulk actions, and responsive fallback behavior is a correctness-sensitive rewrite that deserves its own reviewed phase, not a bundled fix inside a readiness audit. Second, `SwipeableStatRow`'s horizontally-scrolling strip has no `role`/`aria-label` announcing it as a scrollable region. `prefers-reduced-motion` remains entirely unaddressed (already known debt, reconfirmed still open). Focus management, focus-visible styling, and `aria-live`/`role="status"` coverage are all solid, inherited from `@base-ui/react` primitives and consistent per-domain conventions.

**Performance.** The client/server boundary is well-managed — zero page.tsx files are client components; `"use client"` is pushed down into leaf views, not hoisted to route roots. Two real, un-measured gaps: zero `next/dynamic`/`React.lazy` usage anywhere (dialogs, drawers, and the Analytics chart all ship in the initial bundle for any view that imports them), and zero `React.memo` usage (toggling one row's checkbox in `AppointmentsView`/`ListingsView` re-renders the full subtree). Both are Low priority — neither was measured against a real bundle-analyzer or profiler, so they're hypotheses to verify before investing effort, not confirmed problems. `formatRelativeTime`'s `Date.now()` default-argument is a latent hydration-mismatch landmine only if ever called from a Server Component — currently isn't, worth remembering.

**Security.** Token storage (memory-only, never persisted) and route protection (server-side middleware gate plus a client-side role check) are both sound and already documented in ADR-009/010. Two real, previously-undocumented gaps closed this pass: `next.config.ts` had zero security headers at all (added baseline `X-Content-Type-Options`/`X-Frame-Options`/`Referrer-Policy`/`Permissions-Policy`; a real CSP is deliberately still deferred pending the real backend's origin and Cloudinary's domains); no CSRF reasoning was written down despite the architecture committing to a `SameSite=Strict` cookie (documented as Medium debt — needs the real backend's cookie config to finish). No XSS surface found (zero `dangerouslySetInnerHTML`/`innerHTML`/`eval`). Anti-enumeration is correct on login and password-reset; `register()`'s "email already exists" message is enumeration-capable by deliberate, common trade-off (Low, flagged not fixed). The single biggest integration foot-gun remains what ADR-010 already names: if the real backend's cookie name/`HttpOnly`/`SameSite` config differs from what `proxy.ts` and `lib/mockSessionCookie.ts` assume, the auth gate silently stops enforcing anything meaningful.

**Testing.** 458 unit/integration tests, 83 E2E tests, 12 accessibility scans — every domain has real workflow E2E coverage, not just page-reachability smoke tests. The one concrete critical-workflow gap: `lib/api.ts`'s silent-refresh-and-retry 401 interceptor (the mid-session token-expiry path, distinct from the already-tested bootstrap-time refresh) has no dedicated test file. Coverage is intentionally uneven elsewhere — `property.service.ts`/`developer.service.ts`/`dashboard.service.ts`/`upload.service.ts`/`auth.service.ts` and 11 of 14 hooks have no direct unit test, covered only indirectly through integration tests — a known, self-admitted gap in `TODO.md`, not a hidden one. Two pre-existing test flakes (clock-drift, autosave-timing contention) remain open with no concrete remediation deadline; a third instance of the same E2E contention class surfaced again during this review's own regression runs.

**Developer experience.** Folder structure, naming, and the mock → service → hook → components → route → tests → e2e-spec pattern are all consistent enough that a new senior engineer could add a 9th domain within an hour by following the existing 8 as templates. The one friction point: `docs/ARCHITECTURE.md` is long and narrative (onboarding-depth, not fast-reference), and there's no standalone "add a domain" checklist — a newcomer has to piece the pattern together from ADR cross-references rather than read one document.

**Technical debt.** See `TODO.md`'s "Technical Debt" section for the full itemized list with Critical/High/Medium/Low classification. Nothing classified Critical is a frontend code problem — every Critical item (no real backend, the mock-session-cookie shim, the unconfirmed `AUTH_COOKIE_NAME`) is inherently blocked on the backend existing, not fixable from this repo alone. Two items were reclassified High and fixed this pass (React Query retry policy, query-key drift risk); one was reclassified High and deliberately deferred to its own phase (table semantics) rather than rushed.

**Production readiness score: 78/100.**

Scoring rationale — this is a frontend-completeness and integration-safety score, not a "would this survive today's traffic" score, since there is no real traffic yet:
- Architecture & domain design: 18/20 — coherent, reused seams, one real duplication risk (filter bars) not yet consolidated.
- API/service-layer readiness: 15/20 — mock-first contracts are mostly REST-shaped; client-side aggregation (Analytics, Dashboard Home) and the mutate-in-place mock pattern are the two things that won't survive a literal lift-and-shift onto a real backend without adjustment.
- State management: 9/10 — one real bug found and fixed this pass; the rest is clean.
- Design system: 8/10 — strong reuse story, two consolidation opportunities open.
- Accessibility: 7/10 — clean automated scans, but the two richest data views lack semantic table markup underneath that floor.
- Performance: 8/10 — correct Server/Client boundary; code-splitting and memoization are unexplored, unmeasured opportunities, not confirmed problems.
- Security: 8/10 — sound token/route-protection design; headers were a real gap, now closed; CSRF reasoning still needs writing down once the backend's cookie config is confirmed.
- Testing: 5/10 — strong breadth (458 unit + 83 E2E + 12 a11y), but real, named gaps (service-layer coverage, the 401-retry interceptor, two long-lived flakes) keep this the lowest-scoring dimension.

**What would move the score:** writing real service-layer/hook unit tests for the untested five services and the `lib/api.ts` interceptor; a dedicated phase to convert `ListingsTable`/`AppointmentsTable` to semantic markup; and, once the real backend exists, confirming the cookie contract `proxy.ts`/`mockSessionCookie.ts` currently assume and replacing the client-side aggregation in Analytics/Dashboard Home with real server endpoints.

**Backend Integration Planning** (the natural next step after this review) is a separate, dedicated pair of documents rather than a section here: `docs/API_CONTRACT.md` (full per-service endpoint/DTO contract for backend engineers) and `docs/BACKEND_INTEGRATION_ROADMAP.md` (consolidated `TODO(backend)` checklist, assumptions needing backend-team sign-off, endpoint prioritization, auth/media review, and a 6-phase mock-to-real migration plan). No mock has been replaced — that work waits on approval of those documents.

---

### ADR-017: Pre-Integration Reconciliation — Feature Catalog, City/District, Category-Aware Property Model, Explainable Similarity

**Date:** August 10, 2026
**Status:** Accepted
**Decision:** Following `docs/PRODUCT_BACKEND_RECONCILIATION.md`'s findings against the real backend ER diagram, this phase implements the frontend-owned corrections it identified as safe to build without backend changes — no new API endpoints invented, no mock services replaced, no backend/database contact.

**Amenities become a real catalog, not a hardcoded per-category string map.** `services/feature.service.ts` + `services/mocks/features.mock.ts` (mirroring the ER's `feature`/`property_feature` tables) replace `constants/amenities.ts`'s `AMENITY_POOLS` as the one source of truth. `Feature.propertyCategories` (which categories a feature is offered for) is explicitly documented as frontend-owned product logic layered on top of the ER — the ER's `property_feature` join has no category constraint of its own. `ListingAmenitiesSection` now renders selected features as removable chips above the full picker; `PropertyAmenities` (Property Detail) reads the same catalog via `getFeatureByName` so an amenity's icon can never drift between the two surfaces.

**City/District is additive, not a rename of `region`.** `constants/locations.ts` gained a `DISTRICTS` mock (city → district[]) and `Property.district`/`ListingFormValues.district`, both optional. `region` is untouched everywhere it already appears — the reconciliation explicitly found `region` (Ghana-region-scale) and `district` (ER's city-scoped subdivision) are not interchangeable, and the final terminology is still an open product/backend decision (see the reconciliation doc §6/§18). `ListingLocationSection` now has a City → District cascading select that clears the district whenever the city changes.

**The property measurement model splits by category, replacing a single generic `areaSqm` going forward.** `Property.landSizeSqm`/`buildingSizeSqm` mirror the ER's `land_size_sq_m`/`building_size_sq_m` columns exactly; `areaSqm` is kept and marked `@deprecated` — a display-only fallback for older mock records, read by `lib/propertyMeasurements.ts`'s `getPrimaryMeasurement()`, the one function Property Detail/Property Card/Similar Properties all call rather than duplicating the category branch three times.

**Six previously-modeled-but-not-editable Property fields (`bedrooms`, `bathrooms`, `carSpaces`, `yearBuilt`, `landSizeSqm`, `buildingSizeSqm`) get a form.** New `ListingMeasurementsSection`, category-conditional per the reconciliation's field matrix (Part 5/6): House/Apartment show bedrooms/bathrooms/car spaces/building size/year built; Land shows land size only; Commercial/Office show building size/car spaces/year built, never bedrooms/bathrooms. None of the six are required at draft or publish, except `landSizeSqm` for LAND at publish time — `publishListingSchema` gained a `.superRefine` for that one category-conditional rule rather than a second validation system, per the explicit instruction to reuse the existing schema architecture.

**Similar Properties becomes a deterministic, explainable scoring model, not a category-only filter.** `lib/similarProperties.ts`'s `rankSimilarProperties` scores same-category candidates on listing type, city, district, price proximity, bedrooms (House/Apartment only — never scored for Land), and land/building size proximity (category-appropriate field), then builds each result's own explanation string from only the signals that actually matched that candidate — never a generic template. Explicitly not machine learning, not personalization; documented as such at the call site.

**Property filters gained a category-aware bedrooms filter.** `FilterPanel` only shows the bedrooms select when no category is chosen or the chosen category actually has bedrooms (House/Apartment) — `lib/propertyFilters.ts`'s `BEDROOM_CATEGORIES` is the one place that eligibility list lives, matching `ListingMeasurementsSection`'s own category table.

**Public Navbar is now sticky and branded consistently**, per the meeting's explicit "premium/sticky behavior" requirement — `bg-background/95 sticky top-0 z-40 backdrop-blur-sm`, no scroll-linked JS. A `NavbarAuthSection` "Dashboard" link now gives an authenticated DEVELOPER/ADMIN a one-click way back into their dashboard from any public page, without needing the account menu.

**A product-role display mapping layer, not a role rename.** `lib/roles.ts`'s `PRODUCT_ROLE_LABEL` maps the unchanged internal `UserRole` (`USER`/`DEVELOPER`/`ADMIN`) to the meeting's product terminology (Client/Developer/Super Admin) for display only — `RequireAuth`'s `ROLE_RANK` remains the only authorization source of truth, untouched. Per the reconciliation's explicit finding that renaming `ADMIN` → `SUPER_ADMIN` is not just a label change (whether a Super Admin should still rank-inherit every DEVELOPER permission is a real, unresolved product decision), no role values were renamed.

**Admin route protection was audited, not silently "fixed" with an invented claim.** `proxy.ts` still only gates on session-cookie presence — it deliberately does not decode a role from the mock session cookie, since that cookie is an unsigned presence marker, not a verifiable claim, and trusting a role read from it would be inventing a JWT claim this environment doesn't have. The actual, safe role check remains `RequireAuth`'s existing `ROLE_RANK` comparison (unchanged logic, now with explicit regression tests — see `RequireAuth.test.tsx`'s "super-admin route protection" describe block and the new `proxy.test.ts`). `proxy.ts`'s doc comment now states plainly that the backend must independently re-verify role on every admin-scoped request; the frontend guard is UX-layer defense in depth, not the security boundary.

**Consequences:**

- ✅ Every change in this phase is additive or frontend-internal — no `TODO(backend)` marker was removed, no mock service was deleted, and every new mock (`features.mock.ts`, `DISTRICTS`) follows the existing one-mock-file-per-concept convention.
- ✅ `Property.areaSqm`'s deprecation is non-breaking: every existing mock record and every display component still resolves a value via `getPrimaryMeasurement()`'s fallback.
- ⚠️ Backend confirmation is still required before `district`, the six new measurement fields, or the feature catalog can be considered final — see `docs/PRODUCT_BACKEND_RECONCILIATION.md` §18 for the specific open questions (region-vs-district terminology, `areaSqm` → land/building-size field mapping, whether `feature.category` on the real backend means the same "display grouping" this mock assumes).
- ⚠️ Super Admin remains foundation-only by design this phase (see the IA below) — no page beyond the existing empty `(admin)/layout.tsx` was built, and no suspend/approve action (real or fake) was added anywhere.

**Follow-up (Feature Catalog Consistency Pass, August 2026):** this phase left one gap unresolved — `services/mocks/properties.mock.ts` kept seeding fixture amenities from the legacy `constants/amenities.ts` (`AMENITY_POOLS`) instead of the new catalog, a second source of truth for the same taxonomy. A dedicated follow-up pass migrated the mock fixtures onto `getFeatureNamesForCategory()` (a new synchronous helper in `feature.service.ts`, fixture-only — real components still call the async `getFeatures()`), deleted `constants/amenities.ts` after confirming it was genuinely unused repository-wide, and — while diffing the two taxonomies to confirm the migration was lossless — found and fixed a real value gap the original catalog build had accidentally introduced (`office` listings had silently lost the "24/7 Security" feature). See `TODO.md`'s "Feature Catalog Consistency Pass" entry for the full account, including the new feature-overlap signal this consolidation made safe to add to `lib/similarProperties.ts`.

---

## Super Admin — Information Architecture (Foundation Only)

Per the reconciliation's explicit finding that Super Admin is closer to a net-new product surface than an integration task, this section documents the *intended* IA only — no pages, no components, no fake actions were built this phase. Distinct from the Developer Dashboard's seven-item nav (Home, My Properties, Appointments, Notifications, Analytics, Profile, Settings) on purpose, per the meeting's "developer and super-admin experiences must be clearly separated" requirement — a Super Admin does not manage their own properties, so reusing `DashboardSidebar`'s nav items would be wrong, not just visually inconsistent.

| Section | Purpose | ER support | Backend confirmation needed |
|---|---|---|---|
| Overview | Platform-wide at-a-glance health (property counts by status, pending reports, recent developer signups) | Computable from `property`/`report`/`property_developer` | None — pure aggregation once endpoints exist |
| All Properties | Cross-developer property table, ownership-independent | Yes — `property` has no owner-restricted query built in | None |
| Developers | Directory + detail view of every `property_developer` | Yes | None |
| Developer Approval | Gate before a developer's listings go live | **No dedicated field** — `is_verified` may or may not be the same gate as "approved" | Yes — see reconciliation §18 Q1 |
| Reports | Moderation queue reading `report.status`/`resolution_note`, resolve/dismiss actions | Yes — the generic polymorphic `report` entity fits this directly | Valid `report.target_type` values, and whether they're enforced server-side (§18 Q8) |
| Property Moderation | Suspend a property (`property.status`) | Yes | None |
| Platform Analytics | Aggregate of `property_analytics` across all properties | Partially — per-property rollups exist, no platform-summary table | Whether aggregation happens server-side or is computed from per-property rows |

**Not built this phase, and not faked:** no suspend/approve button anywhere renders as if it performs a real action — building a control that calls a nonexistent endpoint (or silently no-ops) would misrepresent the platform's actual capability, which is exactly the kind of premature/dishonest UI this reconciliation exists to prevent.

---

_ByTe Real Estate Platform — ARCHITECTURE.md_
_Maintained by Emmanuel (CTO). Update this document when any architectural decision changes._
