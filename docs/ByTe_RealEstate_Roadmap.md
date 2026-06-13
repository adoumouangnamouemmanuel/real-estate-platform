# 🏠 ByTe Real Estate Platform - Development Roadmap

## From Zero to Production in 4 Weeks

### A Phase-by-Phase Build Plan with GitHub Issues, Milestones, Engineering Standards & Architecture

---

## Table of Contents

1. [Guiding Philosophy](#1-guiding-philosophy)
2. [Project Timeline Summary](#2-project-timeline-summary)
3. [Team Structure & Responsibilities](#3-team-structure--responsibilities)
4. [Full Tech Stack](#4-full-tech-stack)
5. [Folder Structure](#5-folder-structure)
6. [Engineering Standards & Rules](#6-engineering-standards--rules)
7. [GitHub Project Setup](#7-github-project-setup)
8. [Phase 1 - Foundation & Architecture](#8-phase-1--foundation--architecture-week-1-jun-15-21)
9. [Phase 2 - Core Backend & Database](#9-phase-2--core-backend--database-week-2-jun-22-28)
10. [Phase 3 - Frontend & Integration](#10-phase-3--frontend--integration-week-3-jun-29--jul-5)
11. [Phase 4 - Polish, Testing & Deployment](#11-phase-4--polish-testing--deployment-week-4-jul-6-13)
12. [GitHub Issues Registry](#12-github-issues-registry)
13. [Milestone Checklist](#13-milestone-checklist)
14. [Database Schema Design](#14-database-schema-design)
15. [API Contract (REST)](#15-api-contract-rest)
16. [Environment Variables Reference](#16-environment-variables-reference)
17. [Risk Register](#17-risk-register)
18. [Definition of Done](#18-definition-of-done)

---

## 1. Guiding Philosophy

Four weeks is aggressive. Every engineer must internalize these rules before writing a single line of code.

**Ship vertically, not horizontally.**
Do not build all database schemas, then all APIs, then all UIs in isolation. Each phase delivers a complete, testable, working slice of the system. By end of Week 1, the monorepo is set up and the skeleton runs. By end of Week 2, a developer can create a listing and it persists in the database. By end of Week 3, a user can browse it on the web. By Week 4, it is deployed to production.

**The listing is the atom of the product.**
Every feature in ByTe - search, favorites, WhatsApp contact, ratings, analytics - exists to surface a property listing. Build the listing pipeline first. Build everything else around it.

**Mobile-first is not a design preference. It is a constraint.**
ByTe's users in African markets are on mobile, on slow networks. Every UI decision, every image upload strategy, every API response payload must be evaluated against: *does this work on a mid-range Android on a 3G connection?*

**WhatsApp is not a hack. It is the product.**
Do not build in-app chat "for later." WhatsApp integration is a first-class feature. The click-to-WhatsApp CTA is the most important button on the platform. Test it on every screen it appears.

**Security and trust are the product's moat.**
Developer verification, listing moderation, and the rating system are not nice-to-haves. They are the reason ByTe wins over WhatsApp groups and Facebook posts. Build moderation infrastructure from day one.

**Scope freeze at Week 2.**
After Phase 2 begins, no new features are added to the MVP scope. Requests go into a `v2-backlog` label on GitHub. Violating this rule is the number-one cause of 4-week sprints becoming 8-week sprints.

---

## 2. Project Timeline Summary

```
ByTe Real Estate Platform - 4-Week Sprint
JUN 15 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ JUL 13
          Wk 1       Wk 2       Wk 3       Wk 4
         Jun 15     Jun 22     Jun 29     Jul  6     Jul 13
           │          │          │          │          │
           ▼          ▼          ▼          ▼          ▼
Phase 1   ██████████
Phase 2              ██████████
Phase 3                         ██████████
Phase 4                                    ██████████
                                                      ★ LAUNCH (Jul 13)

LEGEND
Phase 1 │ Foundation & Architecture     │ Week 1  │ Jun 15–21
Phase 2 │ Core Backend & Database       │ Week 2  │ Jun 22–28
Phase 3 │ Frontend & Integration        │ Week 3  │ Jun 29–Jul 5
Phase 4 │ Polish, Testing & Deployment  │ Week 4  │ Jul 6–13
```

---

## 3. Team Structure & Responsibilities

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          ByTe Real Estate - Project Team                         │
├──────────────────────┬───────────────────────────────────────────────────────────┤
│ Role                 │ Responsibilities                                           │
├──────────────────────┼───────────────────────────────────────────────────────────┤
│ Emmanuel             │ CTO & Lead Engineer. System architecture, DevOps, CI/CD,  │
│ (CTO / Tech Lead)    │ automation, PR reviews, milestone gate-keeping,           │
│                      │ deployment pipeline, environment setup, DNS, SSL.         │
│                      │ Owns: GitHub Actions, Nginx, Docker Compose, all          │
│                      │ infrastructure decisions. Final say on all PRs.           │
├──────────────────────┼───────────────────────────────────────────────────────────┤
│ Clement              │ Database Administrator. Schema design, migrations,        │
│ (DBA)                │ indexing strategy, query optimization, seed data,         │
│                      │ backup strategy, PostgreSQL tuning.                       │
│                      │ Owns: /database folder, all Prisma schema files,          │
│                      │ migration scripts, DB documentation.                      │
├──────────────────────┼───────────────────────────────────────────────────────────┤
│ Albert               │ Backend Engineer. Node.js/Express API, business logic,    │
│ (Backend)            │ authentication (JWT), file uploads (Cloudinary),          │
│                      │ WhatsApp deeplink generation, notification service,       │
│                      │ search endpoint, developer analytics.                     │
│                      │ Owns: /backend folder, all API routes, middleware,        │
│                      │ services, and unit tests.                                 │
├──────────────────────┼───────────────────────────────────────────────────────────┤
│ Claude               │ Frontend Engineer. Next.js 14 (App Router), React,       │
│ (Frontend)           │ Tailwind CSS, responsive UI, property browsing,           │
│                      │ developer dashboard, search/filter UX, SEO.              │
│                      │ Owns: /frontend folder, all pages, components,            │
│                      │ hooks, and frontend tests.                                │
└──────────────────────┴───────────────────────────────────────────────────────────┘

Daily Sync: 09:00 WAT - 15-minute standup (What I did, what I'll do, any blockers)
PR Reviews: Emmanuel reviews all PRs within 4 working hours.
Async: GitHub Discussions for architectural decisions. WhatsApp for urgent blockers only.
```

---

## 4. Full Tech Stack

### 4.1 Frontend

```
Framework         Next.js 14 (App Router)
Language          TypeScript 5.x (strict mode - no `any`)
Styling           Tailwind CSS 3.x + shadcn/ui component library
State Management  Zustand (global: auth, filters) + React Query (server state)
Forms             React Hook Form + Zod (schema validation)
Maps              Mapbox GL JS (property location pins)
Image Upload      react-dropzone (client-side) → Cloudinary (storage)
Icons             Lucide React
Animations        Framer Motion (subtle, not distracting)
SEO               Next.js built-in metadata API + next-sitemap
Analytics         PostHog (self-hostable, GDPR-friendly)
Testing           Vitest + React Testing Library + Playwright (E2E)
Linting           ESLint (next/core-web-vitals) + Prettier
```

### 4.2 Backend

```
Runtime           Node.js 20 LTS
Framework         Express.js 4.x
Language          TypeScript 5.x (strict mode)
ORM               Prisma 5.x
Validation        Zod
Authentication    JWT (access + refresh token pattern)
File Storage      Cloudinary (images/videos with CDN)
Email             Nodemailer + Gmail SMTP (dev) → Resend (prod)
Job Queue         BullMQ + Redis (notification jobs, email jobs)
API Docs          Swagger/OpenAPI 3.0 (auto-generated via tsoa or swagger-jsdoc)
Testing           Jest + Supertest
Linting           ESLint + Prettier
```

### 4.3 Database

```
Primary DB        PostgreSQL 15 (via Prisma ORM)
Cache / Queue     Redis 7 (BullMQ queues + hot-data caching)
Search            PostgreSQL Full-Text Search (MVP) → Meilisearch (v2)
Migrations        Prisma Migrate
Seed              Prisma seed scripts (TypeScript)
Backups           pg_dump cron job → S3-compatible storage (Cloudflare R2)
```

### 4.4 Infrastructure & DevOps

```
Containerization  Docker + Docker Compose (all services)
CI/CD             GitHub Actions
Reverse Proxy     Nginx (SSL termination, rate limiting, static assets)
SSL               Let's Encrypt via Certbot (auto-renewal)
Server            VPS - Ubuntu 22.04 LTS (4 vCPU, 8GB RAM minimum)
                  Options: Hetzner Cloud (recommended, cost-effective)
                           DigitalOcean Droplet
                           Contabo VPS
Domain            Unified ByTe domain (e.g., byte.africa)
                  Subdomains: app.byte.africa (frontend)
                              api.byte.africa (backend)
                              db.byte.africa (internal only)
Monitoring        UptimeRobot (uptime) + Sentry (error tracking)
Logs              Winston (Node.js) + structured JSON logs
Environment       .env files + GitHub Secrets (CI/CD)
```

### 4.5 Third-Party Integrations

```
WhatsApp          wa.me deeplinks (no API key required for MVP)
Cloudinary        Image/video CDN + transformation
Mapbox            Property location maps
Resend            Transactional email (production)
PostHog           User analytics + feature flags
Sentry            Error monitoring (frontend + backend)
```

---

## 5. Folder Structure

### 5.1 Monorepo Root

```
byte-realestate/                     # Monorepo root
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                   # Lint, test, build on every PR
│   │   ├── deploy-staging.yml       # Auto-deploy develop → staging
│   │   └── deploy-production.yml    # Manual trigger → production
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── task.md
│   └── CODEOWNERS                   # Emmanuel owns /, infra/, .github/
├── frontend/                        # Next.js 14 app (see 5.2)
├── backend/                         # Node.js/Express API (see 5.3)
├── database/                        # Prisma schema + migrations (see 5.4)
├── infrastructure/                  # Docker + Nginx + CI configs
│   ├── docker-compose.yml           # Full stack local dev
│   ├── docker-compose.prod.yml      # Production overrides
│   ├── nginx/
│   │   ├── nginx.conf               # Main config
│   │   └── sites-available/
│   │       ├── app.byte.africa.conf
│   │       └── api.byte.africa.conf
│   └── scripts/
│       ├── setup.sh                 # Server bootstrap script
│       ├── deploy.sh                # Zero-downtime deploy script
│       └── backup-db.sh             # pg_dump + upload to R2
├── docs/
│   ├── ARCHITECTURE.md              # System design decisions (ADRs)
│   ├── API.md                       # API overview (links to Swagger)
│   ├── DATABASE.md                  # Schema rationale + ER diagram
│   ├── ONBOARDING.md                # New dev setup guide
│   └── adr/                         # Architecture Decision Records
│       ├── 001-monorepo.md
│       ├── 002-postgresql-over-mongodb.md
│       ├── 003-nextjs-app-router.md
│       └── 004-cloudinary-for-media.md
├── .editorconfig                    # Editor consistency
├── .gitignore
├── CHANGELOG.md                     # Updated per phase
├── CONTRIBUTING.md                  # PR and branch rules
└── README.md                        # Project overview + local setup
```

### 5.2 Frontend (`/frontend`)

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── og-image.png                 # Open Graph default image
│   └── robots.txt
├── src/
│   ├── app/                         # Next.js 14 App Router
│   │   ├── (public)/                # Route group: no auth required
│   │   │   ├── layout.tsx           # Public layout (navbar, footer)
│   │   │   ├── page.tsx             # Homepage (/)
│   │   │   ├── properties/
│   │   │   │   ├── page.tsx         # Browse all properties
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Single property detail
│   │   │   ├── developers/
│   │   │   │   ├── page.tsx         # Browse developers
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Developer public profile
│   │   │   └── search/
│   │   │       └── page.tsx         # Search results
│   │   ├── (auth)/                  # Route group: auth pages
│   │   │   ├── layout.tsx
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── forgot-password/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/             # Route group: requires auth
│   │   │   ├── layout.tsx           # Dashboard sidebar layout
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx         # Developer main dashboard
│   │   │   ├── listings/
│   │   │   │   ├── page.tsx         # My listings overview
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx     # Create listing form
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx # Edit listing
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx         # Views, likes, clicks per listing
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx         # Developer profile settings
│   │   ├── (admin)/                 # Route group: admin only
│   │   │   ├── layout.tsx
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx         # Admin overview
│   │   │   │   ├── developers/
│   │   │   │   │   └── page.tsx     # Verify / ban developers
│   │   │   │   ├── listings/
│   │   │   │   │   └── page.tsx     # Moderate listings
│   │   │   │   └── reports/
│   │   │   │       └── page.tsx     # User-submitted reports
│   │   ├── api/                     # Next.js API Routes (BFF layer only)
│   │   │   └── revalidate/
│   │   │       └── route.ts         # ISR revalidation webhook
│   │   ├── globals.css
│   │   ├── layout.tsx               # Root layout (fonts, providers)
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── layout/                  # Structural layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── DashboardSidebar.tsx
│   │   │   └── AdminSidebar.tsx
│   │   ├── property/                # Property-domain components
│   │   │   ├── PropertyCard.tsx     # Grid card (image, title, price, badges)
│   │   │   ├── PropertyGrid.tsx     # Responsive grid of PropertyCards
│   │   │   ├── PropertyDetail.tsx   # Full detail view
│   │   │   ├── PropertyMediaGallery.tsx
│   │   │   ├── PropertyBadge.tsx    # "For Sale", "Luxury", "Verified"
│   │   │   ├── WhatsAppCTA.tsx      # The most important button
│   │   │   ├── FavoriteButton.tsx
│   │   │   ├── ShareButton.tsx
│   │   │   ├── PropertyMap.tsx      # Mapbox pin
│   │   │   └── ScheduleVisitModal.tsx
│   │   ├── search/                  # Search & filter components
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   ├── FilterChips.tsx      # Active filters display
│   │   │   └── SearchResults.tsx
│   │   ├── developer/               # Developer-domain components
│   │   │   ├── DeveloperCard.tsx
│   │   │   ├── DeveloperProfile.tsx
│   │   │   ├── DeveloperRating.tsx
│   │   │   ├── VerifiedBadge.tsx
│   │   │   └── RateDevModal.tsx
│   │   ├── forms/                   # Reusable form components
│   │   │   ├── ListingForm.tsx      # Create / edit listing
│   │   │   ├── MediaUploader.tsx    # Drag-drop image/video upload
│   │   │   └── AppointmentForm.tsx
│   │   ├── dashboard/               # Developer dashboard widgets
│   │   │   ├── StatsCard.tsx
│   │   │   ├── ListingTable.tsx
│   │   │   ├── AnalyticsChart.tsx
│   │   │   └── NotificationFeed.tsx
│   │   └── common/                  # Generic reusable components
│   │       ├── LoadingSkeleton.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── SEOHead.tsx
│   │       ├── ImageWithFallback.tsx
│   │       └── Pagination.tsx
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts               # Auth state + actions
│   │   ├── useProperties.ts         # React Query: fetch properties
│   │   ├── useFavorites.ts          # Local + synced favorites
│   │   ├── useSearch.ts             # Search state + debounce
│   │   ├── useWhatsApp.ts           # Build wa.me deeplinks
│   │   ├── useGeolocation.ts        # User location for nearby search
│   │   └── useNotifications.ts
│   ├── lib/                         # Utilities and config
│   │   ├── api-client.ts            # Axios instance with interceptors
│   │   ├── auth.ts                  # JWT decode, token management
│   │   ├── constants.ts             # PROPERTY_CATEGORIES, REGIONS etc.
│   │   ├── formatters.ts            # formatPrice, formatDate, truncate
│   │   ├── validators.ts            # Zod schemas for frontend forms
│   │   └── whatsapp.ts              # WhatsApp deeplink builder
│   ├── store/                       # Zustand global state
│   │   ├── authStore.ts
│   │   ├── filterStore.ts
│   │   └── favoritesStore.ts
│   ├── types/                       # TypeScript type definitions
│   │   ├── property.ts
│   │   ├── developer.ts
│   │   ├── user.ts
│   │   ├── api.ts                   # API response shapes
│   │   └── index.ts                 # Re-exports
│   └── styles/
│       └── globals.css              # Tailwind directives + CSS vars
├── .env.local                       # Local dev env vars
├── .env.example                     # Committed env template
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

### 5.3 Backend (`/backend`)

```
backend/
├── src/
│   ├── app.ts                       # Express app factory
│   ├── server.ts                    # Server entry point
│   ├── config/
│   │   ├── env.ts                   # Zod-validated env config
│   │   ├── database.ts              # Prisma client singleton
│   │   ├── redis.ts                 # Redis client singleton
│   │   └── cloudinary.ts            # Cloudinary SDK config
│   ├── api/
│   │   ├── v1/
│   │   │   ├── index.ts             # v1 router mount
│   │   │   ├── auth/
│   │   │   │   ├── auth.router.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.schema.ts   # Zod request schemas
│   │   │   ├── properties/
│   │   │   │   ├── properties.router.ts
│   │   │   │   ├── properties.controller.ts
│   │   │   │   ├── properties.service.ts
│   │   │   │   └── properties.schema.ts
│   │   │   ├── developers/
│   │   │   │   ├── developers.router.ts
│   │   │   │   ├── developers.controller.ts
│   │   │   │   ├── developers.service.ts
│   │   │   │   └── developers.schema.ts
│   │   │   ├── search/
│   │   │   │   ├── search.router.ts
│   │   │   │   ├── search.controller.ts
│   │   │   │   └── search.service.ts
│   │   │   ├── favorites/
│   │   │   │   ├── favorites.router.ts
│   │   │   │   ├── favorites.controller.ts
│   │   │   │   └── favorites.service.ts
│   │   │   ├── ratings/
│   │   │   │   ├── ratings.router.ts
│   │   │   │   ├── ratings.controller.ts
│   │   │   │   └── ratings.service.ts
│   │   │   ├── appointments/
│   │   │   │   ├── appointments.router.ts
│   │   │   │   ├── appointments.controller.ts
│   │   │   │   └── appointments.service.ts
│   │   │   ├── uploads/
│   │   │   │   ├── uploads.router.ts
│   │   │   │   ├── uploads.controller.ts
│   │   │   │   └── uploads.service.ts
│   │   │   ├── notifications/
│   │   │   │   ├── notifications.router.ts
│   │   │   │   ├── notifications.controller.ts
│   │   │   │   └── notifications.service.ts
│   │   │   ├── analytics/
│   │   │   │   ├── analytics.router.ts
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   └── analytics.service.ts
│   │   │   └── admin/
│   │   │       ├── admin.router.ts
│   │   │       ├── admin.controller.ts
│   │   │       └── admin.service.ts
│   ├── middleware/
│   │   ├── authenticate.ts          # JWT verification
│   │   ├── authorize.ts             # Role-based access (DEVELOPER, ADMIN)
│   │   ├── validate.ts              # Zod schema validation middleware
│   │   ├── rateLimiter.ts           # express-rate-limit per IP/route
│   │   ├── errorHandler.ts          # Global error handler
│   │   ├── requestLogger.ts         # Winston HTTP request logging
│   │   └── multer.ts                # File upload middleware
│   ├── services/
│   │   ├── email.service.ts         # Nodemailer / Resend
│   │   ├── notification.service.ts  # DB notification + BullMQ jobs
│   │   ├── whatsapp.service.ts      # deeplink generation logic
│   │   └── analytics.service.ts    # Event tracking
│   ├── jobs/
│   │   ├── queue.ts                 # BullMQ queue setup
│   │   ├── workers/
│   │   │   ├── email.worker.ts
│   │   │   └── notification.worker.ts
│   │   └── schedulers/
│   │       └── analytics.scheduler.ts  # Daily analytics rollup
│   ├── utils/
│   │   ├── logger.ts                # Winston logger
│   │   ├── ApiError.ts              # Custom error class
│   │   ├── ApiResponse.ts           # Standard response wrapper
│   │   ├── pagination.ts            # Cursor/offset pagination helpers
│   │   └── slugify.ts
│   └── types/
│       ├── express.d.ts             # Express Request augmentation (req.user)
│       └── index.ts
├── tests/
│   ├── unit/
│   │   ├── properties.service.test.ts
│   │   ├── auth.service.test.ts
│   │   └── search.service.test.ts
│   └── integration/
│       ├── properties.api.test.ts
│       ├── auth.api.test.ts
│       └── search.api.test.ts
├── .env
├── .env.example
├── jest.config.ts
├── tsconfig.json
└── package.json
```

### 5.4 Database (`/database`)

```
database/
├── schema.prisma                    # Single source of truth for all models
├── migrations/                      # Auto-generated by Prisma Migrate
│   ├── 20240615000000_init/
│   ├── 20240618000000_add_favorites/
│   └── ...
├── seeds/
│   ├── index.ts                     # Seed runner
│   ├── developers.seed.ts           # Sample verified developers
│   ├── properties.seed.ts           # Sample listings (all categories)
│   └── admin.seed.ts                # Default admin account
└── docs/
    ├── ER_DIAGRAM.md               # Mermaid ER diagram
    └── INDEX_STRATEGY.md           # Which indexes, why
```

---

## 6. Engineering Standards & Rules

These rules are **non-negotiable**. Emmanuel enforces them at PR review. A PR that violates these rules is closed without merge until fixed.

### 6.1 Branch Strategy (Git Flow)

```
main          Production branch. Protected. Only Emmanuel merges here.
              Deploy to production on merge via GitHub Actions.

develop       Integration branch. Protected. All PRs target this branch.
              Auto-deploys to staging on merge.

feature/*     Feature branches. Branch off develop.
              Naming: feature/BYTE-{issue-number}-short-description
              Example: feature/BYTE-012-property-search-endpoint

fix/*         Bug fix branches.
              Naming: fix/BYTE-{issue-number}-short-description
              Example: fix/BYTE-023-fix-favorite-toggle-race-condition

chore/*       Non-feature work (configs, deps, docs).
              Naming: chore/BYTE-{issue-number}-short-description
              Example: chore/BYTE-005-setup-eslint-config

release/*     Release branches cut from develop before merging to main.
              Naming: release/v{major}.{minor}.{patch}
              Example: release/v1.0.0

hotfix/*      Critical production fixes only. Branch off main.
              Naming: hotfix/BYTE-{issue-number}-description
```

**Rules:**
- Never commit directly to `main` or `develop`. Always use PRs.
- Branch names must be lowercase, hyphen-separated.
- Delete feature branches after merge (GitHub setting: auto-delete head branches).

### 6.2 Commit Message Convention (Conventional Commits)

All commits must follow this format:

```
<type>(<scope>): <subject>

[optional body]

[optional footer: BYTE-{issue-number}]
```

**Types:**
```
feat      New feature
fix       Bug fix
docs      Documentation only
style     Formatting, no logic change
refactor  Code refactor, no new feature or bug fix
test      Adding or updating tests
chore     Build process, dependency updates, CI changes
perf      Performance improvement
revert    Reverts a previous commit
```

**Scopes:** `auth`, `properties`, `search`, `favorites`, `ratings`, `appointments`, `uploads`, `notifications`, `analytics`, `admin`, `frontend`, `backend`, `db`, `infra`, `ci`

**Examples:**
```bash
feat(properties): add property search by location and price range

fix(auth): refresh token not rotating on silent refresh

docs(db): add ER diagram to DATABASE.md

chore(ci): add Playwright E2E tests to CI pipeline

Refs: BYTE-024
```

**Rules:**
- Subject line max 72 characters.
- Subject line in imperative mood ("add", not "adds" or "added").
- No period at end of subject line.
- Body explains *why*, not *what*.
- Always include issue reference in footer.

### 6.3 Pull Request Rules

Every PR must have:

**Title format:** `[TYPE] BYTE-{issue}: Short description`
Example: `[FEAT] BYTE-012: Property search endpoint with filters`

**PR Body (use the template):**
```markdown
## Summary
What does this PR do? (2–3 sentences)

## Changes
- List of specific changes made

## Screenshots / Videos
(Required for all frontend PRs - show before/after or new UI)

## Testing
- [ ] Unit tests written and passing
- [ ] Tested locally end-to-end
- [ ] No regressions in related features

## Checklist
- [ ] Code follows naming conventions (see CONTRIBUTING.md)
- [ ] No `console.log` left in production code
- [ ] No hardcoded secrets or API keys
- [ ] `.env.example` updated if new env var added
- [ ] `CHANGELOG.md` entry added

Closes BYTE-{issue-number}
```

**Review rules:**
- Minimum 1 approval required (Emmanuel always reviews).
- CI must be green (lint + tests) before merge.
- No PRs merged on Friday afternoon (risk of weekend fires).
- PRs open for a maximum of 3 days - if stale, ping in WhatsApp.
- Max 400 lines changed per PR. Large PRs must be broken up.

### 6.4 Naming Conventions

**TypeScript / JavaScript:**
```
Variables & functions   camelCase        const propertyId, function formatPrice()
Constants               SCREAMING_SNAKE  const MAX_IMAGES_PER_LISTING = 10
Classes                 PascalCase       class PropertyService
Interfaces & Types      PascalCase       interface PropertyDto, type ApiResponse
Enums                   PascalCase       enum PropertyCategory
Files (components)      PascalCase       PropertyCard.tsx, WhatsAppCTA.tsx
Files (utils/hooks)     camelCase        useProperties.ts, formatters.ts
Files (routes/services) kebab-case       properties.service.ts, auth.router.ts
Boolean variables       is/has/can prefix isVerified, hasMedia, canEdit
```

**Database (PostgreSQL via Prisma):**
```
Tables/Models           PascalCase       Property, Developer, Appointment
Columns/Fields          camelCase        createdAt, whatsappNumber, listingType
Many-to-many tables     Descriptive      PropertyFavorite, DeveloperRating
IDs                     cuid()           Always use Prisma's cuid() for IDs
Indexes                 idx_{table}_{col} idx_property_location, idx_property_type
```

**CSS / Tailwind:**
```
Custom CSS classes      kebab-case       .property-card, .whatsapp-cta-btn
CSS variables           --byte-{name}    --byte-primary, --byte-surface
```

**API Endpoints:**
```
REST pattern            /api/v1/{resource}/{id}/{sub-resource}
Resources               plural nouns     /properties, /developers, /favorites
Actions                 HTTP verbs       GET (read), POST (create), PATCH (update), DELETE
Query params            camelCase        ?priceMin=50000&listingType=SALE&page=2
```

### 6.5 Code Quality Rules

```
1.  No `any` in TypeScript. Use `unknown` and narrow, or define proper types.
2.  No `console.log` in committed code. Use the Winston logger.
3.  No hardcoded strings. Use constants files.
4.  No hardcoded secrets. All secrets in .env, validated via Zod at startup.
5.  All API endpoints must have Zod-validated request schemas.
6.  All service functions must handle errors and throw typed ApiError instances.
7.  All async functions must have try/catch or be wrapped in an error handler.
8.  No direct database queries in controllers. Controller → Service → Database.
9.  React components must not call the API directly. Use custom hooks or React Query.
10. Every exported function/component must have a JSDoc comment (one-liner minimum).
11. Test coverage minimum: 70% for backend services, 60% for frontend components.
12. No commented-out code committed to main or develop.
```

### 6.6 Security Rules

```
1. Passwords hashed with bcrypt (rounds: 12 minimum).
2. JWT access tokens expire in 15 minutes. Refresh tokens in 7 days.
3. Refresh tokens stored in HttpOnly cookies, not localStorage.
4. All file uploads scanned for type (MIME check, not just extension).
5. Maximum file upload size: 10MB per image, 50MB per video.
6. Rate limiting on all auth endpoints (5 requests/minute per IP).
7. Rate limiting on all public endpoints (100 requests/minute per IP).
8. SQL injection: impossible via Prisma ORM parameterized queries. Never raw SQL.
9. XSS: Next.js escapes by default. Never use dangerouslySetInnerHTML.
10. CORS: whitelist only known frontend domains.
11. Helmet.js on all Express routes.
12. Admin routes protected by both JWT auth AND role check (ADMIN role).
13. Developers can only modify their own listings (ownership check in service layer).
14. WhatsApp numbers never exposed in HTML source (rendered client-side only, 
    after user interaction, to reduce scraping).
```

### 6.7 Performance Rules

```
1. All property listing API responses paginated (default page size: 20, max: 50).
2. Images served via Cloudinary CDN with automatic format (WebP where supported).
3. Images lazy-loaded on listing grids. Only above-fold images eager-loaded.
4. Next.js Image component used for all images - never raw <img> tags.
5. React Query stale-time: 60 seconds for property lists, 5 minutes for developer profiles.
6. API responses cached in Redis for hot endpoints (browse page: 30s TTL).
7. Database: index all foreign keys, all filterable columns, all searchable fields.
8. No N+1 queries. Use Prisma `include` to eager-load relations.
9. Mobile: never load more than 20 properties per page.
10. Lighthouse performance score target: ≥ 85 on mobile.
```

---

## 7. GitHub Project Setup

### 7.1 Repository Setup

```bash
# Create the monorepo
mkdir byte-realestate && cd byte-realestate
git init
git remote add origin https://github.com/byte-africa/byte-realestate.git

# Initialize workspaces
npm init -y
# Configure package.json workspaces:
# "workspaces": ["frontend", "backend", "database"]

# First commit
git add .
git commit -m "chore(repo): initialize monorepo structure"
git branch -M main
git push -u origin main

# Create develop branch
git checkout -b develop
git push -u origin develop
```

### 7.2 Branch Protection Rules (GitHub Settings)

**For `main`:**
```
✅ Require a pull request before merging
✅ Require approvals: 1 (Emmanuel)
✅ Dismiss stale PR approvals when new commits are pushed
✅ Require status checks to pass: ci / lint, ci / test, ci / build
✅ Require branches to be up to date before merging
✅ Restrict who can push: Emmanuel only
❌ Allow force pushes
❌ Allow deletions
```

**For `develop`:**
```
✅ Require a pull request before merging
✅ Require approvals: 1
✅ Require status checks to pass: ci / lint, ci / test
✅ Require branches to be up to date before merging
❌ Allow force pushes
❌ Allow deletions
```

### 7.3 GitHub Project Board

**Board name:** ByTe Real Estate - Sprint Board

**Columns:**
```
📋 Backlog → 🔄 In Progress → 👀 In Review → ✅ Done → 🚫 Blocked
```

**Custom Fields:**
```
Field          Type         Values
Phase          Select       Phase 1, Phase 2, Phase 3, Phase 4
Priority       Select       🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low
Assignee       Person       Emmanuel, Clement, Albert, Claude
Story Points   Number       1, 2, 3, 5, 8, 13
Week           Select       Week 1, Week 2, Week 3, Week 4
```

### 7.4 Labels

```
# Type
feature         #0075ca    New feature
bug             #d73a4a    Bug fix
documentation   #0075ca    Documentation
chore           #e4e669    Maintenance
test            #bfd4f2    Tests

# Domain
auth            #7057ff    Authentication
properties      #d4c5f9    Property features
search          #c2e0c6    Search & filter
developers      #f9d0c4    Developer features
admin           #fef2c0    Admin panel
database        #e99695    Database work
infrastructure  #c5def5    DevOps / infra
frontend        #bfd4f2    Frontend work
backend         #d4c5f9    Backend work

# Priority
priority:critical   #b60205
priority:high       #d93f0b
priority:medium     #e4e669
priority:low        #0e8a16

# Status
blocked         #e11d48    Blocked by dependency
needs-review    #7c3aed    Awaiting PR review
v2-backlog      #94a3b8    Deferred to version 2
```

---

## 8. Phase 1 - Foundation & Architecture (Week 1: Jun 15–21)

**Goal:** Every engineer can run the full stack locally. CI/CD is green. Database is live. No features yet - only infrastructure, scaffolding, and conventions.

**Phase owner:** Emmanuel (all infrastructure tasks), Clement (schema), Albert (backend scaffold), Claude (frontend scaffold)

**Milestone:** `Phase 1 - Foundation` (due Jun 21)

### Tasks

```
BYTE-001  [INFRA] Initialize monorepo, workspaces, .gitignore, README
          Owner: Emmanuel | Points: 2 | Priority: 🔴 Critical

BYTE-002  [INFRA] Configure ESLint + Prettier for frontend and backend
          Owner: Emmanuel | Points: 2 | Priority: 🔴 Critical

BYTE-003  [INFRA] Set up GitHub Actions CI: lint + test + build on PR
          Owner: Emmanuel | Points: 3 | Priority: 🔴 Critical

BYTE-004  [INFRA] Docker Compose: PostgreSQL + Redis + backend + frontend services
          Owner: Emmanuel | Points: 3 | Priority: 🔴 Critical

BYTE-005  [INFRA] Nginx config: reverse proxy for api.byte.africa + app.byte.africa
          Owner: Emmanuel | Points: 2 | Priority: 🟠 High

BYTE-006  [DB]   Design and write Prisma schema (all models - see Section 14)
          Owner: Clement | Points: 5 | Priority: 🔴 Critical

BYTE-007  [DB]   Run initial Prisma migration and verify schema in PostgreSQL
          Owner: Clement | Points: 2 | Priority: 🔴 Critical

BYTE-008  [DB]   Write seed scripts: 3 sample developers, 10 sample properties
          Owner: Clement | Points: 3 | Priority: 🟠 High

BYTE-009  [DB]   Document index strategy in /database/docs/INDEX_STRATEGY.md
          Owner: Clement | Points: 2 | Priority: 🟡 Medium

BYTE-010  [BE]   Scaffold Express + TypeScript backend with config, logger, error handler
          Owner: Albert | Points: 3 | Priority: 🔴 Critical

BYTE-011  [BE]   Implement JWT auth: register, login, refresh token, logout
          Owner: Albert | Points: 5 | Priority: 🔴 Critical

BYTE-012  [BE]   Implement middleware: authenticate, authorize, validate, rateLimiter
          Owner: Albert | Points: 3 | Priority: 🔴 Critical

BYTE-013  [BE]   Configure Cloudinary SDK + upload endpoint (images + video)
          Owner: Albert | Points: 3 | Priority: 🟠 High

BYTE-014  [BE]   Configure BullMQ + Redis queue + email worker
          Owner: Albert | Points: 3 | Priority: 🟡 Medium

BYTE-015  [FE]   Scaffold Next.js 14 App Router project with TypeScript + Tailwind + shadcn
          Owner: Claude | Points: 3 | Priority: 🔴 Critical

BYTE-016  [FE]   Set up Zustand stores (auth, filters, favorites)
          Owner: Claude | Points: 2 | Priority: 🟠 High

BYTE-017  [FE]   Set up React Query + Axios API client with interceptors + token refresh
          Owner: Claude | Points: 3 | Priority: 🔴 Critical

BYTE-018  [FE]   Build Navbar, Footer, and root layout (responsive, mobile-first)
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-019  [DOCS] Write ARCHITECTURE.md, ONBOARDING.md, CONTRIBUTING.md
          Owner: Emmanuel | Points: 3 | Priority: 🟠 High
```

### Phase 1 Acceptance Criteria

```
✅ `docker compose up` starts all services with no errors
✅ PostgreSQL schema created and seed data loads without errors
✅ POST /api/v1/auth/register returns 201 with JWT tokens
✅ POST /api/v1/auth/login returns 200 with JWT tokens
✅ GET /api/v1/auth/me returns user profile with valid JWT
✅ CI pipeline green on first push to develop
✅ Next.js runs on localhost:3000 with Navbar and Footer visible
✅ Tailwind and shadcn/ui components render correctly
✅ All engineers have confirmed local stack runs on their machine
```

---

## 9. Phase 2 - Core Backend & Database (Week 2: Jun 22–28)

**Goal:** All backend API endpoints are built, tested, and documented. A developer can create a verified profile, upload a listing with images, and a user can browse and search listings via the API.

**Phase owner:** Albert (all API endpoints), Clement (query optimization + advanced schema work)

**Milestone:** `Phase 2 - Core API` (due Jun 28)

### Tasks

```
BYTE-020  [BE]   Properties CRUD: create, read (list + single), update, delete
          Owner: Albert | Points: 5 | Priority: 🔴 Critical

BYTE-021  [BE]   Property image/video upload: multi-file, Cloudinary, return URLs
          Owner: Albert | Points: 3 | Priority: 🔴 Critical

BYTE-022  [BE]   Property search endpoint: full-text + filters (location, price, type, category)
          Owner: Albert | Points: 5 | Priority: 🔴 Critical

BYTE-023  [BE]   Developer profile CRUD: create, read (public profile), update
          Owner: Albert | Points: 3 | Priority: 🔴 Critical

BYTE-024  [BE]   Developer verification: admin marks developer as verified
          Owner: Albert | Points: 2 | Priority: 🟠 High

BYTE-025  [BE]   Favorites: add/remove property to favorites (auth required), list favorites
          Owner: Albert | Points: 3 | Priority: 🟠 High

BYTE-026  [BE]   Ratings: submit rating for developer (1–5 stars + comment)
          Owner: Albert | Points: 3 | Priority: 🟠 High

BYTE-027  [BE]   Appointments: schedule visit (no auth required), list for developer
          Owner: Albert | Points: 3 | Priority: 🟠 High

BYTE-028  [BE]   Notifications: create + list notifications for developer (liked, viewed)
          Owner: Albert | Points: 3 | Priority: 🟠 High

BYTE-029  [BE]   Analytics: record property view event, record WhatsApp click event
          Owner: Albert | Points: 3 | Priority: 🟡 Medium

BYTE-030  [BE]   Analytics: GET /analytics/properties/{id} - views, likes, whatsapp clicks
          Owner: Albert | Points: 3 | Priority: 🟡 Medium

BYTE-031  [BE]   Admin endpoints: list/approve/ban developers, moderate listings, view reports
          Owner: Albert | Points: 5 | Priority: 🟠 High

BYTE-032  [BE]   Reports: user submits report on listing or developer
          Owner: Albert | Points: 2 | Priority: 🟡 Medium

BYTE-033  [BE]   WhatsApp deeplink generation endpoint (server-side, masks raw number)
          Owner: Albert | Points: 2 | Priority: 🟠 High

BYTE-034  [BE]   Email notifications: appointment confirmation, new appointment to developer
          Owner: Albert | Points: 3 | Priority: 🟡 Medium

BYTE-035  [BE]   Swagger/OpenAPI docs auto-generated and live at /api/docs
          Owner: Albert | Points: 2 | Priority: 🟠 High

BYTE-036  [BE]   Write unit tests for all service functions (target: 70% coverage)
          Owner: Albert | Points: 5 | Priority: 🟠 High

BYTE-037  [DB]   Add PostgreSQL full-text search index on properties (title, description, location)
          Owner: Clement | Points: 3 | Priority: 🔴 Critical

BYTE-038  [DB]   Add composite indexes: (listingType, category), (priceMin, priceMax), (status)
          Owner: Clement | Points: 2 | Priority: 🟠 High

BYTE-039  [DB]   Add migration: property status enum (ACTIVE, RESERVED, SOLD, DRAFT)
          Owner: Clement | Points: 2 | Priority: 🟠 High

BYTE-040  [DB]   Optimize: ensure no N+1 queries on property list endpoint (EXPLAIN ANALYZE)
          Owner: Clement | Points: 3 | Priority: 🟠 High
```

### Phase 2 Acceptance Criteria

```
✅ GET /api/v1/properties returns paginated list with filters working
✅ POST /api/v1/properties creates listing with uploaded images on Cloudinary
✅ GET /api/v1/properties/search?q=accra&priceMax=500000 returns relevant results
✅ POST /api/v1/favorites/{propertyId} toggles favorite (auth required)
✅ POST /api/v1/ratings/{developerId} saves rating and updates developer avg rating
✅ POST /api/v1/appointments creates appointment (no auth required)
✅ GET /api/v1/notifications returns developer's notification feed
✅ Admin endpoint: PATCH /api/v1/admin/developers/{id}/verify works
✅ Swagger UI accessible at /api/docs with all endpoints documented
✅ Jest coverage report: ≥ 70% on service layer
✅ No endpoint returns unhandled 500 errors on valid input
```

---

## 10. Phase 3 - Frontend & Integration (Week 3: Jun 29–Jul 5)

**Goal:** All user-facing pages built and wired to the live backend API. A real user can browse properties, contact a developer on WhatsApp, save favorites, and schedule a visit - all from the web app.

**Phase owner:** Claude (all frontend), Albert (API fixes as Claude reports integration issues)

**Milestone:** `Phase 3 - Frontend MVP` (due Jul 5)

### Tasks

```
BYTE-041  [FE]   Homepage: hero search bar, featured properties grid, category shortcuts
          Owner: Claude | Points: 5 | Priority: 🔴 Critical

BYTE-042  [FE]   Property browse page: grid with filters sidebar (mobile: bottom sheet)
          Owner: Claude | Points: 5 | Priority: 🔴 Critical

BYTE-043  [FE]   Property detail page: media gallery, description, price, location map, 
                 WhatsApp CTA, favorite, share, schedule visit button
          Owner: Claude | Points: 8 | Priority: 🔴 Critical

BYTE-044  [FE]   WhatsApp CTA component: build deeplink, track click event, open wa.me
          Owner: Claude | Points: 3 | Priority: 🔴 Critical

BYTE-045  [FE]   Search page: search results, active filter chips, sort options
          Owner: Claude | Points: 5 | Priority: 🔴 Critical

BYTE-046  [FE]   Schedule visit modal: date/time picker, name/contact form, submit to API
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-047  [FE]   Developer public profile page: bio, listings, ratings, verified badge, 
                 WhatsApp contact
          Owner: Claude | Points: 5 | Priority: 🔴 Critical

BYTE-048  [FE]   Rate developer modal: 1–5 star rating + optional comment
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-049  [FE]   Auth pages: Login, Register, Forgot Password (with form validation)
          Owner: Claude | Points: 5 | Priority: 🔴 Critical

BYTE-050  [FE]   Developer dashboard: stats cards (views, likes, contacts this week)
          Owner: Claude | Points: 5 | Priority: 🔴 Critical

BYTE-051  [FE]   Create listing form: multi-step (details → media upload → location → preview)
          Owner: Claude | Points: 8 | Priority: 🔴 Critical

BYTE-052  [FE]   My listings page: table with status, views, likes, edit/delete/toggle status
          Owner: Claude | Points: 5 | Priority: 🟠 High

BYTE-053  [FE]   Edit listing page: pre-filled form, image management (add/remove)
          Owner: Claude | Points: 5 | Priority: 🟠 High

BYTE-054  [FE]   Notifications page: developer notification feed (liked, appointment booked)
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-055  [FE]   Developer analytics page: views chart (7d / 30d), top listings, WhatsApp clicks
          Owner: Claude | Points: 5 | Priority: 🟠 High

BYTE-056  [FE]   Admin panel: developer verification queue, listing moderation, reports list
          Owner: Claude | Points: 5 | Priority: 🟠 High

BYTE-057  [FE]   Favorites page (user account): saved properties grid
          Owner: Claude | Points: 3 | Priority: 🟡 Medium

BYTE-058  [FE]   Share feature: native share API on mobile, copy link on desktop
          Owner: Claude | Points: 2 | Priority: 🟡 Medium

BYTE-059  [FE]   Property map view: Mapbox pins for browse page (list/map toggle)
          Owner: Claude | Points: 5 | Priority: 🟡 Medium

BYTE-060  [FE]   SEO: metadata per page, Open Graph tags, next-sitemap config
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-061  [FE]   Skeleton loading states for all data-fetching components
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-062  [FE]   Error states: empty state illustrations, retry buttons, error boundaries
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-063  [FE]   Lighthouse audit: fix all issues to hit ≥ 85 on mobile
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-064  [FE]   Write React Testing Library tests for critical components (WhatsApp CTA,
                 ListingForm, SearchBar, PropertyCard)
          Owner: Claude | Points: 5 | Priority: 🟠 High
```

### Phase 3 Acceptance Criteria

```
✅ A visitor can browse properties from the homepage without an account
✅ Search by location + price range returns relevant results with ≤ 1s response
✅ Clicking WhatsApp CTA opens WhatsApp with pre-filled property message
✅ Property detail page scores ≥ 85 on Lighthouse mobile
✅ Developer can log in, create a listing with 5 photos, see it live within 60 seconds
✅ Developer dashboard shows accurate view/like counts from the last 7 days
✅ Admin can log in and verify a developer account
✅ All forms show inline validation errors before submission
✅ All pages render correctly on 375px (iPhone SE) viewport
✅ Share button copies URL to clipboard and shows success toast
✅ Favorites persisted across page refreshes (React Query + localStorage fallback)
```

---

## 11. Phase 4 - Polish, Testing & Deployment (Week 4: Jul 6–13)

**Goal:** Production deployment is live. All critical paths are covered by automated tests. Performance is validated. The platform is ready for real users.

**Phase owner:** Emmanuel (deployment, CI/CD, monitoring), Albert (bug fixes, integration tests), Claude (E2E tests, final polish), Clement (production DB tuning + backup)

**Milestone:** `Phase 4 - Production Launch` (due Jul 13)

### Tasks

```
BYTE-065  [INFRA] Provision VPS (Hetzner/DigitalOcean): Ubuntu 22.04, configure firewall
          Owner: Emmanuel | Points: 3 | Priority: 🔴 Critical

BYTE-066  [INFRA] Deploy PostgreSQL + Redis in Docker on VPS
          Owner: Emmanuel | Points: 3 | Priority: 🔴 Critical

BYTE-067  [INFRA] Deploy backend API container, configure environment secrets
          Owner: Emmanuel | Points: 3 | Priority: 🔴 Critical

BYTE-068  [INFRA] Deploy Next.js frontend (Docker or Vercel - evaluate cost)
          Owner: Emmanuel | Points: 3 | Priority: 🔴 Critical

BYTE-069  [INFRA] Configure Nginx: SSL via Certbot, HTTPS redirect, gzip, security headers
          Owner: Emmanuel | Points: 3 | Priority: 🔴 Critical

BYTE-070  [INFRA] Set up GitHub Actions: auto-deploy develop → staging on merge
          Owner: Emmanuel | Points: 3 | Priority: 🔴 Critical

BYTE-071  [INFRA] Set up GitHub Actions: manual deploy main → production
          Owner: Emmanuel | Points: 2 | Priority: 🔴 Critical

BYTE-072  [INFRA] Configure Sentry for frontend and backend error tracking
          Owner: Emmanuel | Points: 2 | Priority: 🟠 High

BYTE-073  [INFRA] Configure UptimeRobot: monitor /api/health every 5 minutes
          Owner: Emmanuel | Points: 1 | Priority: 🟠 High

BYTE-074  [INFRA] Write and test pg_dump backup script, schedule as daily cron
          Owner: Clement | Points: 3 | Priority: 🟠 High

BYTE-075  [DB]   Production database: run migrations, seed initial admin account
          Owner: Clement | Points: 2 | Priority: 🔴 Critical

BYTE-076  [DB]   Run EXPLAIN ANALYZE on all production queries, fix any slow queries
          Owner: Clement | Points: 3 | Priority: 🟠 High

BYTE-077  [BE]   Write integration tests for all critical API flows
          Owner: Albert | Points: 5 | Priority: 🟠 High

BYTE-078  [BE]   Load test with k6: 200 concurrent users, p95 < 800ms on browse endpoint
          Owner: Albert | Points: 3 | Priority: 🟠 High

BYTE-079  [BE]   Fix all bugs reported during Phase 3 integration
          Owner: Albert | Points: 5 | Priority: 🔴 Critical

BYTE-080  [FE]   Write Playwright E2E tests: browse → property detail → WhatsApp CTA flow
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-081  [FE]   Write Playwright E2E test: developer register → create listing → go live
          Owner: Claude | Points: 3 | Priority: 🟠 High

BYTE-082  [FE]   Final UI polish pass: spacing, typography, color consistency
          Owner: Claude | Points: 3 | Priority: 🟡 Medium

BYTE-083  [FE]   Implement PostHog analytics: pageview, property_view, whatsapp_click events
          Owner: Claude | Points: 2 | Priority: 🟡 Medium

BYTE-084  [FE]   Test on real Android device (mid-range, 3G simulation in DevTools)
          Owner: Claude | Points: 2 | Priority: 🟠 High

BYTE-085  [DOCS] Write API documentation (final Swagger review + README update)
          Owner: Albert | Points: 2 | Priority: 🟡 Medium

BYTE-086  [DOCS] Update CHANGELOG.md with all Phase 1–4 changes
          Owner: Emmanuel | Points: 2 | Priority: 🟡 Medium

BYTE-087  [INFRA] Domain setup: configure DNS records for byte.africa subdomains
          Owner: Emmanuel | Points: 2 | Priority: 🔴 Critical

BYTE-088  [QA]   Full end-to-end smoke test on production URL (all critical user paths)
          Owner: Emmanuel | Points: 3 | Priority: 🔴 Critical
```

### Phase 4 Acceptance Criteria

```
✅ app.byte.africa and api.byte.africa live with valid SSL certificates
✅ HTTPS enforced (HTTP → HTTPS redirect active)
✅ GET /api/health returns 200 in < 200ms from production
✅ All Playwright E2E tests passing on CI against staging
✅ Load test: p95 < 800ms at 200 concurrent users on browse endpoint
✅ Sentry capturing errors in both frontend and backend
✅ UptimeRobot alert configured and tested
✅ pg_dump backup runs daily and file confirmed in R2/S3
✅ Lighthouse mobile score ≥ 85 on production URL
✅ Developer can create account and publish listing in < 5 minutes
✅ User can browse, find, and WhatsApp a developer in < 2 minutes
✅ Admin can verify developer and it appears on their profile immediately
✅ No known P1/P2 bugs open at launch
```

---

## 12. GitHub Issues Registry

Below is the full registry of all 88 issues. Create these in GitHub before Week 1 Day 1.

```
ISSUE BYTE-001
Title:     [INFRA] Initialize monorepo, workspaces, .gitignore, base README
Labels:    chore, infrastructure, priority:critical
Phase:     Phase 1
Week:      Week 1
Assignee:  Emmanuel
Points:    2
Milestone: Phase 1 - Foundation (Jun 21)
Body:
  ## Acceptance Criteria
  - Monorepo root created with /frontend /backend /database /infrastructure /docs
  - npm workspaces configured in root package.json
  - .gitignore covers Node, Python, .env files, build artifacts
  - README.md includes: project description, local setup steps, team structure
  - First commit merged to main

──────────────────────────────────────────────────────────

ISSUE BYTE-002
Title:     [INFRA] Configure ESLint + Prettier for frontend and backend
Labels:    chore, infrastructure, priority:critical
Phase:     Phase 1
Week:      Week 1
Assignee:  Emmanuel
Points:    2
Milestone: Phase 1 - Foundation (Jun 21)
Body:
  ## Acceptance Criteria
  - ESLint configured in /frontend with next/core-web-vitals + TypeScript rules
  - ESLint configured in /backend with TypeScript strict rules
  - Prettier configured at root level, shared across workspaces
  - `npm run lint` passes with zero errors in both workspaces
  - `npm run format` auto-formats code consistently

──────────────────────────────────────────────────────────

ISSUE BYTE-003
Title:     [INFRA] Set up GitHub Actions CI: lint + test + build on every PR
Labels:    chore, infrastructure, priority:critical
Phase:     Phase 1
Week:      Week 1
Assignee:  Emmanuel
Points:    3
Milestone: Phase 1 - Foundation (Jun 21)
Body:
  ## Acceptance Criteria
  - .github/workflows/ci.yml created
  - Pipeline runs on: push to develop, any PR targeting develop or main
  - Jobs: lint (frontend + backend), test (backend Jest, frontend Vitest), build (Next.js)
  - PR is blocked from merge if any job fails
  - Cache: node_modules cached by package-lock.json hash

──────────────────────────────────────────────────────────

ISSUE BYTE-004
Title:     [INFRA] Docker Compose: PostgreSQL + Redis + backend + frontend services
Labels:    chore, infrastructure, priority:critical
Phase:     Phase 1
Week:      Week 1
Assignee:  Emmanuel
Points:    3
Milestone: Phase 1 - Foundation (Jun 21)
Body:
  ## Acceptance Criteria
  - docker-compose.yml defines: postgres, redis, backend (Node), frontend (Next.js)
  - `docker compose up` starts all services without errors
  - Postgres data persisted via named volume
  - Backend can connect to Postgres and Redis at service hostnames
  - Frontend can reach backend via NEXT_PUBLIC_API_URL
  - Hot-reload works for both frontend and backend in development mode

──────────────────────────────────────────────────────────

ISSUE BYTE-006
Title:     [DB] Design and write full Prisma schema (all models)
Labels:    database, priority:critical
Phase:     Phase 1
Week:      Week 1
Assignee:  Clement
Points:    5
Milestone: Phase 1 - Foundation (Jun 21)
Body:
  ## Models Required
  - User (id, email, passwordHash, role, createdAt, updatedAt)
  - DeveloperProfile (id, userId, businessName, whatsappNumber, bio, logoUrl, 
    isVerified, verifiedAt, averageRating, totalRatings, plan, createdAt)
  - Property (id, developerId, title, slug, description, category, listingType,
    price, priceNegotiable, address, city, region, latitude, longitude, status,
    isFeatured, viewCount, whatsappClickCount, createdAt, updatedAt)
  - PropertyMedia (id, propertyId, url, publicId, mediaType, isPrimary, order)
  - PropertyFavorite (id, userId, propertyId, createdAt)
  - DeveloperRating (id, raterId, developerId, score, comment, createdAt)
  - Appointment (id, propertyId, developerId, guestName, guestPhone, guestEmail,
    preferredDate, notes, status, createdAt)
  - Notification (id, developerId, type, title, message, isRead, metadata, createdAt)
  - PropertyAnalytics (id, propertyId, date, views, whatsappClicks, favorites)
  - Report (id, reporterId, targetType, targetId, reason, description, status, createdAt)
  - RefreshToken (id, userId, token, expiresAt, createdAt)
  ## Acceptance Criteria
  - schema.prisma committed to /database
  - All relations correctly defined (1:1, 1:N, N:M)
  - Enums: Role, PropertyCategory, ListingType, PropertyStatus, MediaType,
    AppointmentStatus, NotificationType, ReportStatus, DeveloperPlan
  - All models reviewed and approved by Emmanuel before migration

──────────────────────────────────────────────────────────

ISSUE BYTE-011
Title:     [BE] JWT auth: register, login, refresh token, logout
Labels:    backend, auth, priority:critical
Phase:     Phase 1
Week:      Week 1
Assignee:  Albert
Points:    5
Milestone: Phase 1 - Foundation (Jun 21)
Body:
  ## Endpoints Required
  - POST /api/v1/auth/register - creates User + DeveloperProfile, returns tokens
  - POST /api/v1/auth/login - validates credentials, returns access + refresh tokens
  - POST /api/v1/auth/refresh - validates refresh token (HttpOnly cookie), returns new access token
  - POST /api/v1/auth/logout - invalidates refresh token
  - GET  /api/v1/auth/me - returns current user profile (auth required)
  ## Acceptance Criteria
  - Access token: 15-minute expiry, JWT signed with RS256 or HS256 (document decision)
  - Refresh token: 7-day expiry, stored in DB, sent as HttpOnly cookie
  - Passwords hashed with bcrypt (12 rounds)
  - Duplicate email returns 409 Conflict with meaningful error message
  - Invalid credentials return 401 (never distinguish between bad email or bad password)
  - Postman collection updated with auth endpoints

──────────────────────────────────────────────────────────

ISSUE BYTE-020
Title:     [BE] Properties CRUD: create, list (paginated), get by ID/slug, update, delete
Labels:    backend, properties, priority:critical
Phase:     Phase 2
Week:      Week 2
Assignee:  Albert
Points:    5
Milestone: Phase 2 - Core API (Jun 28)
Body:
  ## Endpoints Required
  - GET    /api/v1/properties - paginated list, filterable (see schema)
  - GET    /api/v1/properties/:id - single property (increments view count)
  - GET    /api/v1/properties/slug/:slug - by slug (for SEO-friendly URLs)
  - POST   /api/v1/properties - create (DEVELOPER role required)
  - PATCH  /api/v1/properties/:id - update (owner only)
  - DELETE /api/v1/properties/:id - soft delete (owner or ADMIN)
  ## Query Params for GET /properties
  - page, limit, listingType (SALE|RENT), category, priceMin, priceMax,
    city, region, status, isFeatured, developerId, sortBy (createdAt|price|viewCount)
  ## Acceptance Criteria
  - Pagination returns: data[], total, page, limit, totalPages
  - Slug auto-generated from title on create (unique, url-safe)
  - Developer can only update/delete their own properties (return 403 otherwise)
  - ACTIVE listings returned for public; DRAFT only returned to owner
  - Response includes: developer profile (partial), primary media URL, all filters applied

──────────────────────────────────────────────────────────

ISSUE BYTE-022
Title:     [BE] Property search endpoint: full-text + filters
Labels:    backend, search, priority:critical
Phase:     Phase 2
Week:      Week 2
Assignee:  Albert
Points:    5
Milestone: Phase 2 - Core API (Jun 28)
Body:
  ## Endpoint
  GET /api/v1/search/properties?q={query}&{filters}
  ## Acceptance Criteria
  - Full-text search using PostgreSQL tsvector on title + description + address
  - Supports all filters from BYTE-020 in combination with text query
  - Returns relevance-ranked results when ?q= is present
  - Returns filter-sorted results when ?q= is absent
  - Response time: < 500ms for any query (enforced by index - see BYTE-037)
  - Supports fuzzy matching for common typos (e.g., "appartment" → "apartment")
  - Empty query returns all properties (acts as browse endpoint with filters)

──────────────────────────────────────────────────────────

ISSUE BYTE-043
Title:     [FE] Property detail page: complete implementation
Labels:    frontend, properties, priority:critical
Phase:     Phase 3
Week:      Week 3
Assignee:  Claude
Points:    8
Milestone: Phase 3 - Frontend MVP (Jul 5)
Body:
  ## Page: /properties/[id]
  ## Sections Required
  - Media gallery (swipeable on mobile, lightbox on desktop)
  - Property title, price (formatted), listing type badge, category badge
  - Description (expandable if > 300 chars)
  - Property details grid: bedrooms, bathrooms, size, year
  - Location section: full address + Mapbox pin
  - Developer info card: avatar, name, verified badge, rating, WhatsApp CTA
  - Favorite toggle button (heart icon)
  - Share button (native share API)
  - "Schedule Visit" button → opens modal (BYTE-046)
  - Similar properties section (3 related listings, same city + category)
  ## Acceptance Criteria
  - Page server-side rendered (Next.js SSR or ISR with 60s revalidation) for SEO
  - WhatsApp CTA visible without scroll on mobile (sticky or prominent placement)
  - Media gallery shows at least 1 placeholder image when no media uploaded
  - Lighthouse mobile score ≥ 85 on this page specifically
  - Open Graph meta tags populated from property data
  - "Copied!" toast when share link copied to clipboard

──────────────────────────────────────────────────────────

ISSUE BYTE-051
Title:     [FE] Create listing form: multi-step wizard
Labels:    frontend, properties, priority:critical
Phase:     Phase 3
Week:      Week 3
Assignee:  Claude
Points:    8
Milestone: Phase 3 - Frontend MVP (Jul 5)
Body:
  ## Steps
  Step 1 - Basic Info: title, listing type (Sale/Rent), category, price, negotiable toggle
  Step 2 - Description: rich textarea for description, amenities checklist
  Step 3 - Media: drag-drop image upload (up to 10), video URL (optional), reorder images
  Step 4 - Location: address, city, region, map pin placement (Mapbox)
  Step 5 - Preview + Publish: summary of all data, "Save as Draft" or "Publish" buttons
  ## Acceptance Criteria
  - Progress indicator shows current step (1 of 5)
  - Each step validates before proceeding to the next
  - Back button does not lose data from previous step
  - Images uploaded to Cloudinary as they are added (not on final submit)
  - Draft saved to localStorage if user navigates away accidentally
  - Form state managed with React Hook Form + Zod
  - After publish: redirect to new property page with success toast

──────────────────────────────────────────────────────────

ISSUE BYTE-065
Title:     [INFRA] Provision VPS and configure Ubuntu 22.04 server
Labels:    infrastructure, priority:critical
Phase:     Phase 4
Week:      Week 4
Assignee:  Emmanuel
Points:    3
Milestone: Phase 4 - Production Launch (Jul 13)
Body:
  ## Acceptance Criteria
  - VPS provisioned (Hetzner CX31 or DigitalOcean 4GB Droplet)
  - Ubuntu 22.04 LTS, fully updated
  - Non-root deploy user created with sudo privileges
  - SSH key-only authentication (password auth disabled)
  - UFW firewall: allow only 22 (SSH), 80 (HTTP), 443 (HTTPS), block all else
  - Docker + Docker Compose installed and working
  - /infrastructure/scripts/setup.sh committed and tested end-to-end
```

---

## 13. Milestone Checklist

```
□  PHASE 1 DONE (Jun 21)
   └─ Monorepo running locally for all 4 engineers ✓
   └─ PostgreSQL schema migrated + seed data loads ✓
   └─ JWT auth endpoints working (register, login, refresh) ✓
   └─ CI pipeline green on first PR ✓
   └─ Next.js frontend running on localhost:3000 ✓
   └─ ARCHITECTURE.md reviewed by Emmanuel ✓

□  PHASE 2 DONE (Jun 28)
   └─ All 15+ API endpoints implemented and documented ✓
   └─ Property search returning results in < 500ms ✓
   └─ Image uploads to Cloudinary working ✓
   └─ Developer can create + manage listings via API ✓
   └─ Favorites, ratings, appointments all working ✓
   └─ Admin verification endpoint working ✓
   └─ Swagger docs live at /api/docs ✓
   └─ Jest coverage ≥ 70% on service layer ✓

□  ⭐ PHASE 3 DONE (Jul 5) - Web App v1.0
   └─ Homepage live and responsive ✓
   └─ Property browse + search working end-to-end ✓
   └─ WhatsApp CTA opens WhatsApp with pre-filled message ✓
   └─ Developer dashboard functional ✓
   └─ Create listing form (multi-step) working ✓
   └─ Admin panel functional ✓
   └─ Lighthouse mobile ≥ 85 ✓
   └─ No broken pages or unhandled errors ✓

□  ⭐ PRODUCTION LAUNCH (Jul 13) - Platform Live
   └─ app.byte.africa live with SSL ✓
   └─ api.byte.africa live with SSL ✓
   └─ All Playwright E2E tests passing in CI ✓
   └─ Load test: p95 < 800ms at 200 concurrent users ✓
   └─ Sentry configured and capturing errors ✓
   └─ UptimeRobot monitoring active ✓
   └─ Daily DB backups confirmed ✓
   └─ Full smoke test on production URL by Emmanuel ✓
   └─ Platform announced internally ✓
```

---

## 14. Database Schema Design

```prisma
// database/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum Role {
  USER
  DEVELOPER
  ADMIN
}

enum PropertyCategory {
  LUXURY
  AFFORDABLE
  LAND
  APARTMENT
  HOUSE
  COMMERCIAL
  OFFICE
}

enum ListingType {
  SALE
  RENT
}

enum PropertyStatus {
  DRAFT
  ACTIVE
  RESERVED
  SOLD
  SUSPENDED  // Admin-suspended
}

enum MediaType {
  IMAGE
  VIDEO
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}

enum NotificationType {
  PROPERTY_LIKED
  PROPERTY_VIEWED_MILESTONE  // e.g., 100 views
  APPOINTMENT_REQUESTED
  APPOINTMENT_CONFIRMED
  DEVELOPER_VERIFIED
}

enum ReportStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  DISMISSED
}

enum DeveloperPlan {
  FREE         // 3 active listings
  STARTER      // 10 active listings
  PRO          // 50 active listings + analytics
  ENTERPRISE   // Unlimited + featured slots
}

// ─────────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  developerProfile  DeveloperProfile?
  favorites         PropertyFavorite[]
  ratingsGiven      DeveloperRating[]
  refreshTokens     RefreshToken[]
  reports           Report[]

  @@index([email])
  @@map("users")
}

model DeveloperProfile {
  id              String         @id @default(cuid())
  userId          String         @unique
  businessName    String
  whatsappNumber  String
  bio             String?
  logoUrl         String?
  logoPublicId    String?
  isVerified      Boolean        @default(false)
  verifiedAt      DateTime?
  averageRating   Float          @default(0)
  totalRatings    Int            @default(0)
  plan            DeveloperPlan  @default(FREE)
  planExpiresAt   DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  user            User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  properties      Property[]
  ratings         DeveloperRating[]
  notifications   Notification[]
  appointments    Appointment[]

  @@index([isVerified])
  @@index([averageRating])
  @@map("developer_profiles")
}

model Property {
  id                  String           @id @default(cuid())
  developerId         String
  title               String
  slug                String           @unique
  description         String
  category            PropertyCategory
  listingType         ListingType
  price               Decimal          @db.Decimal(15, 2)
  priceNegotiable     Boolean          @default(false)
  address             String
  city                String
  region              String
  latitude            Float?
  longitude           Float?
  bedrooms            Int?
  bathrooms           Int?
  sizeSquareMeters    Float?
  yearBuilt           Int?
  status              PropertyStatus   @default(DRAFT)
  isFeatured          Boolean          @default(false)
  viewCount           Int              @default(0)
  whatsappClickCount  Int              @default(0)
  searchVector        Unsupported("tsvector")?
  createdAt           DateTime         @default(now())
  updatedAt           DateTime         @updatedAt

  developer           DeveloperProfile @relation(fields: [developerId], references: [id], onDelete: Cascade)
  media               PropertyMedia[]
  favorites           PropertyFavorite[]
  appointments        Appointment[]
  analytics           PropertyAnalytics[]
  reports             Report[]         @relation("PropertyReports")

  @@index([developerId])
  @@index([status])
  @@index([listingType])
  @@index([category])
  @@index([city])
  @@index([region])
  @@index([listingType, category])
  @@index([price])
  @@index([isFeatured])
  @@index([createdAt])
  @@map("properties")
}

model PropertyMedia {
  id          String     @id @default(cuid())
  propertyId  String
  url         String
  publicId    String     // Cloudinary public ID for deletion
  mediaType   MediaType  @default(IMAGE)
  isPrimary   Boolean    @default(false)
  order       Int        @default(0)
  createdAt   DateTime   @default(now())

  property    Property   @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@index([propertyId])
  @@index([propertyId, isPrimary])
  @@map("property_media")
}

model PropertyFavorite {
  id          String    @id @default(cuid())
  userId      String
  propertyId  String
  createdAt   DateTime  @default(now())

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  property    Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([userId, propertyId])
  @@index([userId])
  @@index([propertyId])
  @@map("property_favorites")
}

model DeveloperRating {
  id           String           @id @default(cuid())
  raterId      String
  developerId  String
  score        Int              // 1–5
  comment      String?
  createdAt    DateTime         @default(now())

  rater        User             @relation(fields: [raterId], references: [id], onDelete: Cascade)
  developer    DeveloperProfile @relation(fields: [developerId], references: [id], onDelete: Cascade)

  @@unique([raterId, developerId])  // One rating per user per developer
  @@index([developerId])
  @@map("developer_ratings")
}

model Appointment {
  id             String             @id @default(cuid())
  propertyId     String
  developerId    String
  guestName      String
  guestPhone     String
  guestEmail     String?
  preferredDate  DateTime
  notes          String?
  status         AppointmentStatus  @default(PENDING)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  property       Property           @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  developer      DeveloperProfile   @relation(fields: [developerId], references: [id], onDelete: Cascade)

  @@index([developerId])
  @@index([propertyId])
  @@index([status])
  @@map("appointments")
}

model Notification {
  id           String               @id @default(cuid())
  developerId  String
  type         NotificationType
  title        String
  message      String
  isRead       Boolean              @default(false)
  metadata     Json?                // { propertyId, propertyTitle, etc. }
  createdAt    DateTime             @default(now())

  developer    DeveloperProfile     @relation(fields: [developerId], references: [id], onDelete: Cascade)

  @@index([developerId, isRead])
  @@index([developerId, createdAt])
  @@map("notifications")
}

model PropertyAnalytics {
  id               String    @id @default(cuid())
  propertyId       String
  date             DateTime  @db.Date
  views            Int       @default(0)
  whatsappClicks   Int       @default(0)
  favorites        Int       @default(0)

  property         Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([propertyId, date])
  @@index([propertyId])
  @@map("property_analytics")
}

model Report {
  id           String       @id @default(cuid())
  reporterId   String?      // Nullable - anonymous reports allowed
  targetType   String       // "PROPERTY" | "DEVELOPER"
  targetId     String
  reason       String
  description  String?
  status       ReportStatus @default(OPEN)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  reporter     User?        @relation(fields: [reporterId], references: [id], onDelete: SetNull)
  property     Property?    @relation("PropertyReports", fields: [targetId], references: [id], map: "report_property_fk")

  @@index([status])
  @@index([targetType, targetId])
  @@map("reports")
}

model RefreshToken {
  id         String    @id @default(cuid())
  userId     String
  token      String    @unique
  expiresAt  DateTime
  createdAt  DateTime  @default(now())

  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

---

## 15. API Contract (REST)

### Standard Response Format

All API responses follow this shape:

```typescript
// Success
{
  "success": true,
  "data": { ... },         // Single object
  "message": "Property created successfully"
}

// Paginated list
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 248,
    "page": 1,
    "limit": 20,
    "totalPages": 13,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "PROPERTY_NOT_FOUND",
    "message": "Property with ID xyz does not exist",
    "statusCode": 404
  }
}

// Validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "statusCode": 422,
    "details": [
      { "field": "price", "message": "Price must be a positive number" },
      { "field": "category", "message": "Invalid category value" }
    ]
  }
}
```

### Core Endpoints Summary

```
AUTH
POST   /api/v1/auth/register              Create account (USER or DEVELOPER)
POST   /api/v1/auth/login                 Login, receive tokens
POST   /api/v1/auth/refresh               Refresh access token (HttpOnly cookie)
POST   /api/v1/auth/logout                Invalidate refresh token
GET    /api/v1/auth/me                    Get current user profile

PROPERTIES (Public)
GET    /api/v1/properties                 List + filter properties
GET    /api/v1/properties/:id             Property detail (increments views)
GET    /api/v1/properties/slug/:slug      Property by slug (SEO)
GET    /api/v1/properties/featured        Featured listings (max 6)

PROPERTIES (Developer - auth required)
POST   /api/v1/properties                 Create listing
PATCH  /api/v1/properties/:id             Update listing (owner only)
DELETE /api/v1/properties/:id             Delete listing (owner or admin)
PATCH  /api/v1/properties/:id/status      Toggle ACTIVE/DRAFT/RESERVED/SOLD

SEARCH
GET    /api/v1/search/properties          Full-text + filter search

MEDIA
POST   /api/v1/uploads/images             Upload 1–10 images (multipart)
POST   /api/v1/uploads/video              Upload 1 video (multipart)
DELETE /api/v1/uploads/:publicId          Delete media from Cloudinary

DEVELOPERS (Public)
GET    /api/v1/developers                 List verified developers
GET    /api/v1/developers/:id             Developer public profile + listings

DEVELOPERS (Auth required)
GET    /api/v1/developers/me              My developer profile
PATCH  /api/v1/developers/me              Update my profile

FAVORITES (Auth required)
GET    /api/v1/favorites                  My saved properties
POST   /api/v1/favorites/:propertyId      Toggle favorite
GET    /api/v1/favorites/:propertyId      Check if favorited

RATINGS
POST   /api/v1/ratings/:developerId       Rate a developer (auth required)
GET    /api/v1/ratings/:developerId       Get ratings for developer (public)

APPOINTMENTS
POST   /api/v1/appointments              Schedule visit (NO auth required)
GET    /api/v1/appointments              Developer's appointment list (auth)
PATCH  /api/v1/appointments/:id/status   Confirm/cancel appointment (developer)

NOTIFICATIONS (Developer - auth required)
GET    /api/v1/notifications             My notifications (paginated)
PATCH  /api/v1/notifications/read-all    Mark all as read
PATCH  /api/v1/notifications/:id/read    Mark one as read

ANALYTICS (Developer - auth required)
GET    /api/v1/analytics/overview        Summary: total views, likes, contacts
GET    /api/v1/analytics/properties/:id  Per-property analytics (7d / 30d)
POST   /api/v1/analytics/events          Record event (view, whatsapp_click)

REPORTS
POST   /api/v1/reports                   Submit report (public)

ADMIN (Admin role required)
GET    /api/v1/admin/developers          List all developers + verification status
PATCH  /api/v1/admin/developers/:id/verify    Verify developer
PATCH  /api/v1/admin/developers/:id/ban       Ban developer
GET    /api/v1/admin/listings            All listings (incl. suspended)
PATCH  /api/v1/admin/listings/:id/suspend     Suspend listing
GET    /api/v1/admin/reports             Open reports list
PATCH  /api/v1/admin/reports/:id         Update report status

HEALTH
GET    /api/health                       { status: "ok", version, uptime, db: "connected" }
```

---

## 16. Environment Variables Reference

### Backend `.env`

```bash
# Server
NODE_ENV=development
PORT=4000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://byte_user:password@localhost:5432/byte_realestate

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_ACCESS_SECRET=your_long_random_access_secret_here
JWT_REFRESH_SECRET=your_long_random_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (dev: Gmail SMTP | prod: Resend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=byte.notifications@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=ByTe <no-reply@byte.africa>

# Resend (production)
RESEND_API_KEY=re_your_resend_key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://app.byte.africa

# Admin
ADMIN_EMAIL=admin@byte.africa
ADMIN_PASSWORD=changeme_on_first_deploy
```

### Frontend `.env.local`

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://your_sentry_dsn

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ByTe
```

**Rules for environment variables:**
- Never commit `.env` or `.env.local` to Git (confirmed in .gitignore)
- Always update `.env.example` when adding a new variable
- Production secrets managed via GitHub Secrets (CI/CD) and VPS environment
- All env vars validated with Zod at app startup - if missing, app fails fast with a clear error

---

## 17. Risk Register

```
┌────────────────────────────────────┬──────────┬──────────┬──────────────────────────────────────────┐
│ Risk                               │Likelihood│  Impact  │ Mitigation                               │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ Image upload performance too slow  │ High     │ CRITICAL │ Use Cloudinary direct upload (client-    │
│ on mobile / low-bandwidth          │          │          │ side), not proxy through backend.         │
│                                    │          │          │ Compress images before upload client-side │
│                                    │          │          │ with browser-image-compression npm pkg.   │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ Multi-step form loses data on      │ High     │ HIGH     │ Persist each step's data to localStorage │
│ browser refresh or navigation      │          │          │ in real-time. Restore on mount.           │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ WhatsApp deeplinks blocked or      │ Medium   │ CRITICAL │ Test on real devices (Android + iOS)     │
│ don't open WhatsApp on all devices │          │          │ in Week 3. Provide fallback: copy number  │
│                                    │          │          │ to clipboard with one tap.                │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ Scope creep from stakeholders      │ Very High│ HIGH     │ Feature freeze after Jun 28 (end Phase   │
│ or team mid-sprint                 │          │          │ 2). All requests go to v2-backlog label. │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ PostgreSQL full-text search too    │ Medium   │ HIGH     │ If search is slow: add GIN index on      │
│ slow for real queries              │          │          │ searchVector. If still slow: swap to      │
│                                    │          │          │ Meilisearch (pre-plan the swap in Week 2) │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ Mapbox token exposed + abused      │ Medium   │ MEDIUM   │ Restrict Mapbox token to byte.africa     │
│                                    │          │          │ domain only in Mapbox dashboard.          │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ Developer uploads hundreds of      │ Medium   │ HIGH     │ Hard limit: 10 images per listing, 1     │
│ large files, blowing Cloudinary    │          │          │ video. Enforce in Multer + Cloudinary    │
│ free tier                          │          │          │ upload preset. Monitor Cloudinary usage. │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ Single VPS is a single point of    │ Low      │ HIGH     │ Configure daily pg_dump backups to R2.   │
│ failure                            │          │          │ Nginx health check. UptimeRobot alerts.   │
│                                    │          │          │ Document manual recovery steps.           │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ One engineer blocked delays        │ Medium   │ HIGH     │ Each engineer documents their work in    │
│ entire sprint                      │          │          │ code comments + ONBOARDING.md. Daily      │
│                                    │          │          │ standups surface blockers early.          │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ Lighthouse score < 85 on mobile    │ High     │ MEDIUM   │ Claude runs Lighthouse audit at start    │
│ due to unoptimized images/JS       │          │          │ of Phase 3 (not end). Fix early.         │
│                                    │          │          │ Always use Next.js Image component.       │
├────────────────────────────────────┼──────────┼──────────┼──────────────────────────────────────────┤
│ SSL/domain setup delays launch     │ Medium   │ HIGH     │ Emmanuel starts DNS + Certbot setup on   │
│                                    │          │          │ Day 1 of Week 4. Don't wait until last   │
│                                    │          │          │ day. DNS propagation takes up to 48 hrs. │
└────────────────────────────────────┴──────────┴──────────┴──────────────────────────────────────────┘
```

---

## 18. Definition of Done

A task is **Done** when ALL of the following are true:

1. **Code is merged to `develop` via PR** - never committed directly.
2. **CI pipeline is green** - lint, unit tests, and build all pass.
3. **Code reviewed and approved** - Emmanuel has approved the PR.
4. **Acceptance criteria met** - every item in the issue checklist is ticked.
5. **No `console.log`, no commented-out code, no `any` types** in the PR diff.
6. **`.env.example` is updated** if the PR introduces a new environment variable.
7. **`CHANGELOG.md` entry added** under the correct phase/week.
8. **Tests written** - unit test for any new service function; component test for any new UI component with logic.
9. **Tested manually** on localhost (backend: Postman or Swagger UI; frontend: 375px mobile viewport in DevTools).
10. **No known regressions** - the engineer has confirmed related existing features still work.

A phase is **Done** when ALL phase tasks are Done AND the phase acceptance criteria are fully met.

---

## Final Advice

**The WhatsApp button is your most important pixel.**
Every user flow ends at a WhatsApp conversation. If that button is broken, hidden, or slow to appear, the platform has failed its core purpose. Test it on real devices every single day of Week 3.

**Developer trust is the product's foundation.**
Without verified developers and real listings, the platform is just a design exercise. Seed it with real developers before launch - even 5 genuine, verified developers with real listings is worth more than 50 unverified ones.

**Mobile-first means mobile-first from line one.**
Do not build for desktop and then "make it responsive." Open DevTools on a 375px viewport before writing a single component. If it looks wrong at 375px, it is wrong, period.

**Clement's indexes are what make the product feel fast.**
A beautiful UI on a slow search endpoint is a bad product. The search experience at 3G speeds is what will decide whether this platform wins in African markets. Invest in those GIN indexes.

**Ship something you would be proud to show an investor on July 14th.**
That is your north star.

---

*ByTe Real Estate Platform - Development Roadmap v1.0*
*Project Duration: 4 Weeks | June 15 – July 13, 2026*
*Team: Emmanuel (CTO), Clement (DBA), Albert (Backend), Claude (Frontend)*
*Confidential · ByTe Africa · 2026*
