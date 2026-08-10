# Product / Frontend / Backend Reconciliation

Status: inspection and documentation only. No code changed, no ER diagram changed, no API contract
changed, no backend implementation started. Produced by comparing the current frontend
(`feature/claude-frontend` @ `9dc3ab8`) against the ER diagram supplied by the backend team and the
four existing integration docs (`API_CONTRACT.md`, `BACKEND_INTEGRATION_ROADMAP.md`,
`ARCHITECTURE.md`, `FRONTEND_BACKEND_HANDOFF.md`) plus `TODO.md`.

---

## 1. Executive summary

The ER diagram is a real, useful, mostly-good-news delivery: it confirms almost every domain the
frontend already models (Properties, Developers with verification, Media, Favorites, Ratings,
Notifications, Reports, refresh tokens) and it **resolves a previously-documented gap** —
`API_CONTRACT.md` explicitly said no per-property view-count field existed anywhere in the data model
and that "Top Properties by Views" was deliberately excluded from Analytics as a result; the new ER's
`property.view_count`/`whatsapp_click_count`/`favorite_count` plus a full `property_analytics` daily
rollup table means that exclusion is no longer a hard limit — it's now a real product decision to make,
not a data blocker.

Against that good news, there is exactly one hard blocker and a handful of real, scoped gaps:

- **Confirmed blocker (as flagged in your brief): no Appointment entity anywhere in the ER.** Nothing
  else changes about this — it needs the backend team to design and add it before Phase D (Appointments)
  of the integration roadmap can start. Everything else in the ER is compatible with continuing toward
  Phase A/B integration in parallel.
- Amenities are currently a hardcoded, per-category string pool in the frontend; the ER's
  `feature`/`property_feature` model is real and relational — this needs a frontend rework (not a
  backend gap) before Property Editor integration.
- City/district are FK relationships (`city_id`, `district_id`) in the ER; the frontend currently
  treats city as a hardcoded string array and has no district concept at all — a scoped frontend gap.
- `region` (frontend) has no ER equivalent; `district` (ER) has no frontend equivalent. These are not
  the same field under different names — see §6.
- No admin-side entity distinguishes CLIENT vs. DEVELOPER vs. SUPER_ADMIN beyond `user.role: VARCHAR`
  (unconstrained) — role naming is a product decision to make explicitly, not something the ER forces
  either way.
- The Super Admin experience is close to entirely unbuilt on the frontend today: one `layout.tsx`, zero
  pages, three unrendered route constants, one disabled feature flag.

**Bottom line up front, expanded in §20: not yet — but the blocking item is narrow (Appointments), and
everything else can proceed in parallel.**

---

## 2. Meeting decisions (as given)

- Three product roles discussed: CLIENT, DEVELOPER, SUPER ADMIN (frontend currently: USER, DEVELOPER,
  ADMIN).
- Public Navbar should be persistently visible / sticky.
- Developer dashboard needs an obvious route back to the public Lumavok home.
- Developers should not have to log out to browse the public marketplace.
- Developer and super-admin experiences must be clearly separated (not the same shell/IA).
- Dashboard upload/create actions should read as production-grade, not prototype-like.
- Lumavok should feel like a premium, world-class platform (typography, motion, imagery, hierarchy).
- No frontend copy may promise more than the backend can actually deliver.

---

## 3. ER diagram assessment

Fourteen entities, transcribed in full in this document's source material. Entity-by-entity read:

