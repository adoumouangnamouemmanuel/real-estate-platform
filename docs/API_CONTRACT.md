# ByTe API Contract — Frontend Integration Reference

**Status:** Draft, for backend team review. Nothing here is implemented against a real backend yet — every shape below is inferred from the frontend's mock services (`frontend/services/*.service.ts`) and the pre-existing architecture notes in `ARCHITECTURE.md` §5–§11. Where the frontend is making an assumption rather than stating a confirmed contract, it's marked **[ASSUMPTION]** — see `BACKEND_INTEGRATION_ROADMAP.md` §5 for the consolidated list of assumptions that need sign-off before code changes.

This document is organized by domain, one section per frontend service. Each section lists: current mock methods, the future REST endpoint, request/response DTOs, pagination/filter/sort model, error responses, and auth requirements.

---

## Conventions (apply to every endpoint below unless stated otherwise)

**Base URL:** `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:4000/api/v1` in dev (`constants/config.ts`). Production: `https://api.byte.africa/api/v1` (ARCHITECTURE.md §12).

**Response envelope [ASSUMPTION]:** the frontend's `ApiResponse<T>` type expects every success response shaped as:
```json
{ "success": true, "data": { /* T */ }, "message"?: "optional human string" }
```
`authService.refresh()` already codes against this envelope (`services/auth.service.ts:65`, `api.data.data`). No other real endpoint exists yet to confirm this is universal — **needs backend sign-off that every endpoint uses this envelope, not a bare payload.**

