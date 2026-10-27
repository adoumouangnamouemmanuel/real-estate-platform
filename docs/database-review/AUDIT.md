# Initial audit: observed state before redesign

Read-only inspection covered Lumavok's `real-estate` Supabase project, public schema/records, migration history, Auth/Storage configuration and the three source branches independently. The target project reference is `haxzufwizwqfrqzzzmsa`. A differently scoped connector exposed an unrelated project; it was not used as the target. The initial full audit and architecture proposal were delivered separately before architecture approval.

| Source                    | Pinned commit                              | Assessment                                                                                                              |
| ------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `dba`                     | `cd80160779dcd2bdcebee1e12692d695e7380d42` | Database source and Burkina seeds; repository migrations do not reproduce the observed deployed history                 |
| `feature/claude-frontend` | `b830add917d67329775a3c3a85f8768c498c399d` | Frontend/API contract, seller dashboards, catalogue and source defects                                                  |
| `feature/APP-002-french`  | `524deb7e7dc2ac3d20ac3f10dde6f92a312c792e` | Frontend translation resources and language switching; chosen application integration base after independent comparison |

## Database and permissions

The observed PostgreSQL version was 17.6. Public schema contained 16 application tables plus Prisma migration history. Existing normalized entities—users, developer profiles, properties, cities/districts, amenities, media, favorites, ratings, notifications, analytics, reports and appointments/history—were useful foundations and were retained. CUIDs, property slugs, decimal prices, foreign keys, soft deletion and existing query indexes were worth preserving.

The inspected snapshot contained nine properties, four application accounts/developer profiles, two Burkina Faso cities, seven districts, ten amenities, eight media records and 22 legacy refresh-token records. Seven properties were active and two were drafts. No managed Auth users, Storage buckets or Storage objects existed at inspection. Existing file references therefore did not represent managed Supabase Storage objects. No raw backup, credential hashes, token records or per-record production manifest belongs in the public repository.

RLS was enabled on fourteen application tables but no policies were present. Ordinary `anon`/`authenticated` application-table grants were denied. Appointments/history and migration history lacked RLS. This was not evidence of a publicly readable Data API; it meant direct clients could not legitimately integrate, while a privileged backend connection could bypass the intended row restrictions. The redesign must verify the runtime login and policies together.

The June initial migration matched its recorded checksum. Two successfully applied August migration files were absent from all inspected repository history. Three failed/rolled-back August attempts were also retained in history, including unsafe enum use before commit. Inventing replacement historical files would make replay and recovery unreliable. Recovering the originals is a deployment gate.

Structural gaps included an unconstrained polymorphic report target, district/city relationships that could disagree, redundant appointment ownership that could disagree with its property, no explicit currency/rental period/source language, no per-language content uniqueness, and no managed identity mapping. Existing integrity checks and indexes are retained unless the new migration explicitly strengthens them. Small-data inspection is not a load benchmark.

## Application and language integration

The frontend is a Next.js application consuming an Express/Prisma API. Its property contract includes lowercase categories, `buildingSizeSqm`, city/district choices, amenities, media, seller identity and paginated results. The database uses uppercase enum values, `buildingSizeSqM`, canonical foreign keys and join tables. Those differences require explicit adapters rather than a schema rename that breaks existing records.

Seven source defects were reproduced before implementation: public detail returned a draft; an absent developer identity reached an owner query; an empty zero-price draft could be published; district/amenity updates were ignored; create lost `buildingSizeSqm`; appointment pagination returned all rows; lowercase categories were passed into Prisma unchanged. The original reproduction used isolated service dependencies; subsequent fix verification uses HTTP, Prisma and a real isolated PostgreSQL engine.

Additional risks included exposing login email as public business contact, refresh-token scanning, logged/in-memory recovery state, inconsistent role mapping, insufficient upload validation, and split multi-write workflows. The reviewed implementation addresses these paths; provider and production-environment behavior still requires staging verification.

The French branch translated interface dictionaries and persisted a UI preference. It did not translate database titles/descriptions or define an explicit localized-content API. Hardcoded frontend location/mock assumptions also disagreed with the Burkina catalogue. Static interface resources remain in the frontend; database content now has separate translation records. Proper place names, IDs, money, measurements and business names are not duplicated per language without an editorial requirement.

The pinned French frontend suite already failed 91 tests before redesign. Treating its mocks as an authoritative live backend specification would preserve defects. Tests that expressed replaced location/recovery contracts were updated; the remaining failures stay visible and are compared by exact test name in `VALIDATION.md`.

## Deferred requirements

No tenant/agency hierarchy, payment ledger, geospatial search stack, generic translation engine or separate table for every possible property subtype was added. Existing seller ownership, geography, category enums and amenity joins cover the observed flows. Additional language catalogues, targeted search indexes, bounded analytics aggregates and a distinct administrator listing lock can be introduced when requirements and measured load justify them. Auth health previously returned an error and must be rechecked before cutover.