| Entity | Supports | Does not support / notably absent |
|---|---|---|
| `user` | id, email, password_hash, role (free-text VARCHAR, no enum constraint visible), created_at | No `updated_at`/`deleted_at` on `user` itself (soft-delete lives only on `property_developer`) |
| `property_developer` | Full profile (business name, WhatsApp/phone, images, bio, experience, specialization, languages, address/city), `is_verified` + `verified_since`, `average_rating` + `total_ratings`, soft delete | **No suspension field** — no `status`/`is_suspended`/`suspended_at`. `city` here is a plain VARCHAR, not an FK to `city` (inconsistent with `property.city_id` being a real FK) |
| `property` | Full listing fields including `bedrooms`/`bathrooms`/`car_spaces`/`land_size_sq_m`/`building_size_sq_m`/`year_built`, `city_id`/`district_id` FKs, `status`, `view_count`/`whatsapp_click_count`/`favorite_count`, `published_at`, soft delete | **No `featured` boolean.** No `region` field (superseded by city/district). No `slug` uniqueness constraint visible (can't be determined from an ER diagram alone — a backend question, see §18) |
| `city` | id, name, `is_active`, created_at | No region/state grouping above city |
| `district` | id, `city_id` FK, name, `is_active`, created_at | — |
| `feature` | id, `feature_name`, `category`, `icon_name`, created_at — a real controlled-vocabulary table | — |
| `property_feature` | Pure `property_id`×`feature_id` join table | — |
| `property_media` | url, public_id, `media_type`, `is_primary`, `order`, `alt_text` | — |
| `property_favorite` | `user_id`×`property_id`, created_at | No `updated_at` (favoriting is a toggle, not an edit, so likely fine) |
| `property_developer_rating` | `rater_user_id`, `property_developer_id`, `score`, `comment`, `transaction_type`, created_at | No moderation/status field on individual ratings (a fake/abusive rating has no documented dispute path other than the generic `report` entity) |
| `notification` | **`property_developer_id` only** — type, title, message, `metadata` JSON, `is_read`/`read_at` | **No `user_id`.** This table cannot notify a CLIENT/guest — only developers get notifications in this schema |
| `property_analytics` | Daily rollup: `property_id`, `date`, `views`, `whatsapp_clicks`, `favorites` | No developer-level rollup (aggregation across a developer's properties must be computed, not stored) |
| `report` | Generic polymorphic: `reporter_user_id`, `target_type`, `target_id`, `reason`, `description`, `status`, `resolution_note` | `target_type`/`target_id` being a free-text polymorphic pair (not an FK) means the backend must validate `target_type` values and their existence itself — nothing in the schema enforces it |
| `refresh_token` | id, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `user_agent`, `ip_address`, created_at | Matches the documented refresh-token strategy in `ARCHITECTURE.md` §6 exactly |

**Confirmed absent, not assumed present anywhere:** Appointment/booking entity, guest-viewing-request
entity, `featured` flag, developer-suspension field, any CLIENT-facing notification path, any explicit
admin-action/audit-log entity beyond the generic `report`.

---

## 4. Frontend vs. backend mapping

See §5 (roles), §6 (property fields), §9 (appointments), §10 (notifications), §11 (favorites) for the
detailed domain-by-domain mapping. High-level directionality:

- **Backend ahead of frontend:** `property.view_count`/`whatsapp_click_count`/`favorite_count` and
  `property_analytics` (frontend has no per-property view tracking at all today — this was a
  deliberate, documented exclusion, now unblocked). `feature`/`property_feature` (frontend has no
  relational amenity model). `city`/`district` FKs (frontend has neither relationally). `refresh_token`
  (frontend already assumes this shape correctly).
- **Frontend ahead of backend:** Appointments (full domain, no ER support at all). Client-facing
  notifications (frontend's `NotificationType` union is entirely developer-facing already, so this is
  actually *aligned*, not ahead — see §10). `region` field (no ER equivalent — see §6).
- **Aligned:** Developer verification (`isVerified`/`is_verified`), developer rating display (frontend
  reads `Developer.rating`, ER has `average_rating`+`total_ratings` — a closer pair than the frontend
  type currently exposes, see §6), soft-delete-via-status pattern for properties, media ordering via a
  persisted field rather than array index, role-rank authorization model (frontend already comparable
  ranks, not equality checks).

---

## 5. Role / permission analysis

**Recommendation: do not change role names in code yet — but plan the migration now, because it is not
free.**

Frontend today: `UserRole = "USER" | "DEVELOPER" | "ADMIN"`, rank-checked (`ROLE_RANK: {USER:0,
DEVELOPER:1, ADMIN:2}`, `ADMIN` rank inherits `DEVELOPER` and `USER` capabilities) in
`RequireAuth.tsx`. ER's `user.role` is an unconstrained VARCHAR — it does not force either naming
convention, so this is purely a product/naming decision, not a technical one.

**Terminology mismatch is real, but shallow to fix if done once, deliberately:**
- `USER` → `CLIENT`: this is the highest-risk rename. `UserRole`, `ROLE_RANK`, every `role === "USER"`
  comparison, every test fixture, `authRedirect.ts`'s post-login routing, and any copy that says "user"
  in a role sense (not "user" meaning "person using the app" generically) would need updating in one
  pass — a rename done piecemeal risks a silent mismatch between a display string and a stored role
  value.
- `ADMIN` → `SUPER_ADMIN`: lower risk textually, but **higher risk architecturally**, because the
  rank-inheritance model (`ADMIN` implicitly has every `DEVELOPER` permission) may not be the intended
  semantics for a SUPER_ADMIN who moderates the platform but does not necessarily *own* developer
  listings the way a DEVELOPER does. This needs a product decision, not just a rename (see below).
- `DEVELOPER` stays `DEVELOPER` in both models — no change needed.

**Explicit analysis of the requested items:**

- **Developer self-registration**: `auth.service.ts`'s `register()` always creates role `USER`
  (confirmed in the prior handoff's research) — there is no self-service path to become a DEVELOPER
  today. If the product wants open developer self-registration, that's a new flow (a role-upgrade
  request or a distinct registration form), not a field rename.
- **Developer approval**: no concept exists in the frontend (no "pending developer" state) or in the ER
  (`property_developer` has `is_verified` but no `approval_status`/`pending` state distinct from
  verification). If "approval" and "verification" are meant to be two different gates (e.g., approved =
  allowed to publish at all; verified = has a trust badge), the ER does not currently support that
  distinction — one boolean (`is_verified`) covers both today. **This needs a backend/product decision**
  (§18).
- **Developer verification**: matches cleanly — `Developer.isVerified` (frontend) ↔
  `property_developer.is_verified` (ER), already correctly gated in the UI (Verified badge shown only
  when true, confirmed in the prior data-honesty review).
- **Developer suspension**: **no ER field supports this at the developer level.** `property.status` can
  represent a suspended *property*, but there's nothing on `property_developer` beyond `deleted_at`
  (a hard/soft delete, not a reversible suspension). A suspended-but-not-deleted developer state has no
  home in the current schema — flag for backend (§18).
- **Property suspension**: matches — `property.status` (ER) already includes room for a `SUSPENDED`
  value conceptually, and the frontend's `PropertyStatus` type already has `"SUSPENDED"` as a real
  status with its own transition rules (`STATUS_TRANSITIONS` in `listing.service.ts`).
- **Super-admin access to all properties**: no frontend UI exists for this at all today (§9). The ER's
  `property` table has no owner-independent visibility restriction built in — an "all properties" query
  is a straightforward `SELECT` with no ownership filter, so this is achievable once the endpoint and
  frontend page exist; not blocked by the schema.
- **Developer ownership of properties**: matches cleanly — `property.property_developer_id` is a direct
  FK, frontend's `RequireAuth`/`developerId`-scoping assumption already aligns (per
  `FRONTEND_BACKEND_HANDOFF.md` §3.7).
- **Client access**: the ER supports a CLIENT-equivalent `user` row (any `user` with role not
  DEVELOPER/ADMIN can favorite properties, rate developers, and report — all three have `user_id`/
  `rater_user_id`/`reporter_user_id` FKs). Nothing blocks a CLIENT role existing; it's a naming/rank
  decision, not a schema gap.
- **Admin access**: partially supported — `report.status`/`resolution_note` gives a moderation
  surface, but there's no `report` reviewer/assignee field, and (as above) no developer-suspension
  field for an admin to act on.
- **Role-based dashboard routing**: `authRedirect.ts` already routes DEVELOPER and ADMIN to the same
  dashboard destination today — per the meeting's explicit requirement that developer and super-admin
  experiences be clearly separated, this routing logic itself needs to change regardless of naming
  (§13, P1).

**Migration implication, stated plainly:** renaming roles is a small, mechanical, one-PR change to the
type and its ~10 call sites. The larger cost is deciding — before that PR — whether SUPER_ADMIN should
still rank-inherit every DEVELOPER permission, or whether admin and developer permissions need to
diverge (e.g., an admin who can suspend a developer but has no properties of their own to publish). That
decision changes `RequireAuth`'s authorization model, not just a string.

---

## 6. Property data-field matrix

| Frontend field | Backend (`property` table) field | Verdict |
|---|---|---|
| `title` | `title` | MATCH |
| `slug` | `slug` | MATCH (uniqueness enforcement unconfirmed — see §18) |
| `description` | `description` | MATCH |
| `category` | `category` | MATCH (enum values themselves not independently confirmed — VARCHAR on both sides) |
| `listingType` | `listing_type` | MATCH |
| `price` | `price` | MATCH |
| `address` | `address` | MATCH |
| `city` (free-text string, from a hardcoded `CITIES` array) | `city_id` (FK to `city` table) | PARTIAL MATCH — frontend needs to switch from a string value to selecting from a real `city` lookup and storing/sending `city_id` |
| `region` (free-text `<Input>`) | *(no equivalent)* | MISSING on backend / AMBIGUOUS — see note below |
| *(no equivalent)* | `district_id` (FK to `district` table) | MISSING on frontend — no district concept anywhere in the editor, schema, or `Property`/`PropertyDetail` types |
| `bedrooms` (type field, read-only display only — **no editor input**) | `bedrooms` | PARTIAL MATCH — type-level match, but the Property Editor form has no field for it at all today |
| `bathrooms` (same as above) | `bathrooms` | PARTIAL MATCH — same caveat |
| *(no equivalent anywhere)* | `car_spaces` | MISSING on frontend entirely — not in `Property` type, not in editor, not in `PropertyDetail` |
| `areaSqm` (single generic field, doc comment: "Floor/land area") | `land_size_sq_m` **and** `building_size_sq_m` (two distinct fields) | AMBIGUOUS — frontend's one field cannot losslessly map to the backend's two; needs a product decision on whether both are collected, or the frontend's single field maps to one specific one per category (e.g. `land_size_sq_m` for LAND, `building_size_sq_m` for HOUSE/APARTMENT/COMMERCIAL) |
| *(no equivalent anywhere)* | `year_built` | MISSING on frontend entirely |
| `status` | `status` | MATCH (values: frontend has `ACTIVE/RESERVED/SOLD/DRAFT/SUSPENDED`; backend enum values not independently confirmed — VARCHAR) |
| *(no equivalent — deliberately excluded per `API_CONTRACT.md` §9)* | `view_count` | MISSING on frontend, **now unblocked** by ER — see §1 |
| *(no equivalent)* | `whatsapp_click_count` | MISSING on frontend, now unblocked |
| `favoriteCount` (mock-seeded baseline + this-browser's own localStorage delta, explicitly documented as not a real aggregate) | `favorite_count` | PARTIAL MATCH — same concept, but frontend's version is browser-local and fake; backend's is presumably a real, server-truth aggregate. These are not interchangeable without a real Favorites integration (§11) |
| `media: PropertyMedia[]` — `{url, publicId, order}` only | `property_media` — `url, public_id, media_type, is_primary, order, alt_text` | PARTIAL MATCH — frontend's type is missing `media_type`, `is_primary` (uses `order === 0` as an inferred cover-image convention instead), and `alt_text` entirely |
| `amenities: string[]` (free strings from a hardcoded per-category pool) | `feature` + `property_feature` (relational, with `feature_name`/`category`/`icon_name`) | PARTIAL MATCH — same controlled-vocabulary *intent*, incompatible *implementation*; needs a frontend rework, not a rename (§8) |

**On `region` vs. `district` specifically:** these are not silently the same field. `region` today is
developer-typed free text with no relationship to `city`. `district` in the ER is a proper FK, scoped
under a specific `city_id`. Treating them as interchangeable and quietly renaming `region` to `district`
in the frontend would be wrong — `region` has historically carried Ghana-region-scale values (per the
homepage/search copy's "African markets"/city framing), while `district` is a finer-grained,
city-scoped subdivision. This needs an explicit backend/product answer, not a rename (§18).

---

## 7. Required/optional field matrix

Distinguishing draft-save vs. publish vs. category-conditional, based on the existing
`listingSchema`/`publishListingSchema` split in `lib/validation/listing.ts` plus the ER fields the
editor doesn't yet collect:

| Field | Category | Required on Draft | Required on Publish | Conditional | Input Type (recommended) | Backend Field |
|---|---|---|---|---|---|---|
| title | all | No | Yes | No | Text input | `title` |
| description | all | No | Yes | No | Textarea | `description` |
| category | all | Yes (drives conditional sections) | Yes | No | Select | `category` |
| listingType | all | No | Yes | No | Radio group (Sale/Rent) | `listing_type` |
| price | all | No | Yes | No | Numeric input | `price` |
| city | all | No | Yes | No | Combobox (real `city` lookup, not hardcoded array) | `city_id` |
| district | all | No | No (optional refinement) | No | Combobox, filtered by selected `city_id` | `district_id` |
| address | all | No | Yes | No | Text input (structured — see §5 recommendation) | `address` |
| bedrooms | House, Apartment | No | Yes | Yes — hidden for Land/Commercial | Numeric input | `bedrooms` |
| bathrooms | House, Apartment | No | Yes | Yes — hidden for Land/Commercial | Numeric input | `bathrooms` |
| car_spaces | House, Apartment, Commercial | No | No (optional) | Yes — hidden for Land | Numeric input | `car_spaces` |
| land_size_sq_m | Land (required), House/Commercial (optional) | No | Yes for Land | Yes | Numeric input | `land_size_sq_m` |
| building_size_sq_m | House, Apartment, Commercial | No | Yes | Yes — hidden for Land | Numeric input | `building_size_sq_m` |
| year_built | House, Apartment, Commercial | No | No (optional) | Yes — hidden for Land | Numeric input or Select of years | `year_built` |
| amenities | all (pool varies by category) | No | No (optional) | Yes — pool filtered by category | Multi-select checkboxes, sourced from `feature`/`property_feature` | `property_feature` join rows |
| media | all | No | Yes (min. 1 photo) | No | Existing MediaUploader | `property_media` |

**Not forced on developers unnecessarily:** `car_spaces` and `year_built` are recommended optional even
at publish time — neither is safety- or trust-critical the way a price or a photo is, and forcing them
would add friction for developers who genuinely don't know a year-built date for an older property.

---

## 8. Amenities architecture

**Current state:** `ListingAmenitiesSection.tsx` renders a checked-box list from `AMENITY_POOLS[category]`
— a hardcoded, in-code map from category to an array of amenity name strings, stored on the form as
`string[]`. This is already a controlled vocabulary in spirit (not freeform text entry), just not
backed by a relational table with stable ids.

**Target (per the ER):** `feature` is a real table (`feature_name`, `category`, `icon_name`), and
`property_feature` is a join table. This is strictly better than the current model — it gives features
stable ids (so a rename of "Swimming Pool" → "Pool" doesn't silently orphan every listing that has it),
a real icon association (`icon_name`, which the frontend's icon system — Lucide — can map to directly),
and a `category` field on the feature itself, which likely determines which categories of property a
feature is even offered for (matching the "amenity pool varies by property category" behavior the
frontend already has, just move that logic server-side).

**Recommended migration shape (not implementing yet, per your instruction):** replace `AMENITY_POOLS`
with a `GET /features?category=` (or `GET /features` filtered client-side once, cached) call, feeding
the same multi-select checkbox UI but storing `feature_id[]` instead of amenity-name strings. This is a
frontend-only change once the endpoint exists — no UX change required, since checkboxes-by-category is
already the right interaction pattern; only the data source underneath moves from a hardcoded map to a
real lookup.

---

## 9. Appointment gap

**Confirmed, per your explicit instruction: the ER diagram has no Appointment/booking entity anywhere.**
`ARCHITECTURE.md`'s own conceptual ER diagram (§5, lines 250-267) still shows `Appointment` as a
first-class entity descending from `Property` — meaning this is a **regression relative to what was
previously documented as the intended model**, not merely an original oversight. Worth surfacing to the
backend team directly: this entity was expected and is not present.

**Exact information the appointment workflow requires**, extracted directly from the frontend's
existing `Appointment` type and `appointmentService`'s behavior (so the backend team has a complete,
concrete spec to react to, not a vague "we need appointments"):

- A link to the property being viewed (`propertyId`) and, denormalized for display, its title —
  implying either a join the backend does per-request, or a stored denormalized title (frontend
  currently denormalizes; backend doesn't have to).
- A link to the developer who owns that property (implicit today — appointments are always viewed
  "scoped to whoever is logged into the dashboard," i.e., needs a `property_developer_id` FK, mirroring
  how `notification` is scoped).
- Who the appointment is with: today only `clientName` (free text) — **no client email/phone/contact
  field exists on the frontend model at all**, and contact happens outside the model entirely via
  WhatsApp (per ADR-006, "WhatsApp-first, no in-app messaging"). The backend needs to decide whether an
  appointment should optionally link to a real `user_id` (if the client was logged in when requesting)
  or remain guest-only free-text, or support both.
- `scheduledFor` — an ISO 8601 timestamp. **Timezone handling is unconfirmed** — flagged already in
  `API_CONTRACT.md` as needing to move server-side; still true, still unconfirmed.
- A status with six real states used today: `REQUESTED, CONFIRMED, RESCHEDULED, COMPLETED, CANCELLED,
  NO_SHOW` — plus a defined transition graph (`REQUESTED` → `CONFIRMED`/`CANCELLED` only;
  `CONFIRMED`/`RESCHEDULED` → `RESCHEDULED`/`COMPLETED`/`NO_SHOW`/`CANCELLED`; the last three are
  terminal). This transition graph is real, tested business logic (`AppointmentActionPolicy`) the
  backend needs to re-enforce server-side, not just accept as given from the client.
- `previousScheduledFor` — the prior time, retained specifically while status is `RESCHEDULED`, so the
  UI can show "moved from X to Y."
- A `history` audit trail — one entry appended on every status transition, each with a message and
  timestamp — needed for the existing "appointment history" drawer UI to keep working as-is.
- Conflict detection: **no such concept exists in the frontend today at all** — nothing prevents two
  appointments from being requested for overlapping times against the same developer. If this is
  wanted, it's new scope for both sides, not a mechanical port.

This is documentation of requirements, not a proposed schema — the backend team owns the actual table
design.

---

## 10. Notification gap

**Not a gap — already aligned.** The frontend's `notificationService` is explicitly and exclusively
developer-scoped (`GET/PATCH /api/v1/developers/me/notifications`, per its own doc comment), and the
`NotificationType` union is entirely made up of developer-facing dashboard events (appointment
lifecycle changes, listing published/suspended, draft reminders, generic system). The type comment
explicitly rules out a client/guest-facing "message"/enquiry notification type by design (ADR-006:
WhatsApp-first, no in-app messaging). The ER's `notification.property_developer_id`-only FK (no
`user_id`) matches this exactly — there is no CLIENT-facing notification need on either side today.

One real, smaller gap: the frontend `Notification` type has no explicit FK field at all (it's
implicitly "whoever is logged in"); the ER correctly has `property_developer_id` as a real column. This
is a trivial addition to the frontend type once the real endpoint exists, not a design gap.

---

## 11. Favorites assessment

Currently 100% `localStorage`-backed, anonymous, browser-scoped — not tied to `useAuthStore`/`User.id`
in any way, and explicitly documented as such in the service's own comment (which already correctly
anticipated the ER's `property_favorite` shape by name before this diagram existed). The ER's
`property_favorite.user_id` FK confirms the target shape: a real, account-scoped favorites list.

**Real product question raised by this comparison, not just a technical one:** the frontend's own
comment justifies the current anonymous/localStorage design by pointing at the homepage's "browse with
no account required" promise — saving a favorite today doesn't require login. The ER's schema, as
given, requires a `user_id` — there's no anonymous/session-based favoriting path in the table design.
**This needs an explicit product/backend answer** (§18): does favoriting require an account under the
real backend, or does the backend need an anonymous-session mechanism the ER doesn't currently show?

---

## 12. Similar-property recommendation model

**Current implementation** (`property.service.ts`, `getRelatedProperties`): filters `MOCK_PROPERTIES`
to items sharing the same `category` as the current property (excluding itself), takes the first 4 in
mock-array order. No ranking, no city/price/size weighting, no explanation copy anywhere in the UI (the
heading just says "Similar Properties" with no rationale).

**Proposed deterministic, explainable scoring model for MVP** (design only, not implemented):

Score each same-category candidate (category match is a hard filter, not a scored dimension — a
different-category property should never appear regardless of other similarity) on a fixed set of
weighted signals, each independently explainable:

| Signal | Match condition | Suggested weight | Explanation copy fragment |
|---|---|---|---|
| City | Same `city_id` | High | "in {city}" |
| District | Same `district_id` (only scored if city already matches) | Medium | "in the {district} area" |
| Listing type | Same `listing_type` (Sale/Rent) | High (near hard-filter — a Rent buyer rarely wants a Sale suggestion) | — (implicit, not usually stated) |
| Price proximity | Within ±20% of the source property's price | Medium | "within your price range" |
| Bedrooms | Exact match (House/Apartment only) | Low–Medium | "with the same number of bedrooms" |
| Land/building size | Within ±25% (category-appropriate field only) | Low | "a similar size" |

Total score = weighted sum of matched signals; take the top 4 by score, ties broken by most-recently
published. The explanation string is built directly from *which* signals actually matched for that
specific candidate (not a generic template) — e.g. "Similar because it's in Buea and within your
selected price range" only fires if city matched AND price proximity matched for that result; a
candidate that matched only on city says just "Similar because it's in Buea." This keeps the claim
literally true per-card, satisfying the data-honesty bar in §16 — never asserting a similarity dimension
that didn't actually match.

This is intentionally NOT a machine-learning recommendation system, per your instruction — a fixed,
auditable weight table any engineer can read and any user's "similar because" string can be traced back
to.

---

## 13. Navigation/shell findings

- **Public Navbar does not stick.** `Navbar.tsx` has no `sticky`/`fixed` class — it scrolls away with
  the page. This directly contradicts the meeting's "should remain visible while navigating" /
  "premium/sticky behavior" requirement. Confirmed via direct code read, not assumed.
- **No "Go to Dashboard" link in the authenticated public Navbar.** `NavbarAuthSection.tsx` shows only
  the user's name and a Log Out button when authenticated — a developer browsing the public site has no
  one-click way back into their dashboard from there.
- **No explicit "Back to public site" link in the dashboard shell**, beyond the app logo/name in
  `DashboardTopBar` linking to Home. There is no dedicated, obviously-labeled affordance the way the
  meeting's brief implies is wanted. (A "Back to My Properties" button exists, but that's internal to
  the dashboard's own Listing Editor — it doesn't leave the dashboard at all.)
- **No logout-required boundary exists today between public and dashboard** — confirmed: `proxy.ts`
  only gates `/dashboard/*` and `/admin/*`; every public route renders unconditionally regardless of
  auth state. This already satisfies "developers should not need to log out to access the public
  marketplace" — good news, no fix needed here, just confirmed as already correct.
- **`/admin` is reachable by role rank but not distinctly designed** — `RequireAuth role="ADMIN"` gates
  the one existing `layout.tsx`, but since ADMIN inherits DEVELOPER's rank in the current model, and
  since there is no page content at all under `/admin` today, this isn't yet a "duplicate navigation
  pattern" so much as an empty one. `TODO.md` itself already flags: `proxy.ts` only checks cookie
  presence, not role — meaning `/admin` is server-side reachable by any authenticated user regardless of
  role today, with only the client-side `RequireAuth` check as a (bypassable, JS-required) barrier. This
  is a real, pre-existing authorization gap independent of anything to do with backend integration —
  worth fixing regardless (§13/P1).
- **Dashboard "Add Property" entry points are already reasonably production-grade**, not
  prototype-looking: three consistent entry points (Quick Actions primary button, My Properties header
  button, the `/listings/new` page itself), all correctly gated by feature flag with a proper disabled
  "Soon" state rather than a broken link. No dead-end route found here. This softens the meeting's
  "dashboard upload/create actions must look production-grade" concern somewhat — the entry points
  themselves are fine; if the concern is really about the *editor form's* visual polish (long form,
  free-text-heavy amenities, no structured address), that's addressed by §5/§7/§8, not by the buttons
  that lead to it.
- **No broken transitions or dead-end routes found** elsewhere in this pass — this reuses findings
  already confirmed clean in the Full Product Experience Review; not re-litigated here.

---

## 14. Super Admin requirements

**What exists today: almost nothing.** One 14-line `layout.tsx` gating `role="ADMIN"`, zero `page.tsx`
files under `app/(admin)/`, zero admin-specific components, zero admin service, three route constants
(`ADMIN_DEVELOPERS`, `ADMIN_LISTINGS`, `ADMIN_REPORTS`) that currently point at nothing, and one
feature flag (`ADMIN_REPORTS`) that's off.

Per your instruction not to simply duplicate the developer dashboard, a distinct Super Admin IA should
be organized around **moderation and oversight**, not property-management — the ER strongly suggests
this shape already, since it gives an admin exactly these tools and no others:

- **All-properties view** — supported: `property` has no ownership-restricted query needed, a
  cross-developer listing table is a straightforward query once the endpoint exists.
- **Developer management** — supported for viewing (`property_developer` has everything needed for a
  directory/detail view); **not supported for suspension** (§5 — no field for it yet).
- **Developer approval** — not clearly supported; conflated with verification today (§5).
- **Property suspension** — supported (`property.status`).
- **Reports** — supported: the generic `report` entity (polymorphic `target_type`/`target_id`) is
  exactly the shape a moderation queue needs; a Super Admin Reports page reading `status="OPEN"` reports
  with a resolve/dismiss action mapping to `resolution_note` is a natural fit.
- **Platform-wide analytics** — partially supported: `property_analytics` gives per-property daily
  rollups that can be aggregated platform-wide; there's no separate platform-summary table, but nothing
  prevents computing one from the per-property rollups.
- **Moderation** — supported via `report`, not supported for developer-level action (suspension gap).
- **Role-based access** — the rank-inheritance question from §5 directly determines whether this IA can
  even be cleanly separate, since today ADMIN literally inherits every DEVELOPER capability by rank.

**Recommended distinct Super Admin IA (design-only, not building yet):** a dedicated shell (not reusing
`DashboardSidebar`'s developer-focused nav items) with sections for Developers (directory + verification
+ future suspension), Properties (all-properties table + suspend action), Reports (moderation queue),
and Platform Analytics (aggregate view) — four sections, not the developer dashboard's seven.

---

## 15. Premium UX findings

Scoped strictly to what's demonstrably a gap against the meeting's stated requirements, not a fresh
subjective redesign pass (the Full Product Experience Review already covered general premium-UX ground
and is not re-litigated here):

- Sticky public Navbar (§13) is the one concrete, checkable "premium" requirement from this meeting that
  the current implementation fails outright.
- The Property Editor's free-text-heavy fields (city as a loosely-styled select from a short hardcoded
  list, region as raw text, amenities as checkboxes with no icons even though `AMENITY_POOLS` values are
  just strings) will look meaningfully more polished once §8's icon-bearing `feature` model lands — the
  ER's `icon_name` column is a real, usable lever here (render each amenity checkbox with its actual
  Lucide icon instead of plain text), not decoration for its own sake.