**Error envelope [ASSUMPTION]:** `lib/errors.ts`'s `getErrorMessage` reads `error.response?.data?.message` on a failed Axios request. This implies error responses are shaped:
```json
{ "success": false, "message": "human-readable message", "code"?: "MACHINE_CODE", "errors"?: [{ "field": "email", "message": "..." }] }
```
The `code`/`errors` fields are not yet consumed by any frontend code — **recommend the backend include them from day one** (field-level validation errors in particular; see §5's validation note) even though the frontend doesn't parse them yet, so it doesn't have to catch up later.

**Pagination model (uniform across every list endpoint except Dashboard Home — see note there):**
- Request: `?page=1&pageSize=12` (1-based page, mirrors `GetXParams` interfaces below)
- Response:
```ts
interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```
This shape is used identically by Properties, Developers, Listings, Appointments, and Notifications. Recommend the backend implement one shared pagination helper/decorator rather than one per resource, mirroring how the frontend has one `paginate()` per mock service today (soon to collapse into one real implementation).

**Filtering/sorting model:** each domain has its own filter fields (documented per-section below), but the *mechanism* is uniform: filters and `sort` arrive as flat query-string params on the same GET request as pagination — never a POST-based "search" endpoint, never a request body on a list fetch.

**Auth requirement legend:**
- **Public** — no `Authorization` header required.
- **Authenticated** — any logged-in user (`USER`, `DEVELOPER`, or `ADMIN`).
- **Developer** — logged in with `role: DEVELOPER` (or `ADMIN`, which inherits), and scoped to `developerId` from the JWT — never a client-supplied developer id.
- **Admin** — `role: ADMIN` only.

**MVP classification legend** (used throughout): 🔴 **Required for MVP** · 🟡 **Required before production** · 🟢 **Nice to have**.

---

## 1. Authentication — `auth.service.ts`

No pagination/filtering/sorting — this is the one domain without a list endpoint.

| Mock method | Endpoint | Auth | MVP |
|---|---|---|---|
| `refresh()` | `POST /auth/refresh` | Public (sends `HttpOnly` cookie automatically) | 🔴 |
| `login({email,password})` | `POST /auth/login` | Public | 🔴 |
| `register({fullName,email,password})` | `POST /auth/register` | Public | 🔴 |
| `logout()` | `POST /auth/logout` | Authenticated | 🔴 |
| `requestPasswordReset(email)` | `POST /auth/forgot-password` | Public | 🟡 |
| `validateResetToken(token)` | `GET /auth/reset-password/:token` (or query param) | Public | 🟡 |
| `resetPassword({token,password})` | `POST /auth/reset-password` | Public | 🟡 |

**Request DTOs:**
```ts
LoginPayload           { email: string; password: string }
RegisterPayload        { fullName: string; email: string; password: string }
ResetPasswordPayload   { token: string; password: string }
```

**Response DTO (login/register/refresh):**
```ts
AuthSession { user: User; accessToken: string }
User { id: string; fullName: string; email: string; role: "USER"|"DEVELOPER"|"ADMIN"; developerId?: string }
```
Plus, out-of-band: a `Set-Cookie` header carrying the `HttpOnly`/`Secure`/`SameSite=Strict` refresh-token cookie (never in the JSON body). See `BACKEND_INTEGRATION_ROADMAP.md` §8 for the full auth-flow review.

**`validateResetToken` response:** `{ valid: boolean; expired: boolean }` — the frontend distinguishes "never existed / already used" from "existed but expired" to show different copy.

**Error responses required:**
- `login`: **identical message** for wrong password and unknown email — "Invalid email or password." (anti-enumeration; do not return different codes for these two cases either, since a distinguishable `code` defeats the point as much as a distinguishable `message`).
- `register`: a distinguishable "email already exists" error is **expected and fine** here (deliberate exception, see ARCHITECTURE.md §6).
- `requestPasswordReset`: **must return 200 success unconditionally**, whether or not the email matches an account — the frontend never branches on this response.
- `resetPassword`: distinguishable error for invalid/expired token is fine (token possession already implies email receipt, so no enumeration risk).

**Password policy:** length-only, 8–128 characters (NIST SP 800-63B / OWASP ASVS) — no composition rules. Confirm the backend enforces the same policy server-side (client-side Zod validation, see §5, is UX-only).

---

## 2. Properties — Public Catalogue — `property.service.ts`

**Auth: Public** for every method — this is the anonymous browsing/search surface.

| Mock method | Endpoint | MVP |
|---|---|---|
| `getProperties(params)` | `GET /properties` | 🔴 |
| `getPropertyBySlug(slug)` | `GET /properties/:slug` | 🔴 |
| `getRelatedProperties({id,category}, limit)` | `GET /properties/:id/related?limit=4` | 🟡 |

**Filter/sort params (`GetPropertiesParams`):**
```ts
{
  q?: string;              // full-text search — see ARCHITECTURE.md §10 (tsvector/tsquery)
  category?: PropertyCategory;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number; pageSize?: number;  // default pageSize: 12
}
```
`ARCHITECTURE.md` §10 already specifies the exact query shape this maps to (`plainto_tsquery`, `city ILIKE`, `price <= priceMax`, `ORDER BY rank DESC, created_at DESC`) — the frontend's `filterProperties`/`sortProperties` mock functions were deliberately written to mirror that shape field-for-field, so swapping this for the real endpoint is a query-building change on the backend, not a filter redesign on the frontend.

**Response DTOs:**
```ts
Property {
  id, slug, title, description, price: number,
  listingType: "SALE"|"RENT", category: PropertyCategory,
  city, region, status: PropertyStatus, media: PropertyMedia[],
  updatedAt?: string, address?: string, amenities?: string[]
}
PropertyMedia { url: string; publicId: string; order: number }
PropertyDetail extends Property {
  address: string; amenities: string[]; developer: Developer  // required + joined, unlike the list shape
}
```
Note the deliberate split: the **list** endpoint (`GET /properties`) can omit `address`/`amenities`/`updatedAt` and must not join the full developer object; the **detail** endpoint (`GET /properties/:slug`) must include all three, joined. Don't have one endpoint always return the heavier shape — the frontend's card/grid views were built assuming the list response is lighter.

**Only `ACTIVE` properties should ever appear here** — `DRAFT`/`SUSPENDED`/`RESERVED`(arguably)/`SOLD` listings belong to the developer's own `GET /developers/me/listings` (§4), never this public endpoint. Confirm the backend filters by status server-side rather than trusting the frontend to.

**Errors:** `getPropertyBySlug`/`getRelatedProperties` on an unknown slug/id → `404`, generic "not found" message (no sensitive detail).

---

## 3. Developers — Public Directory — `developer.service.ts`

**Auth: Public** for every method.

| Mock method | Endpoint | MVP |
|---|---|---|
| `getDevelopers(params)` | `GET /developers` | 🟡 |
| `getDeveloperBySlug(slug)` | `GET /developers/:slug` | 🟡 |
| `getDeveloperListings(id, {page,pageSize})` | `GET /developers/:id/listings` | 🟡 |
| `getFeaturedListings(id, limit)` | `GET /developers/:id/listings/featured?limit=4` | 🟢 |

**Filter/sort params (`GetDevelopersParams`):**
```ts
{ q?: string; city?: string; sort?: "rating_desc"|"name_asc"|"listings_desc"; page?: number; pageSize?: number }
```
Default `pageSize: 12`. Default sort is `rating_desc` with unrated developers sorted last (`ORDER BY rating DESC NULLS LAST` in Postgres terms).

**Response DTOs:**
```ts
Developer { id, slug, name, logoUrl?, city, region, isVerified: boolean, rating?: number, activeListings: number }
DeveloperProfile extends Developer { bio, coverImageUrl?, email, socialLinks: {website?,facebook?,instagram?}, totalListings, yearsActive }
```
Same list/detail split as Properties: `activeListings`/`rating` are cheap aggregates safe to compute on every list row; `bio`/`socialLinks`/`totalListings`/`yearsActive` only need joining on the detail page.

**Errors:** unknown slug/id → `404`.

---

## 4. My Properties (Developer's Own Portfolio) — `listing.service.ts`

**Auth: Developer**, scoped to the caller's own `developerId` on every method — **the backend must derive the developer scope from the JWT, never accept a developer/listing id that resolves to someone else's data** (see ownership-check note in `ARCHITECTURE.md` §6/§14).

| Mock method | Endpoint | MVP |
|---|---|---|
| `getListings(params)` | `GET /developers/me/listings` | 🔴 |
| `getStatusCounts()` | `GET /developers/me/listings/counts` | 🟡 |
| `getListingForEdit(slug)` | `GET /developers/me/listings/:slug` | 🔴 |
| `createListing(patch)` | `POST /developers/me/listings` | 🔴 |
| `updateListing(slug, patch)` | `PATCH /developers/me/listings/:slug` | 🔴 |
| `updateListingStatus(id, status)` | `PATCH /developers/me/listings/:id/status` | 🔴 |
| `deleteListing(id)` | `DELETE /developers/me/listings/:id` | 🟡 |
| `bulkUpdateStatus(ids, status)` | `PATCH /developers/me/listings/bulk-status` | 🟡 |
| `bulkDelete(ids)` | `POST /developers/me/listings/bulk-delete` (or `DELETE` with a body — confirm with backend team which the framework supports cleanly) | 🟢 |

**Filter/sort params (`GetListingsParams`):**
```ts
{ q?: string; status?: PropertyStatus; category?: PropertyCategory; listingType?: ListingType;
  sort?: "updated_desc"|"price_asc"|"price_desc"|"title_asc"; page?: number; pageSize?: number }
```
Default `pageSize: 10`, default sort `updated_desc`.

**Request DTO — `ListingPatch` (used identically by create and update, PATCH semantics: only present keys are written):**
```ts
Partial<Pick<Property, "title"|"description"|"price"|"listingType"|"category"|"city"|"region"|"address"|"amenities"|"media">>
```
`createListing` accepts an empty/partial patch and the backend must apply the same empty-but-typed defaults the mock does (`title: "Untitled Listing"`, `price: 0`, `description: ""`, `media: []`, etc.) — a brand-new listing is always created as `DRAFT` with a **stable, immutable slug** generated once at creation and never regenerated on later title edits (the editor's URL must not go stale mid-session). Confirm the backend's slug-uniqueness strategy (mock appends `-2`, `-3`... on collision).

**Status transition rules — must be enforced server-side, not just client-side:**
```
DRAFT      → ACTIVE only ("Publish")
ACTIVE     → RESERVED | SOLD | SUSPENDED
RESERVED   → ACTIVE | SOLD
SUSPENDED  → ACTIVE
SOLD       → (terminal, no further transitions)
```
`updateListingStatus`/`bulkUpdateStatus` on an invalid transition → `400` with a message like `"Cannot move a listing from {from} to {to}."` (mock's exact wording, safe to reuse). **Deletable statuses are `DRAFT` and `SUSPENDED` only** — `ACTIVE`/`RESERVED`/`SOLD` must be suspended first (mirrors "don't delete a listing with live enquiries or a completed sale"); `deleteListing` on a non-deletable status → `400`.

**Bulk endpoints must partially succeed, not all-or-nothing:** response shape
```ts
{ updated: string[]; skipped: string[] }   // bulk-status
{ deleted: string[]; skipped: string[] }   // bulk-delete
```
A bulk action over a mixed-status selection applies to whichever rows are actually eligible and reports the rest as `skipped` — it must never fail the whole request because one row in the batch was ineligible.

**`getStatusCounts` response:** `Record<PropertyStatus, number>` — all 5 keys always present, zero-filled, not sparse.

**Errors:** unknown id/slug on any mutating method → `404` (the frontend now handles this as a proper rejected promise everywhere, not a thrown exception — see the async-consistency fix in `CHANGELOG.md`).

---

## 5. Property Editor Media Uploads — `upload.service.ts`

**Auth: Developer.** Two-step client-side-direct-to-Cloudinary flow, already fully specified in `ARCHITECTURE.md` §7 — reproduced here since it's the contract `uploadService` stands in for:

| Mock method | Real flow | MVP |
|---|---|---|
| `uploadFile(file)` | `POST /uploads/signature` (backend) → direct `POST` to Cloudinary from the browser (not through the backend at all) | 🔴 |
| `deleteUpload(publicId)` | `DELETE /uploads/:publicId` | 🟡 |

**`POST /uploads/signature` request/response:**
```ts
// request: no body needed beyond auth, or optionally { folder?: string }
// response:
{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }
```
Frontend then `POST`s directly to `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` with `file + signature + timestamp + folder`, and Cloudinary responds with `{ url, publicId, width, height, format }`. The frontend stores only `{ url, publicId, order }` per `PropertyMedia` — `width`/`height`/`format` are not currently modeled in `PropertyMedia` and would need a type change if the frontend needs to read them (e.g., for aspect-ratio-aware layout) — **flag to backend/frontend leads if that's wanted**, since today it's silently dropped.

**Limits to enforce identically client- and server-side** (already documented in ARCHITECTURE.md §7, restated here as the exact numbers `MediaUploader` was built against): max 10 images per listing, max 10MB per image / 50MB per video, JPEG/PNG/WebP images, MP4/MOV video. The frontend enforces these today for UX (immediate feedback); **the backend must enforce them independently** (Multer size limits + Cloudinary upload preset), since client-side limits are trivially bypassable.

**`deleteUpload`** must call Cloudinary's authenticated destroy API server-side and delete the `PropertyMedia` record — never expose Cloudinary's destroy credentials to the frontend.

**Not yet modeled on the frontend:** upload progress percentage from Cloudinary's own upload response — `MediaUploader`'s queue UI currently only has "pending / uploading / done / error" states, not a byte-level progress bar. Flag as a 🟢 nice-to-have if product wants it later.

---

## 6. Appointments — `appointment.service.ts`

**Auth: Developer**, scoped to own `developerId`.

| Mock method | Endpoint | MVP |
|---|---|---|
| `getAppointments(params)` | `GET /developers/me/appointments` | 🔴 |
| `getStatusCounts()` | `GET /developers/me/appointments/counts` | 🟡 |
| `getAppointment(id)` | `GET /developers/me/appointments/:id` | 🔴 |
| `updateStatus(id, status)` | `PATCH /developers/me/appointments/:id/status` | 🔴 |
| `reschedule(id, scheduledFor)` | `PATCH /developers/me/appointments/:id/reschedule` | 🔴 |
| `bulkUpdateStatus(ids, status)` | `PATCH /developers/me/appointments/bulk-status` | 🟡 |

**Not yet modeled at all on the frontend, but implied by the domain:** there is currently no `createAppointment` — appointments are always seeded as pre-existing mock rows. **A real backend needs a "guest requests a viewing" endpoint** (`POST /properties/:slug/appointments` or similar, public/authenticated-guest-facing, not under `/developers/me/`) that the frontend doesn't have a UI for yet — this is a gap, not an oversight; flag to product/backend as likely required for MVP even though no frontend work models it today.

**Filter/sort params (`GetAppointmentsParams`):**
```ts
{ q?: string; status?: AppointmentStatus; timeframe?: "today"|"upcoming"|"overdue";
  sort?: "date_asc"|"date_desc"; page?: number; pageSize?: number }
```
Default `pageSize: 10`, default sort `date_asc`. **`timeframe` is currently computed client-side against `Date.now()`** (`matchesTimeframe`/`isOverdueAppointment` in the mock) — `ARCHITECTURE.md`'s own Technical Debt note already flags this should move server-side against one consistent clock; recommend the backend compute `today`/`upcoming`/`overdue` as a `WHERE` clause, not have the frontend pass a raw "now" timestamp for the backend to filter by (timezone-fragile either way, but at least server-side avoids per-client clock skew).

**Status graph — enforce server-side:**
```
REQUESTED  → CONFIRMED | CANCELLED
CONFIRMED / RESCHEDULED → RESCHEDULED | COMPLETED | NO_SHOW | CANCELLED
COMPLETED / CANCELLED / NO_SHOW → (terminal)
```
`reschedule` always lands the appointment in `RESCHEDULED` regardless of prior status, and is rejected (`400`) if the appointment is already terminal. Every status-changing mutation must append an entry to the appointment's own history log (see `ActivityItem` shape below) — the details drawer's timeline is built entirely from this.

**Response DTO:**
```ts
Appointment {
  id, propertyId, propertyTitle, clientName,
  scheduledFor: string /* ISO 8601 */, status: AppointmentStatus,
  previousScheduledFor?: string,  // only set while status === "RESCHEDULED"
  history?: ActivityItem[]
}
ActivityItem { id, type: ActivityType, message: string, timestamp: string /* ISO 8601 */ }
```
The `history` array's `message` strings are currently generated frontend-mock-side (e.g. `"You confirmed the viewing."`) — **decide with backend/content whether these strings are generated server-side (recommended, so copy changes don't require a frontend deploy) or client-side from a `type` enum the frontend already has a label map for.**

**Bulk endpoint restricted to a narrower action set than per-row:** `bulkUpdateStatus` should only ever be called with `CONFIRMED` or `CANCELLED` as the target — the frontend's `AppointmentActionPolicy` never offers Reschedule/Complete/No-Show as bulk actions (they're inherently per-visit). The backend doesn't strictly need to enforce this narrower set itself (the frontend already won't send anything else), but consider validating it anyway as defense in depth, matching the ownership-check precedent in ARCHITECTURE.md §14.

