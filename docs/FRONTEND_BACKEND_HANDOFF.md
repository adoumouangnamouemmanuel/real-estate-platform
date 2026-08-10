# Frontend → Backend Integration Handoff

Status: frontend feature work frozen on `feature/claude-frontend` at commit `4d05f37`. This document is
the single entry point for backend integration. It does not implement anything — it maps every mock
seam to what is confirmed, flags what is not, and gives an integration order.

Source docs this builds on: `docs/API_CONTRACT.md`, `docs/BACKEND_INTEGRATION_ROADMAP.md`,
`docs/ARCHITECTURE.md`, `frontend/TODO.md`. Where this document and those disagree, those are the
detailed source of truth for a given domain; this document is the cross-cutting index and the place
unconfirmed assumptions and doc-vs-code contradictions are collected in one place.

---

## 1. Integration principles

- **No guessing.** Every endpoint, DTO field, cookie attribute, or status code that isn't confirmed by
  a real backend response is listed in §3 as an open question, not implemented speculatively.
- **Mock-first stays valid.** The mock service layer (`frontend/services/*.service.ts` +
  `frontend/services/mocks/*.mock.ts`) is not deleted or bypassed during integration. Each service is
  swapped in place, one domain at a time, behind its existing interface — components and hooks never
  talk to `fetch`/Axios directly, so a domain's integration is invisible to its consumers.
- **Hybrid mode must be honest.** A failed real API call must never silently fall back to fake data in
  production. See §8 (Rollback strategy) and the Hybrid Integration rule below.
- **One domain at a time, gated by the full quality gate.** No domain's integration begins until the
  previous one is merged and green (tsc, eslint, prettier, vitest, playwright, axe, build).
- **Contradictions get reported, not resolved here.** §3 is authoritative for what needs a backend
  engineer's sign-off before code changes.

---

## 2. Confirmed contracts

These are areas where the frontend implementation, `API_CONTRACT.md`, `ARCHITECTURE.md`, and
`BACKEND_INTEGRATION_ROADMAP.md` all agree, verified by direct code inspection (not assumed from
documentation alone):

- **Pagination envelope** — request `{page, pageSize}` → response `{items, total, page, pageSize,
  totalPages}`, identical across Properties (pageSize 12), Developers (12), My Properties (10),
  Appointments (10), Notifications (10). One documented, agreed exception: Dashboard Home's
  `getRecentListings/getNotifications/getActivity` return bare arrays with a `limit` param, not this
  envelope — all three docs agree this must change shape during integration, not stay as-is.
- **Media upload flow** — two-step signed upload: `POST /uploads/signature` → direct browser `POST` to
  Cloudinary → `DELETE /uploads/:publicId` server-side. Limits (10 images/listing, 10MB image / 50MB
  video, JPEG/PNG/WebP/MP4/MOV) agree across code and both integration docs.
- **Access token storage** — in-memory only, via the Zustand `authStore`, never `localStorage`.
- **Silent-refresh-and-retry on 401** — `lib/api.ts`'s interceptor already implements the documented
  flow (one retry after a fresh access token, `_retried` flag to prevent loops).
- **Two-layer authorization** — `proxy.ts` (coarse, cookie-presence gate only) + `RequireAuth`
  (client-side, role-aware) are explicitly UX-layer defense-in-depth; the real authorization boundary
  is backend ownership checks. All sources agree the backend re-enforces this independently.
- **Role model** — `USER < DEVELOPER < ADMIN`, checked with `>=` rank comparison.
- **Status transition rules** — listing (`DRAFT → ACTIVE → {RESERVED, SOLD, SUSPENDED}...`) and
  appointment (`REQUESTED → {CONFIRMED, CANCELLED}...`) state graphs match the documented contract
  exactly; both docs require server-side re-enforcement, not client trust.
- **Bulk operation shape** — `{updated: [], skipped: []}` / `{deleted: [], skipped: []}`, partial
  success, never all-or-nothing.
- **Polling-based notifications** — 30s `refetchInterval` on unread count, explicitly documented as
  the interim strategy pending a future WebSocket, with the exact extension point already identified
  (`queryClient.setQueryData` on `["notifications", "unread-count"]`).
