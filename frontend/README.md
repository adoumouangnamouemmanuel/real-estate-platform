# ByTe Frontend

The Next.js web application for ByTe — a property discovery and trust platform for African
markets. Public browsing, developer dashboards, and admin moderation all live in this workspace.
See [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) and
[`docs/ByTe_RealEstate_Roadmap.md`](../docs/ByTe_RealEstate_Roadmap.md) at the repo root for the
full system design and delivery plan.

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app expects the backend API at
`NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000/api/v1` — see `constants/config.ts`).

## Scripts

| Script                  | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `npm run dev`           | Start the Next.js dev server                           |
| `npm run build`         | Production build (also type-checks)                    |
| `npm run start`         | Serve the production build                             |
| `npm run lint`          | ESLint (`next/core-web-vitals` + TypeScript rules)     |
| `npm run format`        | Format the codebase with Prettier                      |
| `npm run format:check`  | Check formatting without writing (CI use)              |
| `npm run typecheck`     | `tsc --noEmit`                                         |
| `npm run test`          | Unit + integration tests (Vitest, single run)          |
| `npm run test:watch`    | Vitest in watch mode                                   |
| `npm run test:coverage` | Vitest with a coverage report (`coverage/`)            |
| `npm run e2e`           | Playwright E2E suite — all 5 browser/viewport projects |
| `npm run e2e:ui`        | Playwright's interactive UI mode                       |

## Folder Structure

```
app/                Next.js App Router
  (public)/          No-auth routes: home, properties, developers, search — owns Navbar/Footer
  (auth)/            login, register, forgot-password
  (dashboard)/       Developer-only routes (auth required)
  (admin)/           Admin-only routes
  layout.tsx         Root layout: html/body shell, fonts — no page chrome
  globals.css        Tailwind v4 config + design tokens (CSS-first, no tailwind.config.ts)
components/
  ui/                shadcn/ui-generated primitives — don't hand-edit, regenerate via CLI
  layout/            Navbar, Footer, and future sidebars
  common/            Cross-domain reusable components (ErrorBoundary, Loading, ErrorState, EmptyState,
                     Pagination, FilterChips, WhatsAppCTA, MapPlaceholder)
hooks/               Custom hooks (thin wrappers over store/query state)
lib/                 api.ts (Axios client), errors.ts (API error messages), utils.ts (shadcn's cn() helper)
services/            One file per API domain (auth.service.ts, ...) — the only place that calls lib/api.ts directly
  mocks/               Mock fixtures backing the services until real endpoints exist
store/               Zustand global client state (auth, filters — server state goes in React Query instead)
types/               Shared TypeScript types
constants/           routes.ts (path constants), config.ts (env-derived config), features.ts (feature flags)
public/              Static assets served as-is
test/                fixtures.ts, renderWithQueryClient.tsx — shared Vitest test helpers
e2e/                 Playwright specs (user-journey, error-states, accessibility)
```

Unit/integration tests are colocated with the code they test (`Component.test.tsx` next to
`Component.tsx`), except cross-component integration tests, which live in `test/integration/`.

## Testing

- **Unit/integration** (Vitest + React Testing Library): `npm run test`. Mock at the service
  boundary (`vi.mock("@/services", ...)`), not the hook layer — integration tests should exercise
  the real hook + React Query wiring.
- **E2E** (Playwright, + `@axe-core/playwright` for automated WCAG scanning): `npm run e2e`. Needs
  a running app — Playwright's `webServer` config builds and starts one automatically.
- Async Server Components (route `page.tsx` files) cannot be unit-tested — this is a Vitest/Next.js
  constraint, not a gap to work around. Test the `*View` composition component directly with
  fixture props for integration coverage, and rely on Playwright for the real page.
- See ADR-008 in `docs/ARCHITECTURE.md` for the full rationale, including two cross-browser
  gotchas already found and fixed (WebKit + `.fill()`, and a `generateMetadata` timing race in
  axe scans) — read before adding new E2E tests so they aren't rediscovered.

## Coding Conventions

Repo-wide rules live in [`CONTRIBUTING.md`](../CONTRIBUTING.md) — the frontend-specific subset:

- **TypeScript strict, no `any`.** Narrow `unknown` instead.
- **No `console.log`** in committed code.
- **Components never call the API directly** — go through a hook backed by React Query, or the
  `store/` for client state. `lib/api.ts` is the only place an Axios instance is constructed.
- **Naming:** components `PascalCase.tsx` (`PropertyCard.tsx`), hooks/utils `camelCase.ts`
  (`useAuth.ts`, `formatters.ts`), booleans prefixed `is`/`has`/`can`.
- **Styling:** Tailwind utilities first; reach for `components/ui/` (shadcn) primitives before
  writing new low-level components. Design tokens are CSS variables in `globals.css`
  (`--background`, `--border`, `--primary`, etc. — shadcn's standard names, not a custom prefix)
  — reference them via Tailwind classes (`bg-background`, `text-muted-foreground`), never
  hardcoded hex/oklch values in components.
- **Formatting is enforced by Prettier**, not manual style debates — run `npm run format` before
  committing. `eslint-config-prettier` disables any ESLint stylistic rules that would conflict.
- Every exported function/component gets at least a one-line doc comment when its purpose or a
  non-obvious constraint isn't already clear from its name and signature.

## Architecture Notes

- **App Router, RSC by default.** Add `"use client"` only when a component needs state, effects,
  browser APIs, or event handlers. Class components (e.g. `ErrorBoundary`) always need it.
- **Route groups control layout, not URLs.** `(public)`, `(auth)`, `(dashboard)`, `(admin)` each
  get their own `layout.tsx` for role-appropriate chrome; the root `layout.tsx` stays minimal.
- **Auth token lives in memory only** (`store/authStore.ts`), never `localStorage` — refresh
  tokens are an HttpOnly cookie the browser sends automatically. `hooks/useAuthBootstrap.ts`
  restores the session on app load; `proxy.ts` gates `(dashboard)` and `(admin)` on the
  refresh cookie's presence. See `docs/ARCHITECTURE.md` §6 for the full flow — deep role checks
  (DEVELOPER vs ADMIN) still happen server-side, not in middleware.
- **Async UI has three canonical states**: `components/common/Loading`, `ErrorState`, and
  `EmptyState`. Pair `ErrorState` with `lib/errors.ts`'s `getErrorMessage()` to turn an Axios
  failure into a user-facing message — don't reach into `error.response.data` by hand in
  components. `ErrorBoundary`'s default fallback is `ErrorState`, so render-time and API-failure
  errors look the same.
- **Media uploads go directly from the browser to Cloudinary**, not through this app or the
  Express API, once that flow is built (see architecture doc §7).
- This app is Next.js 16 / React 19 / Tailwind v4 — **assume APIs and conventions differ from
  older Next.js versions you may know**; check `node_modules/next/dist/docs/` before relying on
  memorized App Router behavior (see `AGENTS.md`).

## Contribution Workflow

- Branch from `develop`: `feature/BYTE-{issue}-short-description`.
- Conventional Commits: `feat(scope): subject`, imperative, ≤72 chars, no trailing period.
- Keep PRs small (repo guideline: ≤400 lines changed) and scoped to one concern.
- Screenshots/recordings required on frontend PRs.
- Update `CHANGELOG.md` for user-facing changes, `.env.example` for new env vars.
- Emmanuel reviews and approves all PRs before merge.

Full detail: [`CONTRIBUTING.md`](../CONTRIBUTING.md) at the repo root.