---

## 7. Notifications — `notification.service.ts`

**Auth: Developer**, scoped to own `developerId`.

| Mock method | Endpoint | MVP |
|---|---|---|
| `getNotifications(params)` | `GET /developers/me/notifications` | 🔴 |
| `getUnreadCount()` | `GET /developers/me/notifications/unread-count` | 🔴 |
| `markAsRead(id)` | `PATCH /developers/me/notifications/:id/read` | 🔴 |
| `markAllAsRead()` | `PATCH /developers/me/notifications/read-all` | 🟡 |

**Filter/sort params (`GetNotificationsParams`):**
```ts
{ status?: "UNREAD"|"READ"|"ARCHIVED"; category?: "APPOINTMENT"|"LISTING"|"SYSTEM"; sort?: "date_desc"|"date_asc"; page?: number; pageSize?: number }
```
Default `pageSize: 10`, default sort `date_desc`.

**`category` is derived, never stored** — the frontend computes it from `NotificationType` via one lookup table (`NOTIFICATION_CATEGORY` in `notification.service.ts`) and expects the backend to do the same rather than persist a redundant `category` column that could drift from `type`. **If the backend does filter by category server-side (recommended, so this doesn't become a full-table-scan-then-filter-in-app-code problem at scale), it needs the identical `NotificationType → NotificationCategory` mapping** — reproduced here for parity:
```
APPOINTMENT: APPOINTMENT_REQUESTED, APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED, APPOINTMENT_RESCHEDULED, APPOINTMENT_COMPLETED, APPOINTMENT_NO_SHOW
LISTING:     LISTING_PUBLISHED, LISTING_SUSPENDED, DRAFT_REMINDER
SYSTEM:      SYSTEM
```

**Response DTO:**
```ts
Notification { id, type: NotificationType, title: string, body: string, createdAt: string /* ISO */, status: NotificationStatus, link?: string }
```
`NotificationStatus` is `"UNREAD"|"READ"|"ARCHIVED"` — a **strict progression modeled as one enum, not two booleans** (see ADR-015). `ARCHIVED` is fully designed into the frontend's types/filters already but **nothing produces or exposes it yet** — no archive action exists in the UI. The backend doesn't need to support transitioning *into* `ARCHIVED` for MVP, but should model the column as the 3-value enum from day one so it doesn't need a schema migration later.

**Real-time model: polling, not WebSockets** (ARCHITECTURE.md §9, explicit MVP decision) — `getUnreadCount()` is polled every 30s from the frontend (`useUnreadNotificationCount`). No backend work is needed to support this beyond making that one endpoint cheap (an indexed `COUNT(*) WHERE status='UNREAD'`, not a full table fetch).

**Enqueue flow (backend-internal, frontend consumes only the read side):** `ARCHITECTURE.md` §9 already specifies `notificationQueue.add(...)` (BullMQ) triggered from the mutations that produce each notification type (appointment status changes, listing publish/suspend) — the 8 appointment/listing/draft `NotificationType` values map directly to those existing mutation-time triggers; `SYSTEM` is the one type with no single trigger (performance summaries, account events).

---

## 8. Analytics — `analytics.service.ts`

**Auth: Developer**, scoped to own `developerId`. **This is the one domain that should not be a thin CRUD wrapper — the whole point of the real endpoint is to move aggregation server-side that the frontend currently does client-side over paginated data.**

| Mock method (today) | Real endpoint (target) | MVP |
|---|---|---|
| `getSnapshot(period)` — fetches up to 1000 listings + 1000 appointments and aggregates them in the browser | `GET /developers/me/analytics?period=7d\|30d\|90d` — **must return the fully-aggregated `AnalyticsSnapshot` directly; the frontend should never need to fetch raw listing/appointment rows to compute this** | 🟡 |

**Request:** `?period=7d|30d|90d` (only param — no pagination/filtering, this is a single aggregate payload per period).

**Response DTO — must match exactly, so the service method disappears entirely and only the hook layer's fetch target changes:**
```ts
AnalyticsSnapshot {
  period: "7d"|"30d"|"90d";
  generatedAt: string; // ISO 8601
  actionNeeded: ActionNeededItem[];
  stats: AnalyticsStat[];
  funnel: AppointmentFunnel;
  portfolio: PortfolioComposition;
}
ActionNeededItem { type: "OVERDUE_APPOINTMENTS"|"STALE_DRAFTS"|"HIGH_CANCELLATION_RATE"; severity: "high"|"medium"; title: string; description: string; count: number; href: string }
AnalyticsStat { key: string; label: string; value: number; format: "number"|"percent"|"hours"; hint?: string; trend?: number[] }
AppointmentFunnel { period; stages: {status,count}[]; totalRequested: number; responseRate: number; completionRate: number; cancellationRate: number; noShowRate: number; averageResponseHours: number|null }
PortfolioComposition { totalListings: number; byStatus: {status,count}[]; byCategory: {category,count}[] }
```

**Business rules the backend must replicate exactly** (currently pure functions in `lib/analyticsCalculations.ts` — hand this file to backend engineers as the literal spec, it's already unit-tested against 19 cases):
- `PortfolioComposition`/`ActionNeededItem[]` are **always current-state**, never period-filtered (a stale draft doesn't stop being stale because the period selector changed).
- `AppointmentFunnel` and its four rates **are** period-scoped, cohorted by each appointment's *request* date (not completion date) — an appointment with no request-history timestamp is **excluded from every period's cohort**, never guessed into one.
- `HIGH_CANCELLATION_RATE` only fires once `totalRequested >= 5` in the period (avoid flagging noise off a tiny sample).
- `STALE_DRAFTS`/`OVERDUE_APPOINTMENTS` severity is `"high"` at count ≥ 3, `"medium"` below that (exact thresholds in `lib/analyticsCalculations.ts`'s constants — copy verbatim, don't re-derive).
- `AnalyticsStat.trend` must be a **real day-bucketed series from timestamped history events, never interpolated** — only the "Completed Viewings" stat currently has one.

**Known, deliberate frontend gap — do not silently "fix" without a product conversation:** there is no per-property view-count field anywhere in the data model (`MOCK_TOTAL_PROPERTY_VIEWS` is a single hardcoded aggregate). "Top Properties by Views" was explicitly excluded from the Analytics UI rather than fabricated. If `PropertyAnalytics` (ARCHITECTURE.md §11) becomes available with real per-property daily rollups, this is a genuine **new feature to design**, not a mechanical mock-to-real swap — loop in product/design before adding it.

---

## 9. Dashboard Home — `dashboard.service.ts`

**Auth: Developer.** **This is the one domain whose contract shape should change during integration, not just its data source** — see `BACKEND_INTEGRATION_ROADMAP.md`'s Technical Debt carry-over: every method here uses a bare `limit` param and returns a bare array/object, unlike every other domain's `{page,pageSize} → PaginatedResult`. Recommend the backend either match that pattern (`GET /developers/me/dashboard/recent-listings?limit=5` returning `PaginatedResult<Property>`) or, better, **compose most of this into one `GET /developers/me/dashboard` aggregate call** (see below) since none of these widgets currently support pagination in the UI anyway.

| Mock method | Suggested real shape | MVP |
|---|---|---|
| `getSummary()` | Fold into `GET /developers/me/dashboard` | 🔴 |
| `getMetrics()` | Fold into `GET /developers/me/dashboard` | 🔴 |
| `getRecentListings(limit=5)` | Fold into `GET /developers/me/dashboard`, or `GET /developers/me/listings?pageSize=5&sort=updated_desc` (reusing §4's endpoint instead of a bespoke one) | 🔴 |
| `getAppointmentOverview()` | Fold into `GET /developers/me/dashboard`, or three calls to §6's endpoint with `status=` filters | 🔴 |
| `getNotifications(limit=5)` | `GET /developers/me/notifications?pageSize=5` (reuse §7's endpoint) | 🟡 |
| `getActivity(limit=6)` | Fold into `GET /developers/me/dashboard` | 🟡 |

**Response DTOs:**
```ts
DashboardSummary { developerName: string; companyName: string }
DashboardMetrics { totalProperties, activeListings, draftListings, appointmentRequests, unreadNotifications, totalPropertyViews }
AppointmentOverview { upcoming: Appointment[]; requested: Appointment[]; completed: Appointment[] }
```
`DashboardMetrics.totalPropertyViews` has the same "no real per-view data model yet" caveat as §8 — currently a hardcoded constant frontend-side; the backend needs a real source for this (`PropertyAnalytics` daily rollups summed, per ARCHITECTURE.md §11) or it stays a known placeholder.

**Recommendation:** collapse `getSummary`/`getMetrics`/`getRecentListings`/`getAppointmentOverview`/`getActivity` into **one** `GET /developers/me/dashboard` call returning a single composed object — this is a genuine opportunity to reduce 5 round-trips to 1 on the page every session starts on, and none of the 5 mock methods have independent cache-invalidation needs today that would argue for keeping them separate. `getNotifications` can stay as a thin reuse of §7's own paginated endpoint rather than a 6th shape.

---

## Summary: MVP Classification by Endpoint Count

| Classification | Count | Notes |
|---|---|---|
| 🔴 Required for MVP | 22 | Auth core, Properties browse, My Properties CRUD, Appointments core, Notifications core, Dashboard Home core |
| 🟡 Required before production | 14 | Password reset flow, Developers directory, bulk operations, Analytics, upload delete, status counts |
| 🟢 Nice to have | 3 | Featured listings, upload progress, bulk-delete listings |

See `BACKEND_INTEGRATION_ROADMAP.md` §6–§7 for the recommended build order and full endpoint-by-endpoint classification table.