- **Property search/filter contract** — `filterProperties`/`sortProperties` mirror the documented
  `plainto_tsquery` / `city ILIKE` / `price <=` / `ORDER BY rank DESC, created_at DESC` shape.
- **Password policy** — length-only (8–128 chars), no composition rules.
- **Anti-enumeration behavior** — generic "Invalid email or password" on login, unconditional 200 on
  password-reset request, but registration deliberately surfaces "email already exists."

---

## 3. Unconfirmed assumptions (must be verified against the real backend before writing integration code)

### Authentication
1. **Refresh cookie name** — frontend hardcodes `refresh_token` (`constants/config.ts`). Unconfirmed.
   If wrong, `proxy.ts`'s auth gate silently stops working with no error surfaced.
2. **Refresh cookie attributes** — target is `HttpOnly, Secure, SameSite=Strict` per `ARCHITECTURE.md`
   §6 and `API_CONTRACT.md` §1. Note: the current mock shim (`lib/mockSessionCookie.ts`) sets
   `SameSite=Lax` with no `HttpOnly`/`Secure`, because it's a browser-script placeholder standing in for
   what only a real backend response can set — this is not evidence toward the real value, just a
   reminder not to mistake the shim's behavior for the confirmed target.
3. **Refresh endpoint** path/method/response shape — documented as an assumption, not yet exercised
   against a real server.
4. **Login/register response shape** — assumed to match the general `{success, data, message}`
   envelope. Flagged directly in `API_CONTRACT.md`'s own Conventions section: only `refresh()` and the
   Axios interceptor's `refreshAccessToken()` actually exercise this envelope today; no other real
   endpoint exists yet to confirm it's universal.
5. **Logout behavior** — assumed to be a `POST` that clears the refresh cookie server-side. Unconfirmed
   request/response shape.
6. **Token expiration** — access/refresh token lifetimes are undocumented in code (the frontend never
   reads `exp` from a token — it treats the access token as fully opaque).
7. **JWT payload shape** (`{userId, role, developerId, iat, exp}`) — this is a backend-internal
   assumption; the frontend cannot verify it from its own code since it never decodes the access token.
   `developerId` scoping is read from the login/refresh response body, not from the JWT itself.
8. **User roles** — `USER | DEVELOPER | ADMIN` assumed exhaustive; unconfirmed there isn't a 4th role
   or a different casing/naming convention on the real backend.

### API envelopes
9. **Error envelope's `code` and `errors[]` fields** — documented shape exists
   (`{success:false, message, code?, errors?}`), but **zero frontend code currently reads `code` or
   `errors`** — `lib/errors.ts` only ever reads `.message`. A backend that returns rich field-level
   validation errors will have that data silently discarded until frontend work consumes it. This is a
   known gap, not a contradiction, but blocks any hope of field-level inline validation UX at launch.

### Pagination
10. Sorting parameter names/values beyond what's already implemented (`newest`, `price_asc`,
    `price_desc`) — unconfirmed whether the real backend uses these exact string values.