- Where motion is genuinely warranted (not decorative) given the domains discussed: image gallery
  transitions (property detail), favorite-heart toggle (a brief scale/fill transition confirms the
  action landed), filter-chip add/remove, drawer/dialog open-close (already covered by the existing
  `prefers-reduced-motion` override, confirmed working in the Full Product Review), and upload progress
  (a real progress indicator during the two-step Cloudinary upload once that's wired for real, replacing
  today's single fake round-trip). None of this is new scope beyond what's already tracked; restating it
  here only because the meeting specifically asked for a motion audit as part of this pass.
- No "AI-looking" generic patterns found in this specific review's scope — this finding intersects with,
  not duplicates, the earlier Premium UX audit already delivered.

---

## 16. Data-honesty findings

- **Verification** — still honest: `Developer.isVerified` is a real boolean gating the badge, and the
  ER confirms `is_verified` is a real backend field, not something the frontend would need to fabricate.
  No issue.
- **WhatsApp** — still honest: gated behind `FEATURES.WHATSAPP_CONTACT` (off), rendering a "(coming
  soon)" disabled state everywhere it appears. No issue; already fixed in the prior Full Product Review.
- **Ratings** — a new, previously-latent risk surfaces here: `Developer.rating` is displayed today
  (card, profile, filter sort "Highest Rated") as a bare `X.X / 5` number with **no visible count of how
  many ratings back it** — the type has no `totalRatings` alongside `rating`. The ER's
  `property_developer_rating` table plus `property_developer.total_ratings` confirms ratings are meant
  to carry a count. Showing "4.8 / 5" with no indication of whether that's from 40 reviews or 1 is a
  data-honesty risk the moment this becomes real data (a single 5-star rating showing as an unqualified
  "5.0 / 5" reads as far more credible than it is). **Recommend adding a visible count once ratings go
  live** (e.g., "4.8 (12 ratings)"), not before — this is a P2, not urgent while ratings remain
  mock-seeded, but flagged now because it's exactly the kind of thing this reconciliation exists to
  catch before it ships silently.
