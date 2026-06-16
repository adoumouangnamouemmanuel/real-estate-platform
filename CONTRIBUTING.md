# Contributing to ByTe Real Estate Platform

This repository follows the rules defined in the development roadmap and is intentionally strict about branch hygiene, PR quality, and review flow.

## Branching

- Branch from `develop` for normal work.
- Use `feature/*` for new work, `fix/*` for bug fixes, and `chore/*` for maintenance.
- Keep branch names lowercase and hyphen-separated.
- Do not commit directly to `main` or `develop`.

## Commit Messages

Use Conventional Commits:

```text
<type>(<scope>): <subject>
```

Examples:

- `feat(properties): add property search filters`
- `fix(auth): refresh token rotation`
- `docs(readme): clarify local setup`

Rules:

- Keep the subject imperative and under 72 characters.
- Do not end the subject with a period.
- Include the relevant BYTE issue reference in the footer when applicable.

## Pull Requests

- Open PRs against `develop` unless the work is a hotfix.
- Keep PRs focused and small enough to review quickly.
- Add screenshots or screen recordings for frontend changes.
- Ensure lint, tests, and build checks pass before requesting review.
- Request Emmanuel review before merging.

## Code Quality

- Avoid `any` in TypeScript.
- Avoid `console.log` in committed code.
- Prefer typed errors and validation schemas.
- Update `CHANGELOG.md` when user-facing behavior changes.
- Update `.env.example` when adding new environment variables.

## Issue Flow

- Use the GitHub issue templates for bugs, features, and tasks.
- Keep MVP scope aligned with the roadmap.
- Move deferred work into `v2-backlog` after the Phase 2 scope freeze.