### Properties
11. **Property/PropertyDetail DTO gap** — `API_CONTRACT.md` §2's documented DTO omits `bedrooms`,
    `bathrooms`, `areaSqm`, and `favoriteCount` — all four are real fields the frontend types and
    actively renders (including driving the homepage's "popular" sort). These need to be added to the
    documented contract, not assumed present.
12. **"Featured" and "popular" homepage queries** — `app/(public)/page.tsx` needs a `featured` flag and
    effectively a `sort=popular`/`category=land`-style query; neither exists in `API_CONTRACT.md` §2's
    `GetPropertiesParams`. Currently worked around client-side at mock scale (a `pageSize: 100` fetch
    sorted in the browser) — not viable against a real, large dataset.
13. **Distinct-city list** — `constants/locations.ts` hardcodes 4 cities; no endpoint is documented for
    deriving this from live listings.

### Media
14. Cloudinary response fields `width`, `height`, `format` are dropped by `PropertyMedia`'s current
    shape (`{url, publicId, order}` only) — both docs already flag this as an open product decision,
    not a disagreement, but it needs a decision before Phase C.

### Appointments
15. Guest-facing "request a viewing" endpoint has no existing frontend model at all — acknowledged gap
    in both integration docs, needs design before Phase D.

### Security
16. **CSRF strategy** — explicitly undocumented in `ARCHITECTURE.md` itself (the roadmap and TODO.md
    both flag this as analysis that exists but was never ported into the living architecture doc).
    Given the target `SameSite=Strict` cookie, CSRF risk is reduced but not documented as a decision.

### Favorites (entire domain — undocumented)
17. `favorite.service.ts` references a `PropertyFavorite` entity already in `ARCHITECTURE.md`'s ER
    diagram, but **no endpoint for it appears in `API_CONTRACT.md`'s 9 domains or the roadmap's
    checklist/endpoint table.** Today it is 100% `localStorage`-backed. This needs its own contract
    (list/add/remove) before Phase C or F, whichever ships developer-visible favorite counts.

---

## 4. Endpoint mapping

Endpoint paths below are as currently referenced in code comments and `API_CONTRACT.md` — restated
here as a map, not re-specified. Where a path has no doc backing, it's marked accordingly.

| Domain | Mock service | Target endpoint(s) | Contract status |
|---|---|---|---|
| Auth | `auth.service.ts` | `POST /api/v1/auth/{login,register,logout,forgot-password,reset-password}` + token validation | Documented (§2), cookie/token details unconfirmed (§3.1–8) |
| Properties (public) | `property.service.ts` (no direct marker; fixture-level in `mocks/properties.mock.ts`) | `GET /api/v1/properties`, `GET /api/v1/properties/:slug` | Documented, DTO gap (§3.11) |
| Developers (public) | `developer.service.ts` | `GET /api/v1/developers`, `GET /api/v1/developers/:slug` | Documented |
| My Properties | `listing.service.ts` | `GET/PATCH/DELETE /api/v1/developers/me/listings` | Documented |
| Media | `upload.service.ts` | `POST /api/v1/uploads/signature`, `DELETE /api/v1/uploads/:publicId` | Documented |
| Appointments | `appointment.service.ts` | `GET/PATCH /api/v1/developers/me/appointments` | Documented; guest-request endpoint missing (§3.15) |
| Notifications | `notification.service.ts` | `GET/PATCH /api/v1/developers/me/notifications` | Documented |
| Analytics | `analytics.service.ts` | `GET /api/v1/developers/me/analytics?period=` | Documented |
| Dashboard Home | `dashboard.service.ts` | `GET /api/v1/dashboard/{summary,metrics,listings,appointments,notifications,activity}` | Documented, shape must change from bare arrays to paginated envelope |
| Telemetry | `lib/telemetry.ts` | `POST /api/v1/analytics/events` | Documented only in `ARCHITECTURE.md` §11 / roadmap, not `API_CONTRACT.md` |
| Favorites | `favorite.service.ts` | **none documented** | Undocumented (§3.17) |

---

## 5. Service-by-service integration plan

For every mock service: swap the implementation behind the existing exported interface. React Query
hooks (`hooks/use*.ts`) call the service object, not `fetch`/Axios, so hook signatures do not need to
change — only what's inside `services/*.service.ts`. `services/mocks/*.mock.ts` fixture files are left
in place as dev-mode fallback data (see §2, Hybrid mode).

Per service, the work is:
1. Confirm the real request/response shape against a live backend call (not documentation alone).
2. Replace the mock body with a real `apiClient` call, keeping the exported function signature.
3. Delete the artificial `delay()` calls used to simulate network latency.
4. Keep the `MOCK_*` fixture data and mock functions in the file (or move to a clearly-named
   `*.mock.ts` if not already split out) so `NEXT_PUBLIC_USE_MOCKS` (or equivalent dev flag) can still
   force mock mode locally without a backend running.
5. Add integration tests exercising the real HTTP boundary (see §13), without deleting the existing
   mock-based unit tests.

---

## 6. Authentication integration

This is Phase A (see §7) and must be the first real integration for the whole reasons stated in the
handoff brief: every other domain's calls are gated behind an access token attached by `lib/api.ts`'s
interceptor.

Before touching `auth.service.ts`, `lib/api.ts`, `store/authStore.ts`, or `proxy.ts`:
- Get the backend engineer to confirm every item in §3.1–8 against a running instance, not the docs
  alone (the docs themselves flag most of these as assumptions, not confirmed facts).
- Once confirmed, `mockSessionCookie.ts` becomes deletable (it exists solely so `proxy.ts`'s
  cookie-presence check passes without a real backend, per its own `TODO(backend)` comment).
- `proxy.ts`'s gate logic itself should not need to change shape — it already just checks for cookie
  *presence*, which is correct for a real `HttpOnly` cookie too (a proxy/middleware can read
  `HttpOnly` cookies server-side; only the browser is blocked from touching them via JS).

---

## 7. Error handling

- Frontend has one consumer of error responses (`lib/errors.ts`), reading only `.message` from the
  documented error envelope. `code` and `errors[]` are received-but-unused today (§3.9) — extending
  `lib/errors.ts` to surface field-level `errors[]` into form validation is real, scoped frontend work
  that should happen alongside whichever domain first returns them (most likely Auth's
  register/reset-password, or Property Editor's publish validation).
- No domain should be integrated with silent catch-and-ignore on network failure — every hook already
  surfaces `isError`/`error` from React Query; that pattern is preserved, not changed, during
  integration.

## 8. Loading states

No change required — every list/detail view already renders explicit loading skeletons driven by
React Query's `isLoading`, independent of whether the data source is mock or real.

## 9. Mutation invalidation

Existing `queryClient.invalidateQueries` keys per domain stay as-is; they invalidate by logical
resource key, not by mock-vs-real data source, so swapping the service body underneath does not
require touching invalidation logic.

## 10. Optimistic updates

None currently implemented anywhere in the app (confirmed absent, not overlooked) — out of scope for
this handoff; only add if a specific domain's real-backend latency makes it necessary, per the
Full Product Review's performance principle (no premature optimization).

## 11. File uploads

See §4 (Media) and §3.14. The two-step signed-upload flow is the agreed target; `uploadService`'s
current single fake round-trip needs to become `getUploadSignature()` (backend call) +
direct-to-Cloudinary `POST` (client call), per its own `TODO(backend)` comment.

## 12. Security considerations

- CORS: not yet documented anywhere (not found in any of the four source docs during this review) —
  needs explicit confirmation before Phase A, since the frontend and backend will very likely be on
  different origins in at least one deployment environment.
- CSRF: undocumented decision, see §3.16.
- Cookie policy: see §3.1–2.
- Authorization: backend must independently re-enforce ownership checks; frontend's `RequireAuth` and
  `proxy.ts` are UX-layer only, never the security boundary (already agreed across all docs — see §2).
- Rate limiting: not found documented anywhere in this review's source material — flag for the backend
  engineer, particularly for `POST /auth/login` and `POST /auth/forgot-password` (enumeration/brute
  force surface).

## 13. Testing strategy

- Existing mock-based unit/integration tests (484 passing) and Playwright E2E tests (83, one
  documented pre-existing parallel-worker flake in `appointments.spec.ts`, non-regressive) stay in
  place unchanged — they test frontend behavior against the mock contract, which remains valid
  dev-mode behavior per §2's Hybrid principle.
- Real API integration tests are additive, not replacements: a new test tier per domain that runs
  against a real (likely staging) backend, gated separately from the mock-based CI run so mock tests
  don't become flaky due to network conditions.
- Full quality gate (tsc, eslint, prettier, vitest, playwright, axe, build) must stay green after each
  domain's integration before moving to the next phase.

## 14. Rollback strategy

- Because each service's real implementation replaces the mock body behind an unchanged exported
  interface, rolling back a broken integration is reverting that one service file's git history — no
  hook, component, or query-key changes are entangled with the swap.
- Per the Hybrid Integration rule (§1, §8 of the brief): a failed real API call must surface as a
  visible error state (existing `isError` handling), never silently substitute mock data in production.
  Mock fallback should only be reachable via an explicit, developer-facing dev-mode flag — never as an
  automatic runtime behavior triggered by a failed request.