- **Favorites** — flagged already in §11: `favoriteCount`/"Popular"/"Trending Now" all read from a
  mock-seeded baseline plus a browser-local delta, not a real aggregate. This was already correct to
  ship as-is in mock mode (nothing dishonest about a mock number in a mock-first app), but is now a
  named, explicit item to resolve as part of Favorites integration (§11), not something to leave
  ambiguous.
- **Analytics** — the previously-documented exclusion of view-count-driven claims (§1) means Analytics
  currently makes no view-count claims at all; nothing dishonest today. The moment `property_analytics`
  is integrated, whatever UI is built on top of it must earn any "most viewed"/"trending by views" style
  claim from that real table — not invented ahead of the backend actually delivering it.
- **Property availability** — no issue found; `PropertyStatus` already gates availability messaging
  correctly per prior reviews.
- **Recommendations** — currently no explanation copy exists at all for "Similar Properties" (§12) — not
  dishonest (it doesn't claim a reason it doesn't have), but also not yet meeting the "explainable"
  target the meeting asked for. Implementing §12's model with per-card explanation strings is what
  closes this, not a copy change alone.

**No frontend copy found anywhere in this pass promising functionality the backend cannot provide** —
the existing feature-flag/"(coming soon)" idiom continues to hold.

---

## 17. Backend readiness matrix

