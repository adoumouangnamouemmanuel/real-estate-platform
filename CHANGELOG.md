# Changelog

All notable changes to this repository will be documented in this file.

The format follows Keep a Changelog and the project uses a roadmap-driven delivery model.

## [Unreleased]

### Changed

- **Stage 6 — Product UX Remediation.** Closed nine gaps found by a live-browser
  product UX audit against the meeting decisions in
  `docs/PRODUCT_BACKEND_RECONCILIATION.md` §2. No backend, ER, API
  implementation, auth contract or mock-fixture changes; no new architecture —
  every fix reuses an existing service, primitive or rule.

  _Trust and data honesty:_

  - **The homepage no longer advertises a capability that is switched off.** It
    claimed "Direct WhatsApp contact — Message developers directly" as a
    standing fact while `FEATURES.WHATSAPP_CONTACT` was `false` and every real
    CTA on the site rendered a disabled "(coming soon)" button — a direct breach
    of the meeting's "no frontend copy may promise more than the backend can
    deliver." The copy now comes from `lib/contactTrustPoint.ts`, which reads
    the same flag those CTAs read; the flag-off wording describes what genuinely
    works today (developer emails published on their profiles) rather than a
    softened version of the WhatsApp promise. Flipping the flag restores the
    WhatsApp claim and activates the CTAs together, with no further change.
  - **Removed the fabricated "Total Property Views" KPI** from Dashboard Home.
    It was a hardcoded `MOCK_TOTAL_PROPERTY_VIEWS = 3742` — the only metric on
    the page not derived from data, and precisely the claim Analytics refuses to
    make for want of per-view data (ADR-016). `dashboardService.getMetrics` now
    omits the field entirely rather than substituting another number or a
    placeholder zero, `DashboardMetrics.totalPropertyViews` became optional with
    the reasoning recorded on the type, and `DashboardKpis` is typed against
    only the metrics that have a real source, so the tile cannot silently
    return. Three tiles instead of four.

  _Broken and missing journeys:_

  - **Property detail pages have a working contact path again.** The only
    contact control was the disabled WhatsApp button, so a live listing offered
    no way to reach anyone — while a real `mailto:` already existed on the
    developer's profile, two clicks away and unsignposted. `DeveloperInfoCard`
    now carries an explicit "Contact {developer}" action routed to
    `ROUTES.DEVELOPER_CONTACT` (`/developers/[slug]#contact`), and the profile's
    Contact block became a properly labelled `<section id="contact">` with
    scroll margin for the sticky navbar. No booking form, viewing request,
    phone number or WhatsApp affordance was invented — the Appointment entity
    still doesn't exist backend-side (§9).

    Building this surfaced a second, non-obvious bug: the anchor didn't
    actually scroll. `/developers/[slug]` has its own `loading.tsx`, so Next
    applies its `#hash` scroll while the loading boundary is mounted — measured
    on the built app, `#contact` only entered the DOM ~700ms later, and
    `scrollY` stayed `0`, leaving the visitor at the top of the profile rather
    than at the contact details. (The hard-load path was timing-dependent too:
    it scrolled correctly on an idle machine and failed under CPU load.) Fixed
    with `components/common/ScrollToHash.tsx`, rendered alongside the real
    content so the target is guaranteed to exist — it honours
    `prefers-reduced-motion` and moves focus as well as the viewport, which a
    hard load's native fragment navigation does for free but a client-side one
    does not. The E2E assertion was changed from `toBeVisible()` to
    `toBeInViewport()`: the former checks presence, not position, and passed
    straight over the broken anchor.

  - **Saved Properties (`/saved`) now exists.** Favourites could be saved from
    every card but never retrieved: no route, no link, nothing. The new page
    composes the existing `favoriteService` (which ids this browser has saved)
    with a new `propertyService.getPropertiesByIds`, renders through the
    existing `PropertyGrid`/`PropertyCard`, and removes a property through the
    very same optimistic `FavoriteButton` mutation that added it — one
    favourites system, not two. The page states plainly that saves live in this
    browser only, rather than implying an account-synced list the backend
    doesn't provide yet. Reachable from a new public nav entry.
  - **Draft listings no longer offer a "View listing" action that 404s.** A
    draft has no public page by design, so the action navigated straight to
    "Page not found" (reproduced in a browser during the audit). A new
    `isPubliclyVisible` rule in `listing.service.ts` — taken from
    `docs/API_CONTRACT.md` §3's own "only ACTIVE properties should ever appear
    here", and deliberately conservative on the `RESERVED` case that contract
    hedges on — is now the single source both the My Properties row menu, its
    mobile card equivalent, and Dashboard Home's Recent Listings read. A SOLD
    listing (terminal, undeletable, off the public site) renders no actions menu
    at all rather than an empty popup; its Edit action is unaffected. Status
    transitions, Publish, Delete and every other behaviour are untouched.

  _Discovery:_

  - **Added a Sale/Rent filter to the public marketplace**, which had none —
    buyers and renters browsed one interleaved list, and "Price: Low to High"
    surfaced six monthly rentals ahead of every sale listing because a rent and
    a sale price were being ordered as if they were the same unit. `listingType`
    now flows through the existing filter pipeline end to end (`PropertyFilters`
    → `parsePropertyFilters` → `filterProperties` → `FilterPanel` → filter
    chip), so it is URL-driven, survives refresh, and composes with the existing
    sorting and pagination. **No price normalization was invented** — the data
    model has no rental period to derive one from; instead, sorting a
    still-mixed list by price shows an inline note offering to narrow to one
    type.
  - **District is now visible publicly.** It was collected by the Property
    Editor and stored on `Property`, but rendered nowhere. A shared
    `lib/propertyLocation.ts` formats the location line for cards and the detail
    header (preferring the more specific "East Legon, Accra" over "Accra,
    Greater Accra" when a district exists) and stacks the full hierarchy on the
    detail page's Location section. Listings without a district — every fixture
    today, since mocks were deliberately not backfilled — render exactly as
    before.
  - **The public navbar shows which page you are on.** No link carried
    `aria-current` at any route. A minimal `NavbarLinks` client boundary adds it
    plus a weight-and-colour active state (not colour alone); `Navbar` itself
    stays a Server Component and its sticky/glass styling, auth section,
    Dashboard shortcut and logout are untouched.

  _Property Editor:_

  - **Region no longer blocks publishing.** It was a required, free-text field
    with no column in the backend model at all (§6 lists it MISSING/AMBIGUOUS,
    and §18 Q4 on region-vs-district is still open), so a developer could be
    gated on a value that could not be persisted. Region is now derived from the
    selected city via `CITY_REGIONS` in `constants/locations.ts` and displayed
    read-only, and was removed from `publishListingSchema`. The mapping is
    derived from — not invented for — existing data: all 46 mock
    property/listing records agree on it with no contradictions, and the city
    field is a closed select, so it is total for anything selectable. Records
    whose city predates that list keep their stored region rather than being
    blanked. **This does not resolve region-vs-district** — the two remain
    distinct concepts, nothing was renamed, and the backend question stays open
    in `TODO.md`.

  _Backend contract addendum proposed, not applied:_ public
  `GET /api/v1/properties` should accept `listingType` — the column exists
  (`property.listing_type`, §6 MATCH) and `GET /developers/me/listings` already
  filters on it; only the public params block in `docs/API_CONTRACT.md` §3 omits
  it. No backend or contract file was modified.

- **Feature Catalog Consistency Pass.** Eliminated the last duplicate
  amenity/feature source of truth: `services/mocks/properties.mock.ts` no
  longer imports the legacy `constants/amenities.ts` (`AMENITY_POOLS`) to
  seed fixture amenities — it now draws from the canonical feature catalog
  via a new `getFeatureNamesForCategory()` helper in `feature.service.ts`.
  `constants/amenities.ts` was deleted after confirming it was genuinely
  unused everywhere. While auditing the two taxonomies for parity, found and
  fixed a real data gap: the catalog's `24/7 Security` feature was missing
  `office` from its eligible categories, silently dropping a feature the
  legacy pool had offered office listings. `lib/similarProperties.ts` gained
  a new "shared features" signal (only counted once at least 2 features
  overlap, to avoid noise from one common amenity) — safe to add now that
  both sides of the comparison read from one shared catalog. Audited, left
  unchanged: `PropertyCard` still doesn't render amenities (a considered
  density decision) and the public Filter Panel still has no amenities
  filter (a real product/UI decision requiring its own scoped pass, tracked
  in `TODO.md`).

