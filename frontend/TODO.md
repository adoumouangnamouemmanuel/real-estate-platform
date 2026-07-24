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
- `MOCK_LISTINGS` is a mutable module-level array (same idiom as
  `auth.mock.ts`), so `e2e/listings.spec.ts`'s mutating tests
  (publish/delete/bulk) must run serial (`test.describe.configure({ mode:
"serial" })`) — concurrent workers would race on the same in-memory list and
  produce flaky row counts. `services/listing.service.test.ts`'s mutation tests
  snapshot/restore the array around each other for the same reason.
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