| Domain | Frontend implemented? | ER support? | API contract? | Backend gap? | Frontend change? | Backend change? | Blocking integration? |
|---|---|---|---|---|---|---|---|
| Authentication | Yes (mock) | Yes (`user`, `refresh_token`) | Yes, with unconfirmed assumptions | No | Minor (once assumptions confirmed) | Confirm assumptions only | No — proceed per Phase A |
| Public Properties | Yes | Yes, but city/district FK mismatch, no `featured` flag | Yes, same mismatches documented | Partial (featured flag, view-count exposure) | Yes — city/district rework | Decide on `featured` semantics | No — proceed, with §6/§8 rework tracked |
| Developers | Yes | Yes, fully | Yes | No | None required | None required | No |
| Favorites | Yes (mock-only, anonymous) | Yes, but requires `user_id` | Documented as undocumented gap in prior handoff | Yes — anonymous-favoriting question unresolved | Yes — full integration rework | Answer §11's anonymous-favorite question | No, but should resolve before shipping real favorites |
| Media | Yes | Yes, with 3 extra ER fields frontend type lacks | Yes | No | Yes — extend `PropertyMedia` type | None required | No |
| Property Editor | Yes | Partial — amenities/city/district/6 missing fields | Yes, documented DTO gap already known | Yes — amenities model, city/district, 6 missing fields | Yes — significant (§5–§8) | None required | **Should complete Phase 2 rework before this domain's real integration**, not strictly before Phase A/B |
| Appointments | Yes, full domain | **None** | Documented, flagged as needing backend design | **Yes — hard blocker** | None required yet | **Must design and add entity/endpoints** | **Yes — blocks Phase D only** |
| Notifications | Yes | Yes, aligned | Yes | No | Minor (add explicit FK field to type) | None required | No |
| Analytics | Yes (client-computed) | Yes, now with real per-property data | Yes, previously-known gap now resolvable | No — was a gap, ER resolves it | Product decision + rebuild once endpoint exists | Expose `property_analytics` aggregation endpoint | No — new opportunity, not a blocker |
| Reports | Not built (flag off) | Yes | Not detailed yet | No | Build the feature | Design report-creation/review endpoints | No — not started either side |
| Super Admin | Barely built (§14) | Mostly supported, suspension gap | Not detailed yet | Partial — developer-suspension field missing | Build the IA (§14) | Add developer-suspension field | No — not started either side |
| Recommendations | Yes (naive, category-only) | Yes — all needed fields present | Not detailed yet | No | Implement §12's scoring model | None required | No |