- **Pre-Integration Reconciliation (Phase 0.5).** Reconciled the frontend
  against the real backend ER diagram ahead of API integration. Replaced the
  hardcoded amenity string pool with a real feature catalog service
  (`services/feature.service.ts`, mirroring the ER's `feature`/
  `property_feature` tables) — the Property Editor's amenities section now
  renders multi-select chips with icons instead of plain checkboxes, and
  Property Detail reads the same catalog so an amenity's icon can never
  drift between the two. Added an additive `district` field (City → District
  cascading select) alongside the existing `region` field — not a rename,
  since the two aren't the same concept. Split the generic `areaSqm` measurement
  into category-aware `landSizeSqm`/`buildingSizeSqm` (old field kept as a
  deprecated fallback for existing records). Added a form section for six
  previously-modeled-but-uneditable fields (bedrooms, bathrooms, car spaces,
  year built, land size, building size), shown per-category — Land never
  shows bedroom/bathroom fields, House/Apartment never show land size.
  Replaced "Similar Properties"' naive category-only filter with a
  deterministic, explainable scoring model (`lib/similarProperties.ts`) that
  states exactly why each result was suggested (e.g. "Similar because it's in
  Accra and within your price range"). Made the public property filter's
  bedrooms select category-aware (hidden for Land/Commercial/Office). Made
  the public Navbar sticky and premium-styled, and added a one-click
  Dashboard link for authenticated developers browsing the public site — no
  logout required. Added a display-only product-role label mapping
  (Client/Developer/Super Admin) without renaming the underlying
  USER/DEVELOPER/ADMIN role model, since that rename has real, unresolved
  authorization-semantics implications. Added explicit regression tests
  proving the Super Admin route guard blocks an unauthenticated visitor and
  an authenticated Developer, admitting only Admin. Documented (but did not
  build) a Super Admin information architecture, distinct from the Developer
  Dashboard's own nav. See `docs/PRODUCT_BACKEND_RECONCILIATION.md` for the
  full audit and `docs/ARCHITECTURE.md`'s ADR-017 for the decision record.

- **My Properties Polish.** Added a real property thumbnail (existing demo
  imagery, `next/image`) to each row in the listings table. Promoted Edit
  to a direct, always-visible icon button per row instead of requiring the
  "…" menu to be opened first — View, status transitions, and Delete remain
  in that menu, with Delete still visually separated and destructive-styled.
  Replaced the single-bar loading skeleton with row-shaped skeletons that
  mirror the real table's columns. Fixed a real accessibility gap found via
  live DOM inspection: `<th>` elements had no `scope="col"` — fixed at the
  shared `TableHead` primitive so every table in the app benefits, not just
  this one. Added a subtle fade/slide-in to the bulk actions bar's
  appearance (respects `prefers-reduced-motion` via the existing global
  override).

- **Dashboard Home Transformation.** Reordered the developer dashboard's
  landing page around Understand → Manage → Act: a new `DashboardActionNeeded`
  section (new appointment requests, overdue requests, stale drafts,
  suspended listings — computed by `lib/dashboardActionNeeded.ts`, reusing
  Analytics' own `isOverdueAppointment`/`isStaleDraft` predicates and
  severity thresholds so the two surfaces can't define "overdue"/"stale"
  differently) now renders directly under the welcome header, above the KPI
  grid. `AnalyticsActionNeeded` was promoted into a shared
  `components/dashboard/ActionNeededList.tsx` rather than duplicated.
  `DashboardKpis` trimmed from six tiles to four (dropped the two
  time-sensitive counts now owned by Action Needed); `DashboardWelcome` no
  longer duplicates them in its own summary sentence. `QuickActions` is now a
  compact inline button row instead of a tall, mostly-empty card.
  `RecentListings` rows show a real property thumbnail. Also fixed two
  pre-existing bugs found via the audit's actual screenshots: the shared
  `Tabs` primitive's `data-horizontal`/`data-vertical` Tailwind variants
  targeted the wrong attribute name (`data-orientation` sets the value, not
  the attribute name), so `AppointmentOverview`'s tabs rendered as a row
  instead of stacking; and `--sidebar-primary`/`--sidebar-ring` were never
  updated when the brand teal was introduced, leaving the dashboard shell's
  active nav state on the old grayscale default.

- **Premium Public Experience Transformation + Review.** Redesigned the
  homepage (immersive hero, category explorer, Featured/Trending/Land
  sections, a restrained trust section), `PropertyCard` (real demo imagery,
  bed/bath/area stats, a favorite/save action, a "Popular" signal grounded in
  a new mock `favoriteCount`), and the property detail page (sticky contact
  panel, favorite + native-share actions, a crossfading gallery). Added a new
  `favoriteService` (mock, `localStorage`-backed, documented
  `TODO(backend)` seam) and `useFavorites` hook. Introduced one deliberate
  brand hue (a deep ink-teal `--primary`) replacing the unstyled grayscale
  shadcn default. A follow-up self-review (using real screenshots, not just
  source inspection) then found and fixed: a scroll-reveal animation that
  left property cards genuinely invisible for up to ~900ms after scrolling
  (removed entirely); three category images that visually misrepresented
  their property type after actually opening and inspecting each one (a
  residential house/interior/villa labeled "commercial," a heritage palace
  labeled "land," a retail store labeled "office"); a false "Verified
  developers only" hero claim contradicted by the mock data (one of three
  mock developers is unverified); a Share/Favorite button size mismatch on
  the detail page; and an unbranded "Log in" navbar link.

