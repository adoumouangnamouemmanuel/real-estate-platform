# Lumavok database and bilingual integration review

Status: implemented in isolated review branches; **not applied to the shared Supabase project**. Architecture approval received before this work. Production deployment and changes to existing shared branches require separate approval.

The database branch starts at `dba` (`cd80160779dcd2bdcebee1e12692d695e7380d42`). The application branch starts at `feature/APP-002-french` (`524deb7e7dc2ac3d20ac3f10dde6f92a312c792e`), which includes the reviewed Claude frontend. These branches were inspected independently. The application branch carries the same reviewed database files so it can be tested as one release. Neither existing branch was overwritten or merged.

## Preserved

All Burkina Faso seed files are byte-for-byte unchanged. A committed SHA-256 test verifies them. Cities, districts, source titles/descriptions, numeric amounts, current CUIDs, property slugs, original account records and legacy file references are retained. The public-snapshot rehearsal restored all 17 existing public tables into an isolated PostgreSQL engine, applied the three new migrations and content manifest, and compared fingerprints of every original column. They matched. See `snapshot-preservation-results.json`; it contains aggregate verification results. Full record fingerprints and the per-record manifest are supplied privately.

The nine listings contain eight French source texts and one English draft. The extra English draft has location metadata requiring owner confirmation. Its text and location remain untouched. Its owner must confirm location and currency before publishing. The manifest leaves that draft's currency unset. XOF and monthly rent metadata are proposed for the Burkina seed records; numeric prices are never converted. Source text hashes make the backfill stop if a record has changed.

## Implemented database changes

| Area                      | Implementation                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Locale configuration      | `language`, singleton `app_settings`; initial en/fr, default and fallback fr                                                                           |
| Listing content           | `property_translation`, composite property/language key, published completeness and length checks                                                      |
| Catalogue/profile content | `feature_translation`, `property_developer_translation`, concrete parent and language FKs                                                              |
| Managed identity          | Nullable unique `user.auth_user_id` referencing `auth.users`; existing application CUIDs retained; preferred language FK                               |
| Seller activation         | Pending by default; existing developers retained as active; activation restricted to an explicit administrator route; activating user/time recorded    |
| Stable identity           | Existing developer URL mapper persisted once as a unique slug; feature code initially equals its stable existing ID                                    |
| Money/editing             | Currency, rental period, optimistic row version; unknown legacy currency stays nullable; new listings use XOF                                          |
| Referential integrity     | Composite district/city and appointment/property/developer FKs; concrete report target FKs plus matching-target check                                  |
| Media                     | Storage provider/key, unique display order, at most one primary image, nonnegative order                                                               |
| Constraints/indexes       | Nonnegative counters; owner/date and public catalogue indexes; reporter FK index; case-insensitive email uniqueness                                    |
| Publication               | Deferred checks require complete source text, positive price, confirmed currency, rental period when applicable, address, media and land size for land |
| Permissions               | Explicit grants, column restrictions and RLS for the non-owner runtime; anonymous/Auth Data API roles retain no application-table grants               |

No legacy columns/tables or migration-history rows are deleted. The old district-only FK is replaced with the composite RESTRICT FK; this deliberately replaces SET NULL behavior. Deactivate geographic lookup rows instead of deleting referenced districts. Existing timestamps without time zone are preserved; converting historical timestamps requires a verified source-timezone decision.

Three independently authored October migrations reconcile the observed schema, expand the bilingual core and enforce runtime security. They **do not impersonate the missing August migrations**. Enum additions precede their use in a separate file/commit boundary. Fresh June-to-October SQL replay and observed-schema-to-October replay are tested, but the canonical production Prisma history remains blocked until the original August files are recovered.

## API and frontend behavior

Localized reads accept explicit `?lang=en` or `?lang=fr`; missing language uses the configured default. Unsupported languages return `400 UNSUPPORTED_LANGUAGE`. Resolution selects a complete published row in this order: requested language, configured fallback, known source language. A title and description always come from the same row. Responses include `requestedLanguage`, `contentLanguage` and `fallbackUsed`. Draft translations are private. Owners can open an exact language for editing without silently modifying a fallback translation.

For example, the integration fixture returns the same property ID and numeric price with `Maison` in French and `House` in English. Unpublishing its English translation makes the English request return `Maison`, `contentLanguage: "fr"`, `fallbackUsed: true`. `operations/localized-property.sql` provides an equivalent parameterized query.

Core prices, identifiers, measurements and geography are language-neutral. `priceDecimal` is also returned for exact money consumers while the existing numeric `price` contract remains available. New price inputs reject more than two decimal places. `currencyCode: null` is displayed as unconfirmed rather than silently labelled XOF.

Frontend requests and React Query keys carry locale. A language cookie bridges browser preference and server-rendered catalogue requests; interface dictionaries remain in the repository. Each language provider owns its translation instance. The content-language editor selector is separate from interface language and cannot discard dirty edits by switching language. Saving synchronizes only the source language into the legacy title/description columns. Source edits unpublish other translations for review. A separate action publishes a completed translation.

Forms and filters read the unchanged database city/district catalogue. Writes use location and amenity IDs; translated labels are display values. The API normalizes frontend lowercase categories, including OFFICE, and returns lowercase categories. Saved CUIDs use `/properties/by-id/:id` rather than the slug endpoint. Listing updates include a row version and return 409 for stale edits. Media/features/content changes, appointment status/history and favorite counters commit atomically.

Public detail, related, developer and saved-property retrieval use a consistent ACTIVE/non-deleted publisher predicate. Missing seller identity fails closed at the route and service layers. Administrator status no longer silently grants access to developer routes with an undefined owner filter.