---

## 18. Backend questions requiring explicit answers

1. Is "developer approval" a distinct gate from "developer verification," or is `is_verified` meant to
   cover both? If distinct, what field represents approval?
2. What represents a suspended-but-not-deleted developer? `property_developer` currently has only
   `deleted_at`.
3. Does the real backend require a logged-in `user_id` to favorite a property, or does it need to
   support the frontend's current anonymous/no-account favoriting promise via a session mechanism the ER
   doesn't show?
4. Is `region` (frontend, Ghana-region-scale free text) meant to be replaced entirely by `district_id`,
   or do both concepts need to coexist at different granularities?
5. Does the frontend's single `areaSqm` field map to `land_size_sq_m`, `building_size_sq_m`, or does the
   Property Editor need to collect both explicitly per category?
6. What is the intended semantics of a `SUPER_ADMIN`/`ADMIN` role relative to `DEVELOPER` — full rank
   inheritance (current frontend model) or a distinct, non-overlapping permission set?
7. Is `slug` uniqueness enforced at the database level, and is it globally unique or unique per
   developer?
8. What are the valid `report.target_type` values, and is validity enforced server-side given it's a
   free-text field with no FK constraint in the ER?
9. Timezone handling for `property.published_at`, `property_analytics.date`, and (once it exists)
   appointment scheduling — stored as UTC with client-side conversion, or something else?
