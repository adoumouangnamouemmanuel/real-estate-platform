# Changelog

All notable changes to this repository will be documented in this file.

The format follows Keep a Changelog and the project uses a roadmap-driven delivery model.

## [Unreleased]

### Added

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
