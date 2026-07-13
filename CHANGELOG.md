# Changelog

All notable changes to this repository will be documented in this file.

The format follows Keep a Changelog and the project uses a roadmap-driven delivery model.

## [Unreleased]

### Added

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

- Registration and reset-password forms could silently hide a "Passwords
  don't match." error behind an unrelated field error (e.g. an unchecked
  terms checkbox) until a second submit — caught by the E2E suite. Root
  cause: Zod's `.refine()`/`.check()` on an object schema only runs after
  every other field validates. Fixed with `withPasswordMatchResolver`, a
  resolver wrapper that checks the match independently and merges it into
  whatever else failed, so every problem in a submission surfaces at once.
- Login/register footer links ("Sign in"/"Sign up") relied on `hover:
  underline` alone, leaving insufficient color contrast against surrounding
  text with no non-color distinguisher at rest — caught by axe once the auth
  pages were added to the accessibility scan. Changed to a persistent
  `underline`.
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