10. **Appointments**: the entire entity design — see §9's requirements list as the starting brief.

---

## 19. Prioritization

**P0 — blocks backend integration**
- None found that block Phase A (Authentication) or Phase B (Public Properties) specifically. The one
  true blocker (Appointments, §9) blocks only Phase D, and Phases A–C can proceed without it.

**P1 — must fix before backend integration (of the affected domain)**
- Appointment entity design (§9) — blocks Phase D only, not the whole roadmap.
- `proxy.ts` not checking role (only cookie presence) for `/admin` — a real, pre-existing authorization
  gap, unrelated to the ER but surfaced by this review's Super Admin pass (§13/§14).
- Role-based dashboard routing sending ADMIN and DEVELOPER to the same destination — contradicts the
  meeting's explicit "must be clearly separated" requirement (§5/§13).
- Answers to §18's questions 1, 2, 3, 4, 5, 6 — each blocks its respective domain's integration
  specifically (Super Admin, Favorites, Property Editor), not the whole plan.

**P2 — should fix before production**
- Amenities model migration to `feature`/`property_feature` (§8).
- City/district structured selection (§6/§7).
- Property Editor's six missing fields (`bedrooms`/`bathrooms` inputs, `car_spaces`, `year_built`) added
  to the form.
- `PropertyMedia` type extended with `media_type`/`is_primary`/`alt_text`.
- Rating count display once ratings go live (§16).
- Sticky public Navbar (§13/§15).
- Explicit "back to dashboard"/"back to site" navigation links (§13).
- Similar Properties scoring model + explanation copy (§12).

