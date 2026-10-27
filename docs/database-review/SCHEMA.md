# Schema and bilingual contract

The approved implementation retains all sixteen existing application models and adds five. `schema.prisma` describes the application model; the three October SQL files additionally define database checks, compound foreign keys, partial indexes, trigger guards and permissions. No legacy table/column/record is removed.

## Entity model

| Table/group                      | Important keys and columns                                                                                                                      | Integrity and ownership                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user`                           | Existing CUID PK, unique email, nullable unique `auth_user_id` UUID, role, preferred language                                                   | SQL FK to `auth.users`; case-folded email uniqueness; roles/auth mapping protected from ordinary self-editing; hashes retained but not readable by runtime |
| `property_developer`             | CUID PK, unique `user_id`, stable unique slug, seller status, optional public email/city/source language, activation actor/time                 | One business profile per account; pending applications require explicit administrator activation; existing profiles remain active                          |
| `property`                       | Existing CUID/unique slug, seller/city/district FKs, category/status, decimal(15,2) price, currency/rental period, source language, row version | Compound district/city FK; owner cannot change identity/ownership/counters through column grants; source fields retained for controlled rollback           |
| `city`, `district`               | Existing IDs/names; city country code; district's city FK                                                                                       | Burkina catalogue retained; `(district_id,city_id)` reference prevents cross-city assignment; RESTRICT deletion preserves referenced geography             |
| `feature`, `property_feature`    | Stable feature code, source language, unique property/feature pair                                                                              | Canonical amenity IDs independent of translated labels; admin-managed catalogue                                                                            |
| `property_media`                 | Existing ID/URL/provider reference, property FK, provider/storage key, order, primary flag                                                      | Unique property/order; partial unique primary image; generated owner-scoped Storage keys for new uploads; legacy references retained                       |
| `language`, `app_settings`       | Language code PK/active flag; singleton settings row with default/fallback language FKs                                                         | Initial en/fr; default/fallback fr; new language rows do not require new content columns                                                                   |
| `property_translation`           | `(property_id,language_code)` PK, title, description, publication flag, timestamptz update                                                      | Parent/language FKs, title <=120, description <=2000; published rows require both nonblank; parent deletion cascades                                       |
| `feature_translation`            | `(feature_id,language_code)` PK, localized name                                                                                                 | Parent/language FKs, nonblank name <=120; parent deletion cascades                                                                                         |
| `property_developer_translation` | `(developer_id,language_code)` PK, bio/specialization                                                                                           | Parent/language FKs and length bounds; parent deletion cascades                                                                                            |
| Favorites/ratings                | Existing user/property or user/developer unique pairs                                                                                           | User-owned writes; favorite counter maintained by a narrow trigger rather than broad counter-update privilege                                              |
| Appointments/history             | Existing IDs; client/property/developer FKs; scheduled time/status and linked history                                                           | Compound property/developer FK; owner-scoped access; API changes/history commit together                                                                   |
| Reports                          | Existing target fields plus concrete property/developer FKs                                                                                     | Matching-target check requires exactly the appropriate target; reporter ownership and admin resolution                                                     |
| Notifications/analytics          | Existing recipient/property FKs and counters; optional template key/params                                                                      | Private notification content; recipient may mark read; nonnegative counters; no new notification translation service claimed                               |
| Legacy refresh tokens            | Existing rows and user FK                                                                                                                       | Preserved for audited cutover; ordinary runtime has no access; managed Auth replaces use by the API                                                        |

Deferred publication checks require a complete published source translation, positive price, confirmed currency, address, media, a rental period for rent, and land size for land. Drafts can remain incomplete. Existing timestamps without time zone remain unchanged; new localized-content/activation timestamps use time zones. Source timezone must be established before converting historical values.

New query indexes cover owner listings by update time/ID, active public properties by city/create time/ID, appointments by owner/schedule/ID, notifications by owner/status/create time/ID, and report reporter. Translation PKs support property plus language lookups without an extra duplicate index. Existing indexes remain until measurements justify removal. No claim of production load testing is made.

## Why linked translation tables

Language-specific columns would add repeated nullable columns and require migrations for each language. JSON text blobs would make required fields, length limits, parent relationships and per-language uniqueness harder to enforce. Separate concrete translation tables fit the existing small set of translatable entities and allow a property title/description to be published together. A generic polymorphic translations table would weaken parent integrity without an observed need.

The core property stores one price, currency, category, owner and location. Neither switching language nor editing a translation creates another property. Business names, city/district names and addresses remain proper names. No location-description translation table is added because the current model has no editorial location descriptions. If that feature is introduced, give its actual entity a concrete translation relation.

Interface dictionaries remain frontend files. New languages require UI resources and frontend locale options in addition to inserting a database language row; they do not require new property columns. Translations are supplied/reviewed by people: the migration preserves original source text and does not invent missing French/English content.

## Retrieval contract

All localized reads accept explicit `?lang=fr` or `?lang=en`; omitted language uses database settings. Unsupported/inactive requested languages return `400 UNSUPPORTED_LANGUAGE`. Resolution tries requested, configured fallback, then known source language, selecting one published property translation. It never mixes title and description from different languages. Editors request an exact language and see blank fields for a missing translation rather than editing fallback text. Source edits synchronize legacy source fields and unpublish other translations for review.

For the same synthetic fixture, `GET /api/v1/properties/house-one?lang=fr` returns:

```json
{
  "success": true,
  "data": {
    "id": "p1",
    "slug": "house-one",
    "title": "Maison",
    "description": "Description française",
    "price": 150000,
    "priceDecimal": "150000.00",
    "currencyCode": "XOF",
    "requestedLanguage": "fr",
    "contentLanguage": "fr",
    "fallbackUsed": false
  }
}
```

The English request returns the same ID, slug and amount with `title: "House"`, the English description and `requestedLanguage/contentLanguage: "en"`. If English is absent or unpublished, it returns the French row with `requestedLanguage: "en"`, `contentLanguage: "fr"`, `fallbackUsed: true`. A public property without a published translation, confirmed currency or source language is excluded until backfill/review is complete. Owner editing can still retrieve drafts.

See `operations/localized-property.sql` for the parameterized lateral-join equivalent. The API includes only matching published rows and uses locale-aware cache keys. Money formatting is a presentation concern; exact decimal text is also available. Unknown currency remains null and is displayed as unconfirmed.

## Access model

The browser calls Express through the same-origin frontend proxy. It does not receive a database password or Storage privileged key. Direct `anon`/`authenticated` application-table access remains denied. `lumavok_runtime` is a non-login group; deployment provisions a separate non-owner login with group membership. Server startup rejects owner, elevated and role-switched superuser connections.

| Data/action through trusted API               | Visitor | Ordinary user           | Active seller                     | Administrator                                              |
| --------------------------------------------- | ------- | ----------------------- | --------------------------------- | ---------------------------------------------------------- |
| Active public catalogue and published content | Read    | Read                    | Read                              | Read                                                       |
| Draft listings/media/translations             | Denied  | Denied                  | Own only                          | Policies permit administrative access                      |
| Listing changes                               | Denied  | Denied                  | Own only; validation/grants apply | Policy capability; no general admin editor added           |
| Profile and managed identity                  | Denied  | Own safe account fields | Own safe account fields           | Privileged linking/role changes require reviewed operation |
| Seller application/activation                 | Denied  | Request pending profile | Cannot approve self               | Explicit activation API                                    |
| Favorites                                     | Denied  | Own                     | Own                               | Own; no general favorites override                         |
| Appointments                                  | Denied  | Own as client           | Own as seller                     | Policy read; no new admin scheduling UI                    |
| Notifications                                 | Denied  | No seller inbox         | Own read/mark-read                | Policy read                                                |
| Catalogue/settings edits                      | Denied  | Denied                  | Denied                            | Policy capability; no new management UI                    |
| Hashes, legacy token rows, migration history  | Denied  | Denied                  | Denied                            | Ordinary runtime still denied                              |

The API verifies Auth tokens and maps database roles afresh; editable metadata grants no privilege. Verified identity becomes transaction-local context on a pinned connection. This model trusts the API process to set those claims correctly; it is not protection against complete server compromise. Storage privileges remain server-only but in the same process. Real login/pooling, Auth and private Storage behavior remain staging gates.
