# Backend Integration Roadmap

**Status:** Planning only — no mock has been replaced yet. This document consolidates every `TODO(backend)` marker in the codebase into one checklist, lists the assumptions that need backend-team validation before any code changes, recommends a build/integration order, and lays out a phased migration so the frontend can switch from mocks to real endpoints one domain at a time rather than all at once. Pairs with `API_CONTRACT.md` (the endpoint-by-endpoint spec) and `ARCHITECTURE.md` (the system design these both assume).

---

## 1. Consolidated Backend Integration Checklist

Every `TODO(backend)` marker in the frontend, grouped by what has to exist before it can be removed. Pointer format is `file:line`.

### Auth
- [ ] `POST /auth/login` — `services/auth.service.ts:68`
- [ ] `POST /auth/register` — `services/auth.service.ts:86`
- [ ] `POST /auth/logout` (clears refresh cookie server-side) — `services/auth.service.ts:110`
- [ ] `POST /auth/forgot-password` — `services/auth.service.ts:116`
- [ ] Reset-token validation endpoint — `services/auth.service.ts:133`
- [ ] `POST /auth/reset-password` — `services/auth.service.ts:144`
- [ ] Real persistence for accounts (replaces `services/mocks/auth.mock.ts`) — `services/mocks/auth.mock.ts:3`
- [ ] Delete `lib/mockSessionCookie.ts` once the backend sets the real `HttpOnly` cookie on login/register — `lib/mockSessionCookie.ts:6`

### Properties / Developers (public)
- [ ] `GET /properties` (+ detail, + related) — `services/mocks/properties.mock.ts:6`
- [ ] `GET /developers` (+ detail, + listings) — `services/developer.service.ts:77`, `services/mocks/developers.mock.ts:3`
- [ ] Derive `constants/locations.ts`'s city list from `GET /properties` distinct cities, instead of a hardcoded list — `constants/locations.ts:1`

### My Properties (developer-owned)
- [ ] `GET/POST/PATCH/DELETE /developers/me/listings` (full CRUD + bulk) — `services/listing.service.ts:188`, `services/mocks/listings.mock.ts:3`

### Appointments
- [ ] `GET/PATCH /developers/me/appointments` (+ reschedule, + bulk) — `services/appointment.service.ts:184`, `services/mocks/appointments.mock.ts:3`
- [ ] **Not a TODO marker, but a gap found during this review:** no guest-facing "request a viewing" endpoint exists in either the mocks or the API contract yet — see `API_CONTRACT.md` §6.

### Notifications
- [ ] `GET/PATCH /developers/me/notifications` (+ unread-count, + mark-all) — `services/notification.service.ts:117`
- [ ] Real notification production (backend `notificationQueue` enqueue on the triggering mutations, per ARCHITECTURE.md §9) — `services/mocks/notifications.mock.ts:3`

### Analytics
- [ ] `GET /developers/me/analytics?period=` — `services/analytics.service.ts:30`

### Dashboard Home
- [ ] Developer-scoped dashboard aggregate endpoint(s) — `services/dashboard.service.ts:31`, `services/mocks/dashboard.mock.ts:9`

### Media
- [ ] `POST /uploads/signature` (Cloudinary signed upload) — `services/upload.service.ts:23`
- [ ] `DELETE /uploads/:publicId` — `services/upload.service.ts:36`

### Telemetry / Events
- [ ] `POST /analytics/events` (appointment lifecycle events currently a `console.debug` no-op) — `lib/telemetry.ts:25`

**Total: 24 distinct backend deliverables** across 8 domains, tracked here as the single source of truth going forward — individual `TODO(backend)` comments in the code should keep pointing back to this checklist rather than drifting into their own parallel tracking.

---

## 2. Assumptions Requiring Backend Team Validation

These are frontend decisions made without a real backend to confirm against. None are blockers to *starting* integration, but each should be explicitly confirmed (or corrected) before the corresponding domain is wired up — getting one wrong silently breaks auth or caching, not just a cosmetic mismatch.