- **Rebrand: ByTe → Lumavok (frontend, user-facing only).** Every visible
  occurrence of the app name — Navbar, Footer, dashboard top bar, browser
  titles, metadata descriptions, auth page copy, WhatsApp deep-link message
  templates, a mock notification body, and the README introduction — now
  reads "Lumavok". `constants/config.ts`'s `APP_NAME` was already the single
  source of truth for the one component that used it (`AuthCard`); every
  other hardcoded literal was migrated to import and interpolate `APP_NAME`
  instead, so a future rebrand is a one-line constant change. No repository,
  folder, package name, import path, variable, service, API route, or other
  internal technical identifier was renamed (e.g. `byte.africa` test-account
  emails and the Cloudinary `byte-demo`/`byte/listings/...` mock identifiers
  are unchanged, as are `docs/ByTe_RealEstate_Roadmap.md`'s actual filename).

- **Backend Integration Planning.** Added `docs/API_CONTRACT.md` (a full
  per-service endpoint/DTO contract — current mock methods, future REST
  endpoints, request/response shapes, pagination/filter/sort models, error
  responses, and auth requirements for all 8 domains — meant to hand directly
  to backend engineers) and `docs/BACKEND_INTEGRATION_ROADMAP.md` (every
  `TODO(backend)` marker consolidated into one checklist, assumptions
  requiring backend-team validation, a recommended first-wave endpoint order,
  MVP/pre-production/nice-to-have classification for all 39 endpoints, an
  authentication-flow and file-upload review, and a 6-phase roadmap for
  migrating from mocks to real APIs one domain at a time). No mock
  implementation was changed — this is planning only, pending approval.

- **Frontend: Platform Readiness Review.** A no-new-features audit of the full
  8-domain dashboard platform against backend-integration readiness. Fixed:
  `app/providers.tsx`'s `QueryClient` now has an explicit `retry`/`staleTime`
  policy (stops retrying 4xx responses once requests hit a real backend,
  instead of blindly retrying every failure 3 times); `next.config.ts` gained
  baseline security headers (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`); query-key consistency fixed in
  `useProperties`/`useDevelopers`/`useListingEditor` (exported key constants
  instead of ad hoc string literals that could drift from each other); and a
  state-drift bug fixed in `AppointmentsView`/`NotificationsView`, where the
  details drawer and reschedule dialog held an object snapshot from click
  time instead of deriving it from the live query by id, so an open panel
  could keep showing stale data after a concurrent refetch. See `TODO.md` for
  the full findings list and everything deliberately deferred as Medium/Low.

### Added

- **Frontend: Analytics (Phase 6.7).** A cross-domain read model at
  `/analytics` over the appointments and listings domains — `analytics.service.ts`
  composes the existing `listingService`/`appointmentService` rather than
  owning its own dataset, then hands the results to a new pure calculation
  module, `lib/analyticsCalculations.ts`, kept fully independent of the
  service and presentation layers. `isOverdueAppointment` was extracted into
  a shared predicate (`lib/appointmentActionPolicy.ts`) so Appointments'
  "overdue" filter and Analytics' Action Needed can't define the rule
  differently. Action Needed and Insights are first-class: an above-the-fold
  section flags overdue appointment requests, stale drafts, and a high
  cancellation rate (gated on a minimum sample size), each linking directly
  into the filtered view that explains it. Current-state metrics (portfolio
  composition, Action Needed) are kept structurally distinct from
  period-scoped metrics (the appointment funnel and its response/completion/
  cancellation/no-show rates, cohorted by request date). Every stat besides
  the appointment funnel is a reused `StatCard`/`Sparkline` or a plain table —
  the funnel is the one real chart, and it ships a toggle to an equivalent,
  fully visible table with identical data rather than a screen-reader-only
  summary. New `SwipeableStatRow` primitive brings the first horizontally-
  swipeable (scroll-snap) mobile pattern to the dashboard. Flips
  `FEATURES.DEVELOPER_ANALYTICS`. See ADR-016 in `docs/ARCHITECTURE.md`. ~30
  new unit tests, 5 new E2E tests, 1 new page added to the accessibility scan
  (zero violations).

- **Frontend: Notification System (Phase 6.6).** A shared notification
  platform, not just a page: `notificationService` is the one seam the new
  `/notifications` inbox, the Dashboard Home preview widget, and a new nav
  unread badge all read/write through. `NotificationType` widened from Phase
  6.1's 4 coarse categories to a granular 10-value union (appointment
  requested/confirmed/cancelled/rescheduled/completed/no-show, listing
  published/suspended, draft reminder, system) — the old `MESSAGE` type (an
  in-app "enquiry" notification ADR-006 already rules out) is gone. A
  `NotificationCategory` derived from type (never stored) drives filtering.
  Lifecycle modeled as `status: "UNREAD" | "READ" | "ARCHIVED"` rather than a
  boolean — `ARCHIVED` is fully designed in but has no UI yet, per spec. Card
  list, not a table, matching the pattern the Dashboard Home widget already
  set for this data shape. Filtering, pagination, a details drawer, mark
  one/mark all as read, and a 30s-polling unread count (matching the cadence
  ARCHITECTURE.md §9 already documented) that doubles as the identified
  real-time extension point. Nav badge on the sidebar item and an aggregate
  dot on the mobile "More" tab; no top-bar bell — the Dashboard Home widget
  already covers the "quick glance" need. Flips
  `FEATURES.DASHBOARD_NOTIFICATIONS`. See ADR-015 in `docs/ARCHITECTURE.md`.
  ~45 new unit/integration tests, 8 new E2E tests, 1 new page added to the
  accessibility scan (zero violations).

- **Frontend: Product UX Review (Phase 6.5).** A no-new-features review of the
  full authenticated experience (login → Dashboard Home → My Properties →
  Property Editor → Appointments) now that those four modules form the
  complete daily workflow. New `SkipToContentLink`
  (`components/common/SkipToContentLink.tsx`), wired into `DashboardShell` —
  every dashboard page previously required a keyboard user to tab through the
  top bar and full sidebar/mobile nav before reaching page content (WCAG
  2.4.1, Bypass Blocks), a gap automated axe scans don't reliably catch.
  Remaining findings (Quick Actions/nav terminology drift, a shared badge tone
  between two appointment statuses, breadcrumb scope, bundle-size visibility,
  reduced-motion support) are Medium/Low and documented in `TODO.md` for
  future iteration rather than implemented in this pass.

- **Frontend: Appointments (Phase 6.4).** The developer's appointment book at
  `/appointments` — full lifecycle management, not just a list. Status graph
  extended to six states (`REQUESTED` → `CONFIRMED`/`RESCHEDULED` →
  `COMPLETED`/`CANCELLED`/`NO_SHOW`), with a new `AppointmentActionPolicy`
  (`lib/appointmentActionPolicy.ts`) centralizing which actions are valid from
  each status — read by the row action menu, the bulk actions toolbar, the
  details drawer, and the service's own transition validation, so a rule
  change can't drift between surfaces. Bulk actions are deliberately narrower
  than per-row actions (Confirm/Cancel only — Reschedule needs a per-row date
  input, Complete/No-Show are single-visit outcomes). Filtering, searching,
  sorting, pagination, date-grouped rows, a status-count summary doubling as
  a one-click filter, a details drawer reusing the existing `ActivityTimeline`
  for per-appointment history, and a reschedule dialog. New `appointmentService`
  (mock-backed, its own dataset — distinct from Phase 6.1's Dashboard Home
  widget data) and `hooks/useAppointments.ts`. Appointment lifecycle events
  are emitted through a new no-op telemetry seam (`lib/telemetry.ts`) for
  future analytics wiring. Flips `FEATURES.DASHBOARD_APPOINTMENTS`, lighting
  up the sidebar/mobile nav link and Dashboard Home's "View all" action. See
  ADR-014 in `docs/ARCHITECTURE.md`. ~70 new unit/integration tests, 9 new E2E
  tests, 1 new page added to the accessibility scan (zero violations).

- **Frontend: Property Editor (Phase 6.3).** Create (`/listings/new`) and edit
  (`/listings/[slug]/edit`) share one `ListingForm`. Autosave-as-draft while
  `status === "DRAFT"` (debounced, PATCHes only the fields that actually
  changed); an explicit "Save changes" action once published. `MediaUploader`
  runs an explicit upload state machine (QUEUED → UPLOADING →
  UPLOADED/FAILED, with retry) and persists an explicit per-photo `order`
  field rather than relying on array position, so the cover image can't get
  scrambled by an async upload queue finishing out of order. One
  `listingSchema` with a stricter `publishListingSchema` extending it for the
  "ready to publish" profile. `useNavigationGuard` — generic, reusable by any
  future dashboard form — plus a `NavigationGuardDialog` warn before losing
  unsaved work. A lightweight `ListingEditorProvider` holds cross-cutting
  editor metadata (identity, autosave status, publish-in-flight) while React
  Hook Form remains the sole source of truth for field values. Flips
  `FEATURES.DASHBOARD_PROPERTY_EDITOR`. See ADR-013 in `docs/ARCHITECTURE.md`.
  ~40 new unit/integration tests, 10 new E2E tests, 1 new page added to the
  accessibility scan (zero violations).

- **Frontend: My Properties (Phase 6.2).** Listing management for the
  developer's own portfolio — search, filter, sort, pagination, status changes,
  and delete; the create/edit form is deliberately out of scope for this phase
  and ships separately. `/listings` gives a status-aware action menu per row
  (only the transitions valid for that listing's current status are offered,
  plus Delete only when the status allows it — DRAFT and SUSPENDED are the only
  deletable statuses, since anything with a real transaction history must be
  suspended first), bulk select-and-act (Publish/Suspend/Delete, applying only
  to whichever selected rows are actually eligible and reporting what it
  skipped), a status-count summary doubling as a one-click filter, and a
  selectable page size (10/25/50) for large portfolios. New `listingService`
  (mock-backed, distinct from the public `propertyService` catalogue) and
  `hooks/useListings.ts` — the first real consumer of the `sonner` toast
  infrastructure built in Phase 6.0. Splits the Phase 6.0 `DASHBOARD_PROPERTIES`
  flag: it now gates the (shipped) listing page and nav item, while a new
  `DASHBOARD_PROPERTY_EDITOR` flag keeps Add/Edit disabled with a "Soon" control
  until the editor phase. See ADR-012 in `docs/ARCHITECTURE.md`. ~50 new unit/
  integration tests, 9 new E2E tests, 1 new page added to the accessibility scan
  (zero violations).
- **Frontend: Developer Dashboard Home (Phase 6.1).** The developer's post-login
  overview, built on the Phase 6.0 shell (not a redesign of it): a welcome header
  (time-of-day greeting, company, current date, and a one-line pending-work
  summary), six KPI tiles on the existing `StatCard`, Recent Listings (status
  badges, last-updated, per-row actions), an Appointment Overview with
  upcoming/requested/completed tabs, a Notifications preview with unread/read/empty
  states, a Quick Actions panel, and a reusable Activity Timeline. Introduces three
  reusable dashboard primitives — `DashboardSection` (titled `<h2>` card),
  `StatusBadge` (`PropertyStatusBadge`/`AppointmentStatusBadge`), and
  `ActivityTimeline` — plus a new mock-backed `dashboardService` and per-widget
  React Query hooks (`hooks/useDashboard.ts`); no component calls Axios or a mock
  directly. The page is a Server Component composing Client widgets that each own
  their loading/empty/error state. Every destination the page links to that hasn't
  shipped yet (Add Property, View Listings, Edit Company Profile) reuses the shell's
  feature-flag idiom, rendering as a disabled "Soon" control rather than a broken
  link. Adds six date/number formatters. See ADR-011 in `docs/ARCHITECTURE.md`.
  ~30 new unit/integration tests and 3 new E2E tests; the dashboard accessibility
  scan now covers the full overview (zero violations). Note: the roadmap's earlier
  "Phase 6.1 = My Properties" is renumbered to 6.2 — Dashboard Home is 6.1.
- **Frontend: Developer Dashboard shell (Phase 6.0).** `DashboardShell` with a
  persistent desktop sidebar (icon rail from `md`, full labels from `lg`) and a
  mobile bottom tab bar with a "More" sheet, driven by one shared nav config
  (`components/dashboard/dashboard-nav.ts`) so the two can't drift; a TopBar
  with an account menu (name, role, "View public site", log out); shared
  primitives every later dashboard module will reuse — `Card`, `Table`,
  `Tabs`, `Dialog`, `Drawer`, `DropdownMenu`, `sonner` toast infrastructure, a
  hand-rolled `Sparkline`, `StatCard`, `Breadcrumbs` — scaffolded via the
  shadcn CLI already configured in this repo (same provenance as
  `Button`/`Checkbox`/`Badge`). Every destination beyond Dashboard Home is
  gated by its own feature flag and renders disabled with a "Soon" badge
  until its phase ships, matching the existing `FEATURES.WHATSAPP_CONTACT`
  idiom. `FormField` promoted from `components/auth/` to `components/ui/` for
  reuse across dashboard forms. See ADR-010 in `docs/ARCHITECTURE.md`. 27
  new unit/integration tests, 4 new E2E tests, 1 new page added to the
  accessibility scan (zero violations).
- **Frontend: Authentication domain.** Login, registration, forgot-password,
  and reset-password pages with React Hook Form + Zod validation, password
  visibility toggle, and loading/error/success states; session bootstrap and
  redirect-after-login; protected routes for `(dashboard)`/`(admin)` enforced
  by both `proxy.ts` (server) and `RequireAuth` (client) with role-hierarchy
  checks (`USER < DEVELOPER < ADMIN`); logout; `/unauthorized` and
  `/forbidden` pages. Built against `services/mocks/auth.mock.ts`, per
  ADR-009 in `docs/ARCHITECTURE.md`. Security posture: a single generic
  "Invalid email or password." login error (no user enumeration), a
  password-reset flow that always resolves successfully regardless of
  whether the email matches an account, an open-redirect guard on the
  `?redirect=` query param (`lib/authRedirect.ts`), and a length-only
  password policy per current NIST/OWASP guidance. ~64 new unit/integration
  tests and 12 new E2E tests; 7 auth pages added to the accessibility scan
  (zero violations).
- **Frontend: testing infrastructure.** Vitest + React Testing Library for unit
  and integration tests, Playwright + axe-core for E2E and automated
  accessibility scanning (see ADR-008 in `docs/ARCHITECTURE.md`). 67 unit/
  integration tests, 70 E2E tests across 5 browser/viewport projects. CI now
  runs typecheck, lint, format check, tests with coverage, build, and a
  Chromium E2E pass on every PR.
- **Frontend: Developer domain.** Developer listing (`/developers`) with search,
  city filter, sorting, pagination, and card/loading/empty/error states; developer
  profile pages (`/developers/[slug]`) with cover image, logo, bio, contact info,
  social links, stats, active listings, featured properties, and a map placeholder
  behind `FEATURES.MAP_VIEW`. Property detail pages link into developer profiles
  (`components/property/DeveloperInfoCard` → `/developers/[slug]`), completing the
  Property ↔ Developer navigation loop.
- **Frontend: Properties domain.** Property listing (`/properties`), detail pages
  (`/properties/[slug]`), and search/filtering (`/search`) — grid, gallery,
  amenities, location, developer contact card, WhatsApp CTA (behind
  `FEATURES.WHATSAPP_CONTACT`), related properties, and URL-driven filters
  (category, city, price range, sort, keyword).
- **Frontend: architecture foundation.** App Router shell, design tokens, shared
  services/React Query data layer, auth session bootstrap + route protection,
  and the shared error/loading/empty-state pattern used across both domains.
- Initial repository documentation scaffold.
- GitHub governance files, issue templates, and workflow placeholders.

### Fixed

- `notificationService.markAsRead` called a helper that throws synchronously
  on an unknown id from a plain arrow function typed to return a `Promise` —
  so an unknown id threw immediately at call time instead of yielding a
  rejected promise, breaking any caller awaiting `.rejects`. Caught by the
  method's own unit test; fixed by making it `async`. The identical pattern
  was found in `appointmentService.updateStatus`/`reschedule` and
  `listingService.updateListingStatus`/`deleteListing` during a cross-domain
  consistency pass and fixed the same way, with matching regression tests —
  "operate on an unknown id" now behaves consistently across all three
  service-layer domains.
- My Properties' "Edit listing" row action was a disabled placeholder with no
  `href` wired at all — built in Phase 6.2 before the editor existed, and
  never revisited when Phase 6.3 flipped the flag that would make it live.
  Caught by the first E2E run against the real flag flip. Fixed with the same
  `render={<Link .../>}` pattern already used by the equivalent Recent
  Listings action.
- A brand-new draft's first autosave used to update the address bar via
  `router.replace()` to its real edit URL — a genuine Next.js navigation
  between two different leaf routes (`/listings/new` and
  `/listings/[slug]/edit`), which unmounts and remounts the whole page,
  discarding anything typed afterward and orphaning Publish's own follow-up
  status update. Fixed by using `window.history.replaceState` directly for
  that URL sync, which never invokes Next's router.
- A field cleared of its "dirty" state by autosave or an explicit save could
  stay dirty forever afterward, permanently and incorrectly triggering the
  unsaved-changes navigation guard. `form.reset(undefined, { keepValues: true
})` never updates React Hook Form's internal dirty-comparison baseline;
  fixed by passing a freshly-read `form.getValues()` (not a pre-await
  snapshot) as the reset baseline.
- The dashboard was unreachable in any real browser session — even
  immediately after a successful login — because `proxy.ts` re-runs on the
  client-side navigation fetch behind every route change, not just full page
  loads, and mock login never set the cookie it checks for. Discovered while
  building the Phase 6.0 shell, since Phase 5 had no dashboard content to
  expose it. Fixed with `lib/mockSessionCookie.ts`, a mock-only marker cookie
  set on login/register and cleared on logout (see ADR-010).
- Registration and reset-password forms could silently hide a "Passwords
  don't match." error behind an unrelated field error (e.g. an unchecked
  terms checkbox) until a second submit — caught by the E2E suite. Root
  cause: Zod's `.refine()`/`.check()` on an object schema only runs after
  every other field validates. Fixed with `withPasswordMatchResolver`, a
  resolver wrapper that checks the match independently and merges it into
  whatever else failed, so every problem in a submission surfaces at once.
- Login/register footer links ("Sign in"/"Sign up") relied on
  `hover:underline` alone, leaving insufficient color contrast against
  surrounding text with no non-color distinguisher at rest — caught by axe
  once the auth pages were added to the accessibility scan. Changed to a
  persistent `underline`.
- `PropertyMediaGallery`'s thumbnail picker used `role="tablist"`/`role="tab"`
  without the arrow-key navigation that ARIA tab semantics require — found
  during the Phase 4 accessibility audit (not by automated axe scanning, which
  checks markup validity, not keyboard interaction contracts). Replaced with
  `role="group"` + `aria-current`, matching `Pagination`'s existing pattern.
- `ErrorBoundary` was fully built in Phase 1 but never mounted anywhere — wired
  into the root layout so a render-time error anywhere in the app shows a
  graceful fallback instead of a blank screen.

### Changed

- Extracted `useFilterNavigation`: `PropertiesView` and `DevelopersView` each
  had identical URL-building logic; both now share one hook.

## [2026-06-16] - Initial Scaffold

### Added

- Root documentation for the ByTe Real Estate Platform repository.
- Contribution rules aligned with the monorepo roadmap.
