# Frontend TODO

Living tracker for frontend work. Update this alongside feature work, not after the fact.

## Completed

- Architecture foundation: App Router shell, design tokens, Prettier, shared
  utilities, API service layer, error/loading/empty-state pattern.
- Auth foundation: Zustand store, session bootstrap on load (`useAuthBootstrap`),
  route protection for `(dashboard)`/`(admin)` via `proxy.ts`. No login/register UI yet.
- **Properties domain**: listing (`/properties`) with pagination, filtering, and
  sorting; detail pages (`/properties/[slug]`) with gallery, amenities, location,
  developer contact card, WhatsApp CTA; search (`/search`) sharing the same
  filtered-listing view.
- **Developer domain**: listing (`/developers`) with search/city filter/sort;
  profile pages (`/developers/[slug]`) with bio, contact, social links, stats,
  active listings, featured properties. Links naturally from property detail pages.
- **Testing infrastructure** (Vitest + React Testing Library + Playwright +
  axe-core): 67 unit/integration tests (9 reusable components, 5 flows), 70
  Playwright tests across 5 browser/viewport projects (navigation, loading/error/
  empty states, invalid-slug 404s, automated WCAG scanning — zero violations).
  CI runs typecheck/lint/format/test+coverage/build/E2E on every PR. See
  ADR-008 in `docs/ARCHITECTURE.md`.