**P3 — future enhancement**
- Platform-wide analytics aggregation beyond per-property rollups.
- Appointment conflict detection.
- WebSocket-based real-time notifications (already an identified, deferred extension point).
- Developer rating submission UI (currently read-only display, no submission path exists on either
  side).

No aesthetic preference in this document has been classified above P2, per your instruction.

---

## 20. Final go/no-go assessment for backend integration

**Is Lumavok's current frontend/backend model sufficiently aligned to begin real API integration?**

**Yes, for Phases A–C of the existing roadmap (Authentication, Public Properties, Developer Property
Management) — proceed, with the P1/P2 items above tracked as parallel or immediately-following work,
not prerequisites that block starting.** The ER diagram confirms far more than it contradicts: auth,
refresh tokens, developer verification, media, ratings, reports, and now analytics are all
schema-supported and were already correctly anticipated by the frontend's mock-first architecture.

**No, not yet for Phase D (Appointments)** — this is the one genuine, confirmed blocker. The backend
team needs to design the entity before that phase can begin; §9 is a complete requirements brief for
that conversation.

**Phase F (Super Admin) is effectively not a "resume integration" question at all — it's closer to a net-new build on both sides**, since almost nothing exists on the frontend yet and two real schema
questions (developer approval vs. verification, developer suspension) need backend answers first.

**Recommended sequencing given all of the above:** do not treat this as "resolve everything, then
integrate." Start Phase A now — nothing in this reconciliation blocks it. Resolve §18's questions in
parallel, prioritized by which phase they gate. Treat Appointments' entity design as its own workstream
that can run alongside Phase A–C integration rather than in front of it, since nothing about Phases A–C
depends on it.