| # | Assumption | Where it lives | Risk if wrong |
|---|---|---|---|
| 1 | Refresh-token cookie is named `refresh_token` | `constants/config.ts:10` | `proxy.ts`'s auth gate silently stops working — every dashboard route redirects to login even for a legitimately authenticated session, or worse, never redirects an unauthenticated one if the check is inverted somewhere. |
| 2 | Refresh cookie is `HttpOnly`, `Secure`, `SameSite=Strict` | ARCHITECTURE.md §6, `lib/mockSessionCookie.ts:16` | If `SameSite` ends up `Lax`/`None` for cross-subdomain reasons, the CSRF posture assumed throughout this document (see §8) no longer holds and needs a real mitigation (double-submit token, custom header check) instead of relying on `SameSite=Strict` alone. |
| 3 | Every success response is enveloped as `{success,data,message?}` | `types/index.ts`'s `ApiResponse<T>`, only exercised today by `authService.refresh()` | If real endpoints return bare payloads instead, every service method's `.then(r => r.data.data)` unwrap breaks identically across all 8 domains — worth confirming once, not rediscovering per-domain during integration. |
| 4 | Error responses include a `message` field readable at `error.response.data.message` | `lib/errors.ts:10` | Every toast/inline error in the app falls back to a generic "Something went wrong" message instead of the backend's actual validation/business error text. |
| 5 | Access token JWT payload includes `developerId` | ARCHITECTURE.md §6 (`{userId, role, developerId, iat, exp}`) | Every "developer-owned" endpoint in `API_CONTRACT.md` assumes the backend derives scope from the JWT, not a client-supplied id — if `developerId` isn't in the token, every one of those endpoints needs a different scoping mechanism (e.g. a separate `/me` lookup first). |
| 6 | Pagination is always `{page,pageSize}` query params → `PaginatedResult<T>` response | All list endpoints in `API_CONTRACT.md` | A cursor-based API (common for infinite-scroll-style data) would require rewriting every `useX` hook's `keepPreviousData` pagination logic, not just the service layer. |
| 7 | `NotificationCategory` (`APPOINTMENT`/`LISTING`/`SYSTEM`) is derived from `type`, never a stored column | `services/notification.service.ts:22-38` | If the backend stores category separately, it can drift from type — recommend against this even if the backend team's initial instinct is to add a column for query performance; index on `type` instead. |
| 8 | `AnalyticsSnapshot`'s business rules (funnel cohorting, action-needed thresholds) move to the backend byte-for-byte | `lib/analyticsCalculations.ts` | If the backend re-derives its own version of these rules instead of using this file as the literal spec, the frontend and backend will silently disagree on numbers the moment either side's rounding, thresholds, or period-boundary handling differs even slightly. |
| 9 | `Property.updatedAt`/`address`/`amenities` are optional on the **public** list shape but required on the **detail**/**editor** shapes | `types/index.ts:56-68`, `types/index.ts:109` | If the backend's public list endpoint always returns the full joined shape "for simplicity," that's not wrong, just wasted payload — confirm it's a deliberate choice either way, not an oversight in either direction. |
| 10 | CORS will allow `app.byte.africa` and `localhost:3000` only | ARCHITECTURE.md §14 | Confirm before frontend dev work starts hitting a real staging backend — a CORS misconfiguration is usually discovered painfully, mid-integration, rather than planned around. |

---

## 3. Recommended First-Wave Endpoints (to unblock incremental integration)

Ordered by **unblocking value**, not raw priority — i.e., which endpoints let the frontend start replacing mocks and catching real integration bugs earliest, with the smallest blast radius if something's wrong.

1. **`POST /auth/login` + `POST /auth/refresh` + `GET /auth/me`-equivalent (via refresh)** — nothing else in the app can be integration-tested against a real session without this. Unblocks: real cookie contract validation (assumption #1–2), real `ApiResponse` envelope validation (assumption #3) on the very first real endpoint touched.
2. **`GET /properties` (public, paginated, list only — detail can follow a few days later)** — the highest-traffic, lowest-risk endpoint to validate the pagination/filter contract (assumption #6) against, since it's public (no auth complexity layered on top) and has no mutation risk.
3. **`GET /developers/me/listings` (My Properties, read-only first)** — first developer-scoped, authenticated endpoint; validates assumption #5 (JWT-derived `developerId` scoping) before any mutation risk is introduced.
4. **`POST /developers/me/listings` + `PATCH .../:slug`** — once read access is proven, add create/update; this is the endpoint the Property Editor's autosave hits most frequently, so it's worth a dedicated latency/retry check (the frontend's autosave already assumes ~400ms mock latency; real network latency + real validation round-trips should be load-tested here before other domains follow the same pattern).
5. **`GET /developers/me/appointments` + status/reschedule mutations** — second-highest-traffic authenticated domain; also the first place the frontend's per-appointment `history` array needs a real backend-generated timeline (see `API_CONTRACT.md` §6's note on message-string generation).
6. **`GET /developers/me/notifications/unread-count`** — cheapest possible endpoint to stand up (one indexed count query) and immediately de-risks the 30s-polling real-time model end-to-end before the fuller notifications list follows.
7. Everything else, per the phased roadmap in §10.

---

## 4. Endpoint Classification — Full Table

🔴 Required for MVP · 🟡 Required before production · 🟢 Nice to have

| Domain | Endpoint | Class |
|---|---|---|
| Auth | `POST /auth/login` | 🔴 |
| Auth | `POST /auth/refresh` | 🔴 |
| Auth | `POST /auth/register` | 🔴 |
| Auth | `POST /auth/logout` | 🔴 |
| Auth | `POST /auth/forgot-password` | 🟡 |
| Auth | Reset-token validation | 🟡 |
| Auth | `POST /auth/reset-password` | 🟡 |
| Properties | `GET /properties` | 🔴 |
| Properties | `GET /properties/:slug` | 🔴 |
| Properties | `GET /properties/:id/related` | 🟡 |
| Developers | `GET /developers` | 🟡 |
| Developers | `GET /developers/:slug` | 🟡 |
| Developers | `GET /developers/:id/listings` | 🟡 |
| Developers | `GET /developers/:id/listings/featured` | 🟢 |
| My Properties | `GET /developers/me/listings` | 🔴 |
| My Properties | `GET /developers/me/listings/:slug` | 🔴 |
| My Properties | `POST /developers/me/listings` | 🔴 |
| My Properties | `PATCH /developers/me/listings/:slug` | 🔴 |
| My Properties | `PATCH /developers/me/listings/:id/status` | 🔴 |
| My Properties | `GET /developers/me/listings/counts` | 🟡 |
| My Properties | `DELETE /developers/me/listings/:id` | 🟡 |
| My Properties | `PATCH /developers/me/listings/bulk-status` | 🟡 |
| My Properties | `POST /developers/me/listings/bulk-delete` | 🟢 |
| Media | `POST /uploads/signature` | 🔴 |
| Media | `DELETE /uploads/:publicId` | 🟡 |
| Appointments | `GET /developers/me/appointments` | 🔴 |
| Appointments | `GET /developers/me/appointments/:id` | 🔴 |
| Appointments | `PATCH /developers/me/appointments/:id/status` | 🔴 |
| Appointments | `PATCH /developers/me/appointments/:id/reschedule` | 🔴 |
| Appointments | `POST /properties/:slug/appointments` (guest-facing, currently unmodeled — see §6 gap) | 🔴 |
| Appointments | `GET /developers/me/appointments/counts` | 🟡 |
| Appointments | `PATCH /developers/me/appointments/bulk-status` | 🟡 |
| Notifications | `GET /developers/me/notifications` | 🔴 |
| Notifications | `GET /developers/me/notifications/unread-count` | 🔴 |
| Notifications | `PATCH /developers/me/notifications/:id/read` | 🔴 |
| Notifications | `PATCH /developers/me/notifications/read-all` | 🟡 |
| Analytics | `GET /developers/me/analytics` | 🟡 |
| Dashboard | `GET /developers/me/dashboard` (composed) | 🔴 |
| Telemetry | `POST /analytics/events` | 🟢 |

**39 endpoints total: 22 MVP, 14 pre-production, 3 nice-to-have** (the guest appointment-request endpoint above was added to this table during the review — it doesn't have a frontend UI yet but is required for the domain to make sense at all, so it's classified MVP despite no mock existing for it today).

---

## 5. Authentication Flow Review

**Refresh tokens.** Design (ARCHITECTURE.md §6) is sound: opaque, hashed server-side, 7-day expiry, rotated on every `/auth/refresh` call. Frontend already implements the consuming side correctly — access token in memory only (Zustand, never `localStorage`), silent-refresh-and-retry on a 401 (`lib/api.ts`'s response interceptor). **Nothing to change here** — this flow was designed before any mock existed and the frontend was built to match it exactly.

**Cookie contract.** `AUTH_COOKIE_NAME = "refresh_token"` (`constants/config.ts:10`) and the `HttpOnly`/`Secure`/`SameSite=Strict` shape are both **assumptions, not confirmed contract** (see §2, items 1–2). `lib/mockSessionCookie.ts` is a temporary shim that must be deleted the moment the real backend sets this cookie itself — it currently sets a **non-`HttpOnly`, no-auth-power marker cookie** purely so `proxy.ts`'s presence check passes in the mock environment; deleting it is a one-file removal, not a refactor, once the real `Set-Cookie` response exists.

**CSRF assumptions.** Not previously documented in `ARCHITECTURE.md` — added as part of the Platform Readiness Review. `SameSite=Strict` on the refresh cookie mitigates most CSRF vectors for the cookie-based refresh flow specifically (a cross-site request can't attach the cookie at all). However: **the access token is sent via `Authorization: Bearer`, not a cookie** — bearer-token requests are inherently not CSRF-vulnerable (CSRF exploits ambient credential attachment, which bearer headers don't have), so the *mutating* API calls (login-gated CRUD) are not at CSRF risk regardless of the cookie's `SameSite` value. The refresh endpoint itself (`POST /auth/refresh`, cookie-authenticated) is the one CSRF-relevant surface — confirm `SameSite=Strict` holds for it specifically, and that no other cookie-authenticated (as opposed to bearer-authenticated) endpoint exists or is planned.

**Authorization model.** Three roles, additive inheritance (`USER < DEVELOPER < ADMIN`, `ROLE_RANK` checked with `>=`) — already implemented in `RequireAuth` and documented in ARCHITECTURE.md §6/§14. Two layers, both required: `proxy.ts` (coarse, cookie-presence-only, defense in depth) and `RequireAuth` (role-aware, but only as UX gating — **the real authorization boundary must be the backend's own ownership checks**, e.g. `if (listing.developerId !== req.user.developerId) throw 403`, exactly as ARCHITECTURE.md §6 already specifies). Frontend-side role gating is not a security boundary and was never intended to be one — reconfirming this explicitly here since it's the kind of assumption worth stating out loud rather than leaving implicit.

**What's genuinely missing, not just assumed:** a written CSRF section in `ARCHITECTURE.md` itself (this document's §8 above should be ported there once confirmed with backend) and a test for the mid-session token-expiry retry path in `lib/api.ts` (flagged in the Platform Readiness Review's Technical Debt, `TODO.md`).

---

## 6. File Upload & Media Handling Review

Flow is fully specified (ARCHITECTURE.md §7, reproduced in `API_CONTRACT.md` §5) and the frontend's `MediaUploader`/`uploadService` were built against it from the start — this is one of the lowest-risk domains to integrate because the contract was designed first, mocked second.

**What integration actually changes:** `uploadService.uploadFile` currently collapses the two-step flow (`POST /uploads/signature` → direct Cloudinary POST) into one mock method that fakes the round-trip. Real integration splits this back into two real network calls — the frontend's `MediaUploader` queue UI (pending/uploading/done/error per file) doesn't need to change shape, just what `uploadFile` does internally.

**Confirm before integrating:**
- Whether `width`/`height`/`format` from Cloudinary's response should be added to `PropertyMedia` (currently dropped — see `API_CONTRACT.md` §5's note). Low effort either way, but a type change, not just a service change, so worth deciding before the first real upload is wired up rather than after.
- Whether upload progress (byte-level, not just queue-state) is wanted — Cloudinary's own SDK/XHR exposes this; the frontend doesn't currently model it at all.
- The exact Cloudinary folder/tagging convention (`byte/listings/...` is the mock's placeholder pattern) so re-uploads/re-organizing later doesn't require a data migration.

**Limits are already numerically agreed** (10 images/listing, 10MB image / 50MB video, JPEG/PNG/WebP/MP4/MOV) — these need enforcing on both sides independently (client-side for UX, server-side because client-side is bypassable), not re-negotiated.

---

## 7. Phased Backend Integration Roadmap

Each phase is scoped so the frontend runs in a **hybrid state** (some domains real, some still mocked) for its whole duration — never an all-or-nothing cutover. `services/index.ts` remains the single seam every component already imports through, so swapping one domain's implementation from mock to real is invisible to every consumer, exactly the same way the mock-first architecture (ADR-007) was designed to make this possible.

### Phase A — Auth Foundation
Real `POST /auth/login`, `POST /auth/refresh`, `POST /auth/register`, `POST /auth/logout`. Validates assumptions #1, #2, #3, #4, #5 all at once, since every later phase depends on these holding. `lib/mockSessionCookie.ts` deleted at the end of this phase. Password reset flow (`forgot-password`/`reset-password`) can land in this phase or slip to Phase E — it's isolated enough not to block anything else.

**Exit criteria:** a developer can log in against the real backend, land on `/dashboard`, and have every *other* domain continue working exactly as before (still on mocks) with zero regressions in the existing Playwright suite.

### Phase B — Public Catalogue (read-only, no auth)
Real `GET /properties` (list + detail + related), real `GET /developers` (list + detail + listings). Lowest-risk phase — no mutations, no auth complexity. Validates assumption #6 (pagination contract) and assumption #9 (list vs. detail shape split) against real data for the first time.

**Exit criteria:** the public site (`/`, `/properties`, `/developers`, `/search`) runs entirely against the real backend; the dashboard still runs entirely on mocks.

### Phase C — My Properties (first authenticated CRUD domain)
Real `GET/POST/PATCH/DELETE /developers/me/listings` + status transitions + bulk operations, in that order (read before write, singular before bulk — matches §3's unblocking-value ordering). Real `POST /uploads/signature` + `DELETE /uploads/:publicId` land alongside this phase, since the Property Editor is the only consumer of uploads.

**Exit criteria:** My Properties and the Property Editor are fully real; Appointments, Notifications, Analytics, and Dashboard Home remain mocked.

### Phase D — Appointments
Real `GET/PATCH /developers/me/appointments` + reschedule + bulk-status. **Also where the guest-facing "request a viewing" endpoint (the gap identified in §1/§4) needs a frontend UI designed and built** — this is new frontend work, not a mock-to-real swap, and should be scoped as its own mini-project inside this phase rather than assumed to fall out of the existing Appointments page.

**Exit criteria:** Appointments fully real (including the new request-a-viewing flow); Notifications, Analytics, Dashboard Home still mocked.

### Phase E — Notifications
Real `GET/PATCH /developers/me/notifications` + unread-count. Backend enqueue flow (BullMQ `notificationQueue`, per ARCHITECTURE.md §9) must already be wired to the Phase C/D mutations (listing publish/suspend, appointment status changes) that produce these notifications — this phase's frontend work is trivial (swap the service), but it's gated on backend work from two earlier phases actually emitting real notifications, not just exposing a read endpoint over an empty table.

**Exit criteria:** Notifications fully real, including the nav badge's 30s poll against a real count.

### Phase F — Dashboard Home + Analytics
Real composed `GET /developers/me/dashboard` and real `GET /developers/me/analytics?period=`. Deliberately last: both are aggregate-over-other-domains endpoints, so they're only meaningful once Phases C–E have real data flowing through them. This is also the natural point to revisit the `MOCK_TOTAL_PROPERTY_VIEWS`/per-property-views gap (`API_CONTRACT.md` §8–§9) if `PropertyAnalytics` real view-tracking is ready by then — as a scoped product conversation, not a silent addition.

**Exit criteria:** every domain in `services/index.ts` is real; `services/mocks/*` can be deleted entirely (or kept only for Storybook/test fixtures, if desired — a decision for that point, not now).

### Cross-cutting, throughout every phase
- Each phase ends with the **full existing Playwright + Vitest + accessibility suite** run against the newly-real domain, exactly as every mock-first phase in this project has been gated — a real backend changing timing/error shapes is exactly the kind of regression this suite exists to catch.
- Each phase's service-layer swap should be a **single PR per domain**, touching only that domain's `*.service.ts` (implementation swapped, exported shape unchanged) plus its own tests — never a mixed PR touching two domains' mocks at once, so a regression is always traceable to one phase.
- `TODO(backend)` markers are removed from the code in the same PR that resolves them, and §1's checklist above is updated to keep it as the living source of truth rather than letting it drift out of sync with the code.

---

## 8. What This Document Deliberately Does Not Cover

Per the scope of this planning phase: no mock implementation has been touched, no service file has been modified, and no backend code exists yet to validate any of §2's assumptions against. The next action is **not** starting Phase A — it's getting §2's assumption list in front of the backend team and getting explicit answers, since several later decisions (the CSRF posture in particular) depend on them.