- Wired `ErrorBoundary` into the root layout (built in Phase 1, never mounted
  until now) and fixed a real ARIA misuse in `PropertyMediaGallery` (`role="tab"`
  without the keyboard interaction that role obligates — replaced with
  `role="group"` + `aria-current`, matching `Pagination`'s existing pattern).
- Extracted `useFilterNavigation` — `PropertiesView` and `DevelopersView` had
  identical URL-building logic duplicated verbatim; now share one hook.
- **Authentication domain** (login, register, forgot/reset password, logout,
  protected routes): full forms with React Hook Form + Zod validation, password
  visibility toggle, loading/error/success states, session bootstrap, redirect-
  after-login, role-hierarchy route guards (`USER < DEVELOPER < ADMIN`),
  `/unauthorized` and `/forbidden` pages. Built against
  `services/mocks/auth.mock.ts` per ADR-009 in `docs/ARCHITECTURE.md`.
  OWASP-aligned: generic login error (no user enumeration), anti-enumeration
  password reset, open-redirect guard on `?redirect=` (`lib/authRedirect.ts`),
  length-only password policy. ~64 new unit/integration tests, 12 new E2E
  tests, 7 new pages added to the accessibility scan (all zero-violation).
- Fixed a real validation bug caught by the E2E suite: Zod's `.refine()`/
  `.check()` on an object schema only runs after every other field validates,
  so the registration form's password-mismatch error was silently hidden
  behind an unrelated "accept terms" error until a second submit. Fixed with
  `lib/validation/withPasswordMatchResolver.ts`, a resolver wrapper that checks
  the match independently and merges it into whatever else failed.
- Fixed an axe-caught accessibility violation on the login/register footer
  links ("Sign up"/"Sign in"): `hover:underline` alone left insufficient
  color contrast against surrounding text with no non-color distinguisher at
  rest. Changed to a persistent `underline`.
- **Phase 6.0 — Dashboard Shell**: `DashboardShell`/`DashboardTopBar`/
  `DashboardSidebar`/`DashboardMobileNav`/`DashboardUserMenu`, plus every shared
  primitive later dashboard modules will reuse (`Card`, `Table`, `Tabs`,
  `Dialog`, `Drawer`, `DropdownMenu`, `sonner` toasts, a hand-rolled
  `Sparkline`, `StatCard`, `Breadcrumbs`) — scaffolded via the shadcn CLI
  already configured in this repo (`components.json`, `@base-ui/react`), same
  provenance as `Button`/`Checkbox`/`Badge`. Desktop gets a persistent sidebar
  (icon rail from `md`, full labels from `lg`); mobile gets a bottom tab bar
  with a "More" sheet for the rest. All seven destinations are driven by one
  shared config (`components/dashboard/dashboard-nav.ts`); every destination
  beyond Dashboard Home is gated by its own feature flag
  (`DASHBOARD_PROPERTIES`/`APPOINTMENTS`/`NOTIFICATIONS`/`PROFILE`/`SETTINGS`,
  `DEVELOPER_ANALYTICS`) and renders disabled with a "Soon" badge until its
  phase ships — same idiom as `FEATURES.WHATSAPP_CONTACT`. `FormField` was
  promoted from `components/auth/` to `components/ui/` since dashboard forms
  need the same label/error layout. See ADR-010 in `docs/ARCHITECTURE.md`.
- Fixed a real bug found while building 6.0, not a pre-existing one: the
  dashboard was unreachable in any browser session, even right after logging
  in, because `proxy.ts` re-runs on the client-side navigation fetch behind
  every route change, and mock login never set the cookie it checks for.
  `lib/mockSessionCookie.ts` (TODO(backend): delete once real cookies exist)
  now sets/clears a marker cookie carrying no auth power of its own on
  login/register/logout — the access token still lives only in memory. See
  ADR-010.

- **Phase 6.1 — Dashboard Home**: the developer's post-login overview, built on
  the Phase 6.0 shell. Welcome header (time-of-day greeting, company, date, and a
  pending-work summary), six KPI tiles on the existing `StatCard`, Recent Listings
  (status badges + last-updated + per-row actions), Appointment Overview
  (upcoming/requested/completed tabs), Notifications preview (unread/read/empty),
  Quick Actions, and a reusable Activity Timeline. New reusable dashboard
  primitives: `DashboardSection` (titled card, `<h2>`), `StatusBadge`
  (`PropertyStatusBadge`/`AppointmentStatusBadge`), `ActivityTimeline`. All data
  flows through a new `dashboardService` (mock-backed, `TODO(backend)`) via
  per-widget React Query hooks (`hooks/useDashboard.ts`); no component touches a
  mock or Axios. `page.tsx` is a Server Component composing Client widgets that
  each own their loading/empty/error state. Six new date/number formatters. See
  ADR-011 in `docs/ARCHITECTURE.md`. ~30 new unit/integration tests, 3 new E2E
  tests; the dashboard accessibility scan covers the richer page (zero violations).

  > **Phase renumbering:** the earlier roadmap slotted "My Properties + Property
  > Editor" as Phase 6.1. The approved spec makes **Dashboard Home** 6.1; My
  > Properties moves to 6.2. Names, not scope, changed.

- **Phase 6.2 — My Properties**: listing management only (search, filter, sort,
  pagination, status changes, delete) — the create/edit form is explicitly out of
  scope for this phase and ships as its own phase next. `/listings`
  (`ListingsView`) gives a developer a portfolio-wide table: keyword + status +
  category + listing-type filters, four sort orders, a selectable page size
  (10/25/50) for large portfolios, per-row status transitions and delete via a
  status-aware action menu (only the moves valid for that listing's current
  status are offered — `STATUS_TRANSITIONS`/`DELETABLE_STATUSES` in
  `services/listing.service.ts` are the one source of truth both the row menu and
  the bulk actions toolbar read from), bulk select-and-act (Publish/Suspend/
  Delete, applying only to whichever selected rows are actually eligible and
  reporting what it skipped), and a status-count summary that doubles as a
  one-click filter. New `listingService` (mock-backed, `TODO(backend)`,
  distinct from the public `propertyService` catalogue — this is the
  authenticated owner's own management surface) and `hooks/useListings.ts`
  (query + four mutations, `sonner` toasts on success/error — the first real
  consumer of the `Toaster` infrastructure built in Phase 6.0). Introduces
  `FEATURES.DASHBOARD_PROPERTY_EDITOR` as a sibling to `DASHBOARD_PROPERTIES`:
  the nav item and the listing table shipped now (`DASHBOARD_PROPERTIES` flipped
  true), but Add/Edit still render disabled "Soon" controls
  (`DASHBOARD_PROPERTY_EDITOR` stays false) until the editor phase. See ADR-012
  in `docs/ARCHITECTURE.md`. ~50 new unit/integration tests (service filter/sort/
  transition logic, every new component, a full-flow integration test), 9 new
  E2E tests, 1 new page added to the accessibility scan (zero violations).

- **Phase 6.3 — Property Editor**: create (`/listings/new`) and edit
  (`/listings/[slug]/edit`) share one `ListingForm`, parameterized by mode.
  Autosave-as-draft (debounced, PATCHes only the fields React Hook Form marks
  dirty) while `status === "DRAFT"`; an explicit "Save changes" button once
  published, since a live listing shouldn't change under a buyer mid-edit.
  `MediaUploader` runs an explicit upload state machine (QUEUED → UPLOADING →
  UPLOADED/FAILED, with Retry) and persists an explicit `order` field per
  photo rather than relying on array position, so an async upload queue
  finishing out of order can never scramble the cover image. One
  `listingSchema` with a `publishListingSchema` extending it for the stricter
  "ready to go live" profile — not two independently maintained schemas.
  `useNavigationGuard` (generic, not listing-specific — reusable by any future
  dashboard form) plus `NavigationGuardDialog` warn before losing unsaved
  work. A lightweight `ListingEditorProvider` holds cross-cutting editor
  metadata (identity, autosave status, publish-in-flight) while React Hook
  Form remains the sole source of truth for field values. Flips
  `FEATURES.DASHBOARD_PROPERTY_EDITOR`, lighting up every "Add Property"/"Edit
  listing" control already wired to it since Phase 6.2. See ADR-013 in
  `docs/ARCHITECTURE.md`. ~40 new unit/integration tests, 10 new E2E tests
  (across two specs), 1 new page added to the accessibility scan (zero
  violations).
- Fixed three real bugs found while building 6.3, not shipped:
  - **My Properties' "Edit listing" row action never actually linked
    anywhere** — Phase 6.2 built it as a disabled placeholder (the editor
    didn't exist yet), and flipping `DASHBOARD_PROPERTY_EDITOR` in isolation
    would have left a live-looking, unwired menu item. Caught by the first
    E2E run against the real flag flip, not by any unit test (the row's
    `disabled` state was already covered; its `href` never was). Fixed by
    wiring `render={<Link href={ROUTES.EDIT_LISTING(property.slug)} />}` —
    the same pattern `RecentListings`'s equivalent action already used.
  - **`router.replace()` to adopt a brand-new draft's real URL could discard
    in-progress edits.** `/listings/new` and `/listings/[slug]/edit` are
    different leaf routes, so a genuine Next.js navigation between them
    unmounts and remounts the whole page — losing anything typed after the
    autosave snapshot that triggered the create, and orphaning any
    in-flight continuation (Publish's own follow-up status update, in
    particular, never ran). Fixed by using `window.history.replaceState`
    directly for that specific URL sync: it fixes up what a refresh or
    copy-pasted link lands on without ever invoking Next's router, so the
    component keeps running uninterrupted. See ADR-013.
  - **A field marked clean by autosave/save could stay "dirty" forever
    afterward**, permanently (and incorrectly) triggering the unsaved-changes
    guard on every subsequent navigation attempt. `form.reset(undefined,
{ keepValues: true })` keeps the displayed values but never updates React
    Hook Form's internal dirty-comparison baseline, since no new baseline was
    given — every later edit kept comparing against the _original_
    `defaultValues`. Fixed by passing a freshly-read `form.getValues()` (not
    a snapshot captured before the save's network `await`) as the reset
    baseline, in `useAutosaveListing` and both of `ListingForm`'s explicit
    save paths.

- **Phase 6.4 — Appointments**: `/appointments` (`AppointmentsView`) gives a
  developer their appointment book — full lifecycle management, not just a
  list. `AppointmentStatus` extends the Phase 6.1 four states with
  `RESCHEDULED` and `NO_SHOW` (a rescheduled booking isn't "still requested,"
  and an unattended visit isn't "cancelled" by the developer). New
  `lib/appointmentActionPolicy.ts` centralizes which actions are valid from
  each status (`getActions`, `getBulkActions`, `isValidTransition`,
  `isTerminal`) — the row action menu, the bulk toolbar, the details drawer,
  and `appointmentService`'s own transition validation all read from this one
  module, same reasoning as `STATUS_TRANSITIONS` in `listing.service.ts`.
  Bulk actions are deliberately narrower than per-row actions: only Confirm
  and Cancel (`bulkSafe` in `ACTION_DEFINITIONS`) — Reschedule needs a
  per-row date/time input, Complete/No-Show are one-visit outcomes, neither
  batches sensibly. Keyword + status + timeframe (today/upcoming/overdue)
  filters, two sort orders, a selectable page size, date-grouped rows, and a
  status-count summary doubling as a one-click filter (mirrors
  `ListingsStatusSummary`). The details drawer reuses the existing
  `ActivityTimeline` component unchanged for per-appointment history — each
  mock appointment carries its own `history: ActivityItem[]`, appended to by
  every mutation. A reschedule dialog picks a new date/time via
  `<input type="datetime-local">`. New `appointmentService` (mock-backed,
  `TODO(backend)`, its own dataset — distinct from Phase 6.1's Dashboard Home
  widget data) and `hooks/useAppointments.ts`. Appointment lifecycle events
  route through a new no-op telemetry seam, `lib/telemetry.ts`'s
  `trackAppointmentEvent` (dev-only `console.debug` today; a documented seam
  for a future `POST /api/v1/analytics/events`, see ARCHITECTURE.md §11).
  Flips `FEATURES.DASHBOARD_APPOINTMENTS`, lighting up the sidebar/mobile nav
  link (previously disabled with a "Soon" badge) and adding a "View all"
  action to Dashboard Home's `AppointmentOverview`. See ADR-014 in
  `docs/ARCHITECTURE.md`. ~70 new unit/integration tests, 9 new E2E tests
  (serial, mirroring `listings.spec.ts`), 1 new page added to the
  accessibility scan (zero violations).
- Fixed a real bug found while building 6.4's own E2E spec, not shipped: the
  Appointments table groups rows by scheduled date with an interleaved
  single-cell header row (e.g. "Today") between actual appointment rows, and
  the column header row carries its own "select all" checkbox — both
  `page.getByRole("row").nth(1)` and a plain "row has a checkbox" filter could
  land on the wrong row instead of a real appointment. Fixed by filtering for
  a row containing its own "Actions for `<name>`" button, which only actual
  appointment rows have.
- Also updated two Phase 6.0 nav tests (`DashboardSidebar.test.tsx`,
  `DashboardMobileNav.test.tsx`) and one Phase 6.1 E2E test
  (`dashboard.spec.ts`) that asserted Appointments was the next still-gated
  nav destination — now that Phase 6.4 shipped it live, those assertions
  point at Analytics instead, the same adjustment Phase 6.2 made for My
  Properties.

- **Phase 6.5 — Product UX Review**: a no-new-features pass across the whole
  authenticated experience (login → Dashboard Home → My Properties →
  Property Editor → Appointments), evaluating navigation, workflow
  consistency, visual/interaction consistency, responsiveness, accessibility,
  and performance now that those four modules represent the full daily
  workflow. Method: code-level comparison across the four modules, a live
  keyboard/focus pass, and Playwright screenshots across mobile/tablet/desktop
  viewports — two initial candidate findings (the Property Editor's sticky
  publish bar, the mobile bottom nav) turned out to be `fullPage` screenshot
  stitching artifacts on `position: sticky`/`fixed` elements, not real bugs;
  ruled out with a real scripted scroll instead of trusting the stitched
  screenshot. One Critical/High-value fix shipped: `SkipToContentLink`
  (`components/common/SkipToContentLink.tsx`), wired into `DashboardShell` —
  no page in the dashboard previously offered a way for a keyboard user to
  bypass the top bar and sidebar/mobile nav to reach page content (WCAG 2.4.1,
  Bypass Blocks), and axe's automated scan doesn't reliably catch this gap.
  Everything else surfaced was Medium/Low and is documented below, not
  implemented, per this phase's explicit scope.

- **Phase 6.6 — Notification System**: `/notifications` (`NotificationsView`)
  gives a developer a shared notification inbox — not a page bolted on, but
  the one seam (`notificationService`) the Dashboard Home preview widget, the
  new page, and a nav badge all read/write through. `NotificationType`
  widened from Phase 6.1's 4 coarse categories to a 10-value granular union
  (`APPOINTMENT_REQUESTED/CONFIRMED/CANCELLED/RESCHEDULED/COMPLETED/NO_SHOW`,
  `LISTING_PUBLISHED/SUSPENDED`, `DRAFT_REMINDER`, `SYSTEM`), same move as
  `AppointmentStatus` in 6.4. The old `MESSAGE` type — an in-app "enquiry"
  notification — is gone: ADR-006 already rules out in-app messaging
  entirely, so nothing could legitimately produce one. A coarse
  `NotificationCategory` (Appointment/Listing/System) drives the filter bar,
  derived from type via one lookup table (`NOTIFICATION_CATEGORY`), never
  stored — same "one place a mapping can be wrong" reasoning as
  `AppointmentActionPolicy`. Lifecycle modeled as `status: "UNREAD" | "READ" |
"ARCHIVED"` (a deliberate deviation from the literal ask, explained in
  ADR-015) rather than `read: boolean` + a bolted-on archive timestamp —
  ARCHIVED is fully designed in but nothing produces or shows it yet, per the
  explicit "design for it, don't build the UI" instruction. Card list, not a
  `Table`, for the same reason `NotificationsPreview` already chose one —
  notifications are heterogeneous inbox items, not comparable tabular rows.
  Nav badge only (sidebar item + an aggregate dot on the mobile "More" tab,
  since Notifications falls outside the primary 3 destinations there) — no
  top-bar bell, since the Dashboard Home widget already covers "quick glance"
  and no other module has an equivalent top-bar surface either.
  `useUnreadNotificationCount` polls every 30s, matching the cadence
  ARCHITECTURE.md §9 already documented for the real backend — the concrete
  real-time extension point: a future WebSocket handler only needs to write
  into that one query's cache entry. Flips `FEATURES.DASHBOARD_NOTIFICATIONS`.
  See ADR-015 in `docs/ARCHITECTURE.md`. ~45 new unit/integration tests, 8 new
  E2E tests (serial, mirroring `appointments.spec.ts`), 1 new page added to
  the accessibility scan (zero violations).
- Fixed a real bug found while building 6.6's own service tests, not shipped:
  `markAsRead` called `findNotificationOrThrow` (which throws synchronously
  on an unknown id) from a plain arrow function typed to return a `Promise`,
  not an `async` function — so an unknown id threw synchronously at call
  time instead of yielding a rejected promise. Fixed by making the method
  `async`.
- Also updated `DashboardSidebar.test.tsx`/`DashboardMobileNav.test.tsx` to
  wrap renders in a `QueryClientProvider` and mock
  `notificationService.getUnreadCount` — both components now read the unread
  count for their new badge.
- **Post-6.6 consistency pass**: the identical bug (a synchronous throw from
  a plain arrow function typed to return a `Promise`) was also present in
  `appointment.service.ts`'s `updateStatus`/`reschedule` and
  `listing.service.ts`'s `updateListingStatus`/`deleteListing` — all four
  called their domain's `find*OrThrow` helper without `async`. Fixed all
  four the same way, with the same "rejects an unknown id" regression test
  pattern already used for `notificationService.markAsRead`. Service-layer
  behavior for "operate on an unknown id" is now consistent across all three
  domains (listings, appointments, notifications).
- **Phase 6.7 — Analytics**: `/analytics` (`AnalyticsView`) is a cross-domain
  read model over appointments and listings, not a new domain with its own
  mock array — `analytics.service.ts` composes `listingService.getListings()`
  and `appointmentService.getAppointments()`, then hands the results to a new
  pure calculation module, `lib/analyticsCalculations.ts`
  (`buildAppointmentFunnel`, `buildPortfolioComposition`, `buildActionNeeded`,
  `buildAnalyticsStats`, `dailyEventCounts`) — zero service/React coupling,
  directly unit-testable. `isOverdueAppointment` was extracted from
  `appointment.service.ts` into `lib/appointmentActionPolicy.ts` as a shared
  predicate so Appointments' own "overdue" timeframe filter and Analytics'
  Action Needed read the same definition rather than two copies of the same
  rule. Action Needed and Insights are first-class per this phase's brief:
  `AnalyticsActionNeeded` renders above the fold with three possible flags
  (`OVERDUE_APPOINTMENTS`, `STALE_DRAFTS`, `HIGH_CANCELLATION_RATE`, the last
  gated on a minimum sample size of 5 requested appointments), each a real
  deep link into the filtered view that explains it. Current-state
  (`PortfolioComposition`, Action Needed) vs. period-scoped
  (`AppointmentFunnel`, cohorted by each appointment's
  `APPOINTMENT_REQUESTED` history timestamp) is a real split in the type
  system. "One real chart" — every other stat is a reused `StatCard`
  (`Sparkline`'s first second consumer) or a plain `Table`; the appointment
  funnel is the only bar visualization, and it ships a toggle to an
  equivalent, fully visible `<table>` with identical data rather than a
  screen-reader-only summary. New `SwipeableStatRow` primitive (CSS
  scroll-snap) for the mobile stat strip — the first horizontally-swipeable
  pattern in this codebase. No polling (unlike Notifications' 30s interval) —
  analytics isn't real-time-sensitive the way an unread count is.
  Per-property view counts are a known, undisguised gap — the data model has
  no per-listing view field, so "Top Properties by Views" is excluded rather
  than fabricated; `analytics.service.ts` carries a `TODO(backend)` naming the
  real `GET /api/v1/developers/me/analytics?period=` endpoint. Flips
  `FEATURES.DEVELOPER_ANALYTICS`. See ADR-016 in `docs/ARCHITECTURE.md`. ~30
  new unit tests (calculations, service, filters, 4 components), 5 new E2E
  tests, 1 new page added to the accessibility scan (zero violations).
- Also updated `DashboardSidebar.test.tsx` and `e2e/dashboard.spec.ts` to
  point their "not-yet-shipped nav destination" assertions at Profile &
  Company instead of Analytics, now that Phase 6.7 shipped it live — the same
  adjustment every prior phase's flag-flip has required.
- **Platform Readiness Review**: a no-new-features audit of the full 8-domain
  platform (Auth, Dashboard, Properties, Property Editor, Appointments,
  Notifications, Analytics) against backend-integration readiness — see
  `docs/ARCHITECTURE.md`'s closing review section for the full report and a
  production readiness score. Fixed directly (Critical/High, contained,
  clear engineering value): `app/providers.tsx`'s `QueryClient` now has an
  explicit `retry`/`staleTime` policy (skips retrying 4xx once requests go
  through a real backend, instead of the TanStack default of blindly retrying
  everything 3 times); `next.config.ts` gained baseline security headers
  (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` — a real CSP is deliberately deferred, see Technical
  Debt); query-key consistency fixed in `useProperties`/`useDevelopers`
  (bare string literals → exported `PROPERTIES_KEY`/`DEVELOPERS_KEY`
  constants) and `useListingEditor` (now built from the same `LISTINGS_KEY`
  export `useListings.ts` already had, instead of a second hardcoded
  `["listings"]` literal that could silently drift from it); and a real
  state-drift bug in `AppointmentsView`/`NotificationsView`, where the
  details drawer and reschedule dialog held a snapshot `Appointment`/
  `Notification` object captured at click time instead of deriving it from
  the live query by id — an open panel could keep showing stale
  status/read-state after a concurrent refetch. Every Medium/Low finding
  (semantic-table accessibility gap, skeleton-loading duplication across 3
  domains, CSRF documentation, `lib/api.ts` interceptor coverage, and more)
  is recorded in Technical Debt below rather than implemented, per the
  review's own scope.
- **Rebrand: ByTe → Lumavok** — every visible occurrence of the app name
  migrated to read from `constants/config.ts`'s `APP_NAME` instead of a
  hardcoded literal, so a future rebrand is a one-line change. See
  CHANGELOG.md for the full file list.
- **Premium Public Experience Transformation** — homepage, `PropertyCard`,
  and property detail page redesign; new `favoriteService`/`useFavorites`;
  one deliberate brand hue introduced. Followed by a self-review (real
  screenshots, not just source inspection) that found and fixed a
  content-hiding scroll-reveal bug, three mismatched category images, a
  false "Verified developers only" claim, a button-size inconsistency, and
  an unbranded navbar link. See CHANGELOG.md for the full breakdown.
- **Dashboard Home Transformation** — a new `DashboardActionNeeded` section
  (shared `ActionNeededList`, promoted out of Analytics), a trimmed 4-tile
  KPI grid, thumbnail imagery in Recent Listings, a compact `QuickActions`
  row, and two real bugs fixed along the way: the shared `Tabs` primitive's
  broken orientation variant, and the dashboard sidebar's active-nav-state
  color never having picked up the brand teal. See CHANGELOG.md for detail.

## In Progress

- Nothing currently in flight.

## Next Tasks

- Wire `propertyService`/`developerService` to the real backend once
  `GET /api/v1/properties` and `GET /api/v1/developers` exist — every mock method
  has a `TODO(backend)` marking the endpoint it stands in for.
- Extend test coverage to the service layer's filter/sort logic
  (`filterProperties`, `sortProperties`, `filterDevelopers`, `sortDevelopers`) and
  to `useAuthBootstrap` — currently exercised only indirectly through the view
  integration tests. See the QA report's coverage table for the full gap list.
- **Backend Integration Planning is complete** — see `docs/API_CONTRACT.md` (the
  full per-service endpoint/DTO contract, meant to hand directly to backend
  engineers) and `docs/BACKEND_INTEGRATION_ROADMAP.md` (the consolidated
  `TODO(backend)` checklist, assumptions needing backend-team sign-off, a
  recommended first-wave endpoint order, MVP/pre-production/nice-to-have
  classification for all 39 endpoints, the auth-flow and media-upload review,
  and a 6-phase migration plan from mocks to real APIs). Every individual
  `TODO(backend)` comment in the code should be treated as a pointer into that
  checklist, not tracked independently. **No mock has been replaced yet** —
  waiting for approval before Phase A (Auth Foundation) begins.

## Blocked

- `FEATURES.WHATSAPP_CONTACT` — needs the backend's `/properties/:id/whatsapp-link`
  endpoint and real developer phone numbers (number-masking design, ARCHITECTURE.md §8).
- `FEATURES.MAP_VIEW` — needs a Mapbox API key.
- Real property media uploads — Phase 6.3's `MediaUploader` built the full
  UI/UX (queue, retry, ordering) against a mock `uploadService`, but actually
  reaching Cloudinary needs the backend's `POST /api/v1/uploads/signature`
  (ARCHITECTURE.md §7); `next.config.ts` is already configured for it.

## Technical Debt

- `MediaUploader` reorders photos with explicit "move earlier"/"move later"
  buttons, not drag-and-drop — drag-and-drop would need a new dependency and
  its own from-scratch keyboard-accessibility work; the buttons are fully
  keyboard-operable today with no added dependency. Revisit if a design pass
  specifically calls for drag reordering.
- Disabling autosave the instant Publish/Delete starts (`useAutosaveListing`'s
  `enabled` flag) cancels any _scheduled-but-not-yet-fired_ debounce timer
  immediately, which is the realistic case at human/E2E interaction speeds.
  It does not cancel a save whose network call was already mid-flight in the
  same tick publish/delete began — no `AbortController`-based request
  cancellation exists yet. Acceptable at today's mock latency; revisit if this
  ever causes an observed issue against real backend latency.
- `services/mocks/listings.mock.ts` (My Properties' portfolio) and
  `services/mocks/dashboard.mock.ts` (Dashboard Home's "recent" listings) are
  deliberately independent datasets, not the same array — Phase 6.1 shipped and
  was reviewed before Phase 6.2 existed, and this phase doesn't touch it. A real
  backend serves both from one table; until that integration, publishing/
  deleting a listing in My Properties doesn't change what Dashboard Home shows.
  Same split exists between `services/mocks/appointments.mock.ts`
  (Appointments, Phase 6.4) and `dashboard.mock.ts`'s existing
  `MOCK_APPOINTMENTS` (Dashboard Home's Appointment Overview widget, Phase 6.1).
- `MOCK_LISTINGS` is a mutable module-level array (same idiom as
  `auth.mock.ts`), so `e2e/listings.spec.ts`'s mutating tests
  (publish/delete/bulk) must run serial (`test.describe.configure({ mode:
"serial" })`) — concurrent workers would race on the same in-memory list and
  produce flaky row counts. `services/listing.service.test.ts`'s mutation tests
  snapshot/restore the array around each other for the same reason.
  `MOCK_APPOINTMENTS` (Phase 6.4) and `e2e/appointments.spec.ts` /
  `services/appointment.service.test.ts` follow the identical pattern.
- `AppointmentTimeframe`'s `"overdue"` bucket is computed client-side against
  `Date.now()` at query time (`matchesTimeframe` in `appointment.service.ts`)
  — fine at mock scale; a real backend would likely compute this server-side
  against one consistent clock rather than trusting each client's local time.
- `FilterPanel` (properties) and `DeveloperFilterPanel` (developers) are
  structurally identical but not shared — deliberate (their fields differ enough
  that a shared abstraction would need render-prop-style configuration for two
  consumers). Revisit if a third filtered-listing domain appears.
- `AUTH_COOKIE_NAME` in `constants/config.ts` is an assumption pending backend
  confirmation of the actual refresh-token cookie name.
- `proxy.ts` only checks cookie presence, not role — `/admin` is reachable by any
  authenticated user until role-aware middleware or a real check lands.
- `lib/mockSessionCookie.ts` is a Phase-6-only shim (marked `TODO(backend)`) that
  sets a marker cookie so `proxy.ts` lets an authenticated mock session through —
  delete once the real backend issues actual `Set-Cookie` login responses. See
  ADR-010 in `docs/ARCHITECTURE.md`.
- Test coverage is uneven by design (component/flow tests were scoped
  explicitly, not exhaustively): `services/properties.service.ts` and
  `services/developers.service.ts` filter/sort logic, `lib/whatsapp.ts`,
  `ErrorBoundary`, and `Navbar`/`Footer` have no direct unit tests yet. None of
  these are currently suspected buggy — this is a coverage gap, not a known
  defect.
- `RequireAuth`'s role-forbidden (`/forbidden`) redirect path is still only
  exercised by a unit test with a mocked store, not full-browser E2E — no longer
  because of the cookie limitation (fixed in Phase 6, see ADR-010), but because
  there's no user-facing affordance that ever points a wrong-role user at a
  dashboard route to click through in the first place.
- Root-level `postcss.config.mjs` and `tsconfig.json` show as perpetually
  modified in `git status` with a zero-line diff (CRLF-normalization artifact
  from `core.autocrlf`) — cosmetic, harmless, not worth chasing further.
- Dashboard-widget **error-state** assertions live in the full-page integration
  test (`test/integration/dashboard-home.test.tsx`), not the per-widget unit
  tests. A rejected React Query fetch in a very light component tree trips a
  node/vitest unhandled-rejection false positive (React Query has, in fact,
  stored the error in state); a heavier render — the whole page, or any of the
  existing view tests like `properties-listing` — doesn't. Same reason the
  properties/developers domains test error states at the view level. Not a
  product bug; purely a test-harness timing artifact.
- `services/mocks/notifications.mock.ts` (Notifications, Phase 6.6) is
  deliberately independent from `dashboard.mock.ts`'s existing
  `MOCK_NOTIFICATIONS` (Dashboard Home's preview widget, Phase 6.1) — same
  reasoning as the listings/appointments dataset splits above. `MOCK_NOTIFICATIONS`
  in `notifications.mock.ts` is a mutable module-level array, so
  `e2e/notifications.spec.ts`'s mutating tests (mark as read, mark all as
  read) run serial, and `services/notification.service.test.ts`'s mutation
  tests snapshot/restore the array around each other, following the identical
  pattern `listing.service.test.ts`/`appointment.service.test.ts` already use.
- Two pre-existing test flakes surfaced (not introduced) while validating
  Phase 6.6 under the full suite: `ActivityTimeline.test.tsx`'s "machine-
  readable `<time>`" test hardcodes an absolute date and drifts against the
  real system clock as sessions cross midnight; two
  `test/integration/listing-editor.test.tsx` autosave-timing assertions
  occasionally miss their `waitFor` window only under heavy parallel test-file
  contention (both pass cleanly in isolation). Neither is a product bug;
  worth a dedicated look if they start failing in CI rather than just locally.
  A third instance of the identical E2E class (an `appointments.spec.ts` test
  timing out on a menu click only under 6-worker parallel contention, passing
  cleanly in isolation) surfaced again during the Platform Readiness Review
  below — same root cause, not a new issue.

### Platform Readiness Review (July 2026) — Medium/Low findings deferred, not implemented

A full architecture/domain/API/state/design-system/accessibility/performance/
security/testing/DX audit was run after Phase 6.7 shipped (see
`docs/ARCHITECTURE.md`'s closing review section for the full report). Critical
and High findings with clear, contained engineering value were fixed directly
(React Query retry/staleTime defaults, query-key consistency in
`useProperties`/`useDevelopers`/`useListingEditor`, a details-drawer/dialog
state-drift bug in `AppointmentsView`/`NotificationsView` — see CHANGELOG.md).
Everything below is Medium/Low and deliberately deferred:

- **[High, deferred — needs a dedicated pass]** `ListingsTable`/`AppointmentsTable`
  render rows as styled `<div>` grids, not semantic `<table>`/`<tr>`/`<td>` —
  screen readers lose row/column/table-size announcements on the app's two
  richest data views, even though `components/ui/table.tsx` already exists
  and Analytics' own components use it. Not fixed in this pass: converting
  two production tables with row selection, bulk actions, and responsive
  behavior is a correctness-sensitive rewrite that deserves its own reviewed
  phase, not a bundled fix inside a readiness audit.
- **[Medium]** Three near-identical table/list loading-skeleton
  implementations (`ListingsTableSkeleton`, `AppointmentsTableSkeleton`,
  `NotificationsListSkeleton`) could collapse into one shared primitive — a
  clear "third occurrence" extraction candidate per the project's own
  precedent, but not urgent.
- **[Medium]** `home/DashboardKpis.tsx`'s `StatCard` row still uses a plain
  responsive grid, not `SwipeableStatRow` (built in Phase 6.7 for exactly this
  "dense KPI row on mobile" problem) — an inconsistency worth a deliberate
  decision, not an oversight to silently fix.
- **[Medium]** The filter-bar pattern is now independently implemented across
  5 domains (`ListingsFilterBar`, `AppointmentsFilterBar`,
  `NotificationsFilterBar`, plus `FilterPanel`/`DeveloperFilterPanel`) at
  similar size each — past the "third domain" extraction trigger this doc
  already applies elsewhere (see `FilterPanel`/`DeveloperFilterPanel` note
  above), but each is still domain-specific enough that forcing a shared
  abstraction now risks a leaky one; revisit if a 6th domain needs a filter bar.
- **[Medium]** `dashboard.service.ts` is the one domain whose read methods
  (`getRecentListings(limit)`, `getNotifications(limit)`, etc.) return bare
  arrays with an ad hoc `limit` param instead of the `{page,pageSize} →
PaginatedResult` shape every other domain service uses — harmless at
  today's "top 5" widget scale, but an inconsistent contract shape a backend
  integrator would need to special-case.
- **[Medium]** No security-header documentation existed before this review;
  baseline headers (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`) were added to `next.config.ts` as
  part of the Critical/High fixes, but a real Content-Security-Policy is
  deliberately still deferred — it needs to be scoped against the real
  backend's origin and Cloudinary's asset domains once those are known,
  rather than ship a guessed policy that's either broken or meaningless.
- **[Medium]** CSRF handling is undocumented despite the architecture
  committing to an `HttpOnly`/`SameSite=Strict` refresh cookie (ADR-010) —
  `SameSite=Strict` mitigates most vectors, but there's no explicit written
  reasoning, and no plan for what happens if the real backend's cookie config
  ends up looser (`Lax`/`None`) for cross-subdomain reasons. Add a short CSRF
  section to `docs/ARCHITECTURE.md` §6 once the backend's actual cookie
  config is known.
- **[Medium]** `lib/validation/*.ts` Zod schemas have no comment stating they
  are UX-only and that the real backend must re-validate everything
  server-side (unlike the auth/cookie assumptions, which are thoroughly
  flagged) — cheap to add, not yet done.
- **[Medium]** `lib/api.ts`'s silent-refresh-and-retry 401 interceptor has no
  dedicated test file — the bootstrap-time refresh path is covered
  (`session-lifecycle.test.tsx`), but "access token expires mid-session, next
  request 401s and silently retries" is not. Worth covering once the real
  backend's `/auth/refresh` contract is confirmed.
- **[Low]** `register()`'s "an account with this email already exists"
  message is enumeration-capable (unlike login/forgot-password, which are
  already anti-enumeration-safe) — a deliberate, common trade-off, flagged
  here as a residual risk rather than a defect.
- **[Low]** The open-redirect guard (`lib/authRedirect.ts`) handles the
  reported backslash/protocol-relative cases but hasn't been tested against
  more exotic encodings (leading control characters, double-encoded
  slashes) — no known bypass, worth a dedicated fuzz-style test pass.
- **[Low]** `ListingsView`'s single-delete confirmation dialog holds a
  `Property` snapshot (`deleteTarget.property`) captured at click time rather
  than deriving it from the live query by id, the same class of staleness
  bug fixed in `AppointmentsView`/`NotificationsView` this pass — lower
  priority here because the dialog only displays a title for confirmation
  (the mutation itself always targets the correct id), so at worst a stale
  title is shown, not a wrong action taken.
- **[Low]** Zero `next/dynamic`/`React.lazy` usage anywhere — dialogs, drawers,
  and the Analytics chart all ship in the initial client bundle for any view
  that imports them. Not measured against a real bundle-analyzer run, so
  treat as a hypothesis to verify before investing in code-splitting.
- **[Low]** No `React.memo` anywhere in `components/` — `AppointmentsView`/
  `ListingsView` re-render their full subtree (filters, table, pagination) on
  every row-selection toggle. Not a measured problem at current data volumes.
- **[Low]** No `prefers-reduced-motion` handling anywhere (already flagged
  pre-existing debt, re-confirmed still open during this review).

## Bugs

- None open. Three were caught and fixed during development, not shipped:
  - A Pagination URL builder that dropped active filters (Phase 2.3).
  - A developer-profile cover image/heading overlap (Phase 3).
  - An ARIA misuse in `PropertyMediaGallery` (`role="tab"` without keyboard
    support) — caught during the Phase 4 accessibility audit, not by axe (axe
    checks static markup validity, not keyboard interaction contracts).
  - See git history for each.

## Future Enhancements

- Feature-colocate `components/` (e.g. `features/properties/`) once a third
  domain (dashboard or admin) grows its own component set — premature today at
  two domains.
- `components/common/Pagination`'s numbered-page-button UI is untested past ~7
  pages of mock data; revisit truncation (`1 … 4 5 6 … 20`) once real listing
  volumes exist.
- No visual regression testing (Playwright screenshot comparison or similar).
  Worth adding once the design system stabilizes further — premature while the
  UI is still evolving quickly.

### Phase 6.5 UX review — Medium/Low findings deferred, not implemented

- **[Medium]** Dashboard Home's Quick Actions panel labels the My Properties
  destination "View Listings" (`components/dashboard/home/QuickActions.tsx`,
  Phase 6.0), while the sidebar/mobile nav and the page itself call it "My
  Properties" (Phase 6.2). Same destination, two different names depending on
  where a developer looks. Low engineering cost to fix (rename the Quick
  Action label); deferred since it doesn't block or confuse any actual
  workflow, just a minor product-cohesion polish item.
- **[Medium]** `RESCHEDULED` and `COMPLETED` appointment statuses render with
  the same badge tone (`info`/blue) in `AppointmentStatusBadge`
  (`components/dashboard/StatusBadge.tsx`) — distinguishable by label text
  (WCAG 1.4.1 is satisfied, per that component's own documented rationale),
  but the badge system's color signal is diluted between two otherwise
  unrelated statuses. Worth giving `RESCHEDULED` its own tone in a future pass.
- **[Low]** Breadcrumbs (`DashboardPageHeader`'s `breadcrumbs` prop) currently
  only appear on the Property Editor's create/edit routes — the one place with
  real list→detail hierarchy today. My Properties, Appointments, and Dashboard
  Home correctly have none (no parent to breadcrumb to). Worth revisiting once
  a module gains its own nested detail view (e.g. a future Notifications
  sub-page) to keep the pattern applied consistently as hierarchy grows.
- **[Low]** No bundle-size visibility — the build output doesn't print a
  route-by-route First Load JS table (Turbopack's summary is coarser than
  webpack's), so the actual weight of the heaviest client route
  (`/listings/new`, carrying React Hook Form + Zod + `MediaUploader`) versus
  the rest isn't quantified. Consider `@next/bundle-analyzer` once real
  performance concerns emerge, rather than pre-optimizing blind.
- **[Low]** No `prefers-reduced-motion` handling for Dialog/Drawer transition
  animations (base-ui's defaults). Common, low-severity gap; revisit if a
  user-reported motion-sensitivity issue ever surfaces.
