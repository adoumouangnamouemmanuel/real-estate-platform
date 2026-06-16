# ByTe Real Estate Platform

ByTe is a mobile-first real estate platform for browsing, listing, and managing property listings with developer verification, WhatsApp contact, and production-grade infrastructure.

This repository is organized as a monorepo with three primary workspaces:

- `frontend/` for the Next.js web app
- `backend/` for the Express API
- `database/` for Prisma schema, migrations, and seeds

## Current Status

The repository is in its foundation phase. The `.github` automation, templates, and governance files are in place; application workspaces and package manifests still need to be initialized.

## Repository Layout

- `frontend/` - public site and dashboard UI
- `backend/` - API, auth, uploads, analytics, and admin services
- `database/` - Prisma schema and database assets
- `infrastructure/` - Docker, Nginx, and deployment scripts
- `docs/` - architecture, onboarding, and roadmap documents

## Working Rules

- Branch from `develop` for feature work.
- Use conventional commits with issue references.
- Open pull requests into `develop` unless it is a hotfix.
- Keep changes small and vertically scoped.
- Update `CHANGELOG.md` when you ship user-facing changes.

## Reference Documents

- [Development roadmap](docs/ByTe_RealEstate_Roadmap.md)
- [Architecture decisions](docs/ARCHITECTURE.md)

## Planned Local Setup

Once the workspaces are initialized, the standard flow will be:

```bash
npm install
npm run dev
```

The exact commands for each workspace will be added when the app, API, and database package manifests are in place.
