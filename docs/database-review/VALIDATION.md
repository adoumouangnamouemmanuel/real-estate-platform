# Validation and integration results

Validation date: 27 October 2026. These are local review results, not results from a production deployment. No live Supabase data, schema, Auth, Storage or policies were modified. See `validation-results.json` for aggregate machine-readable results.

| Check                               | Actual result                                | Scope                                                                                                                                              |
| ----------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database tests                      | 5 passed, 0 failed/skipped                   | Fresh June SQL replay; observed-schema replay; constraints/RLS actor matrix; unchanged Burkina seeds; missing-history gate; production seed denial |
| API tests                           | 2 passed, 0 failed/skipped                   | HTTP + Prisma + PostgreSQL integration and image byte validation                                                                                   |
| Focused frontend                    | 25 passed, 0 failed                          | Autosave, listing editor, bilingual contract and managed recovery in four files                                                                                     |
| Full original French suite          | 568 passed, 91 failed of 659                 | Clean baseline at pinned French commit                                                                                                             |
| Full review frontend suite          | 568 passed, 91 failed of 659                 | Exact failing test-name set matches baseline; no new failing names                                                                                 |
| Changed frontend file lint | 0 errors/warnings | ESLint on 60 changed TypeScript/TSX files; not a claim about untouched files |
| Backend compilation                 | Passed                                       | TypeScript build                                                                                                                                   |
| Frontend production build/typecheck | Passed                                       | Next.js 16.4.3; final clean-cache build succeeded                                                                                                  |
| Runtime dependency audits           | 0 reported vulnerabilities in each workspace | `npm audit --omit=dev` at review time; not a guarantee against unknown vulnerabilities                                                             |
| Original-record preservation        | Passed locally                               | All original columns across 17 public tables matched before/after fingerprints                                                                     |

## What the tests establish

The database actor matrix exercises ordinary visitor/user/seller/admin claims through the non-owner runtime group. It checks unauthorized access, protected roles/ownership/counters, draft/published visibility, compound relationships and publication rules. Both June and observed-schema replay commit enum changes before their use. Successful direct SQL replay is not proof that the missing production Prisma history can be replayed; the deployment wrapper intentionally refuses to connect until the original files are recovered.

API integration runs actual Express routes with a generated Prisma client against PGlite PostgreSQL 17.5 over a local socket. It verifies French/English retrieval and fallback, unsupported locale rejection, public draft denial, owner isolation, missing identity rejection, lowercase category adaptation, size/location/feature persistence, row-version conflict, pagination, administrator seller activation, session revocation, draft translation privacy, dashboard unread totals and atomic multi-write behavior. A forced appointment-history insert failure verifies rollback; the expected generic error log is intentional. Image tests decode valid bytes and re-encode WebP, reject SVG/oversized input, and do not contact Storage.

The socket fixture uses a role change inside a PostgreSQL owner session rather than an actual non-owner login handshake. The test expects the production startup guard to reject that connection and instantiates the app directly for functional queries. It does not certify a deployable login/pooler configuration. Auth provider responses are mocked; the database authorization path is real. Run the real provider, role-login and pooler acceptance tests in staging.

The private snapshot rehearsal restored original public rows and sanitized DDL into an isolated engine, then applied all three new migrations and the reviewed content backfill in a transaction. Every original-column fingerprint matched, including existing media IDs/references and legacy authentication records. The backfill generated source translations without converting amounts or translating text. Record fingerprints and the per-record manifest are supplied privately; the public result contains aggregate counts only. This was not a full Supabase managed backup restore.

## Frontend suite limits

The 91 failures predate this implementation and remain visible. Failing files include service mocks, locale-sensitive component expectations, saved properties, filters, amenities, navigation and session fixtures. They still need repair before release. Matching failure names does not prove that every changed path is correct, and the full suite is not green.

Ten obsolete assertions around hardcoded location/region behavior and recovery-token pre-validation were replaced with five assertions for canonical location IDs and one-time token submission, plus four new bilingual/cache/role/currency assertions and a Strict Mode recovery-submission regression test. The final suite therefore contains 659 tests. No tests were skipped to achieve the comparison. The focused editor/autosave/locale/recovery selection is green; earlier wider selections still exposed inherited failures and are not reported as fully passing.

The last incremental Next build encountered a generated Turbopack persistence error. Removing only the generated `.next` directory and running a fresh build succeeded. Source files and application data were not removed. GitHub Actions results are separate from these local results and must be checked after opening the review PRs.

## Unverified or incomplete

- A complete managed Supabase restore and tested production recovery procedure.
- Checksum-matching August migration files and a clean canonical `prisma migrate deploy` rehearsal.
- Actual non-owner login, pooler mode, HTTPS origin, cookie/proxy/CORS behavior and ingress restrictions.
- Managed Auth health, email confirmation, recovery templates, verified account linking, refresh and global logout with the real provider.
- Real Storage provisioning, successful upload/attachment, signed-link expiry and authorized deletion.
- External reachability of the eight preserved legacy media URLs. Automatic approval review blocked forwarding those private-backup-derived URLs to Cloudinary without explicit permission; database references were verified internally.
- Complete UI/error/notification translation coverage, seller onboarding/approval/profile-editing UI, and per-listing administrator locks.
- Target-load benchmarks and bounded dashboard/analytics aggregates.

Use `ROLLOUT.md` as the staging/release gate. A passing local build or isolated RLS test does not remove these requirements.