## Authentication and security boundary

Supabase Auth is behind the Express API. Credentials are verified by Auth; roles and seller identity come from the mapped database account, never editable JWT user metadata. Existing accounts require explicit verified identity linking. Signup creates no seller/admin privilege. Seller requests remain pending until administrator activation. Access-token sessions are checked against a narrow private Auth-session lookup so deleted sessions are rejected.

The database login must be a non-owner, NOBYPASSRLS member of `lumavok_runtime`. Startup rejects owner/bypass connections and a superuser session merely switched into a lower role. A separate migration owner is required. Every scoped Prisma query runs on a pinned transaction with transaction-local identity, including anonymous reads. Callback transactions reuse that connection; session-wide identity settings and unsafe raw-query helpers are blocked.

RLS is supplemented by grants and guards on role, identity mapping, seller approval and verification. Runtime cannot read password hashes, refresh-token rows or migration history, update ownership/counters directly, or change notification content. Two narrow SECURITY DEFINER functions are intentional: a trigger maintains cross-owner favorite counters, and a private boolean function checks the current verified user's Auth session. They have fixed search paths and no public execution grants. They are not general privileged query endpoints.

Managed recovery replaces logged/in-memory reset tokens and the O(N) bcrypt refresh scan. Recovery tokens travel in a URL fragment, are removed by the browser, and are submitted once in a POST body. Supabase email templates/redirects still require staging configuration. Authentication uses an HttpOnly refresh cookie through a same-origin `/api/v1` proxy. Silent refresh is single-flight and uses the same role mapper as login. Configure the trusted proxy hop count only after verifying the actual ingress chain.

New uploads use a private Storage bucket and generated owner-scoped UUID keys. Server decoding validates image bytes/pixel limits and re-encodes WebP; folders, filenames and client MIME declarations do not determine paths or ownership. Attachment verifies an object exists under the current seller's prefix. Attached objects cannot be deleted until detached from the listing. Signed read URLs expire after 120 seconds and are never stored as durable references. Image optimization is disabled to avoid extending private-file access through an optimizer cache. Legacy Cloudinary/local references are retained; no file transfers/deletions were attempted.

## Remaining deployment blockers and limits

1. Recover checksum-matching `20260831000001_expand_enums` and `20260831000002_add_tables_and_columns`. They were not found in the inspected repository history. The deployment wrapper stops before connecting if either is missing. Do not fabricate names/checksums or rewrite production history.
2. Rehearse a fresh full Supabase restore in staging. The successful local test covered public schema/rows, not the complete managed Auth/Storage infrastructure or production backup restoration procedure.
3. Provision and test the actual non-owner login, pooling mode, proxy chain and secure environment. No production credentials were requested or committed.
4. Recheck the previously observed Auth health error. Configure confirmed-email signup, SMTP/recovery templates, redirects, existing account mapping, first administrator and session revocation; run real provider end-to-end tests. The local integration test mocks Auth responses and uses real PostgreSQL/Prisma for authorization.
5. Provision the private bucket and test successful real upload, attachment, signing/expiry and deletion. Byte-validation and unauthorized API cases are locally tested; no live Storage upload was made.
6. Review the manifest's language/currency/rental metadata, resolve the extra draft when its owner is ready, and approve the migration/rollout before changing shared data. Preserve legacy sessions/hashes until the verified cutover, then revoke legacy sessions deliberately.
7. The inherited frontend suite has obsolete mock/API and language assumptions. A clean pinned French-branch run had 91 failures out of 659 tests before changes. The report records the final comparison and focused results separately; a passing production build is not a claim that the entire suite is green. Complete fixture maintenance and UI translation coverage before release. Static dashboard labels and some validation/error/legacy notification prose still need translation work.
8. Dashboard/analytics portfolio calculations still include unbounded owner queries. Current tiny-data SQL planning and functional tests are not load benchmarks. Move these aggregates into bounded/database queries when validating target load, and measure before removing existing indexes.

Legacy demo seeds are preserved, not rewritten to fit the new model. The guarded runner permits only explicitly chosen pre-expansion local databases; use the committed architecture fixtures after expansion. No seeds were executed against the shared project.

The review branch is a deployable candidate only after these gates are satisfied; it is not a declaration that production migration, real Auth/Storage tests or a full recovery rehearsal succeeded.

The privileged Storage credential is used only by the Storage module, but remains in the API process and can have broader Supabase project privileges. RLS and transaction identity assume a trusted API; they do not protect against complete server compromise. A separately deployed Storage bridge or user-scoped design is a further isolation step. The migration-owner URL is not required by, or supplied to, the application runtime.

An owner's SUSPENDED listing remains resumable, preserving the existing pause/reactivate flow. Account-wide administrative takedown uses the protected seller status. A distinct per-listing administrative lock is not implemented; do not treat an owner's pause status as an irreversible moderator decision.

Seller application/approval endpoints are implemented; a new seller-onboarding or moderator dashboard UI is not included. Existing developer dashboards integrate through the mapped accounts. External availability of the eight original image URLs remains unverified: automatic approval review blocked forwarding private-backup-derived URLs to Cloudinary without explicit permission. Database media relationships and references were checked internally.

Public developer email now comes only from the optional `public_email` field. Login addresses are never copied into this field automatically. Before cutover, owners must explicitly approve and provide a business contact address through the reviewed operational process; no profile-editing UI for this new field is included. Existing profiles therefore omit the email link until that decision is made. Missing localized profile biographies return an empty string to preserve the detail-page contract.
