# Index Strategy

**Author:** Clément Sampebgo (DBA)

**Last updated:** June 29, 2026

This document describes the indexes used in the Lumavok Real Estate database and explains why each one exists.

The recommendations in this document are based on actual query performance, not assumptions. All benchmarks were collected using `EXPLAIN ANALYZE` on a PostgreSQL 16 database seeded with:

- 20,000 sample properties
- 300 property developers
- 50 districts
- 5 cities

If the application's query patterns change, or the database grows significantly, rerun the queries in `verification_queries.sql` before adding or removing indexes.

---

# 1. Index Inventory

This section lists every index currently defined in the database.

The indexes match those documented in the project's README. Any additional index included here is clearly documented with its purpose.

## `property`

| Index | Columns | Purpose |
|---|---|---|
| `property_pkey` | `id` | Retrieves a property by its primary key. |
| `property_slug_key` | `slug` (unique) | Looks up properties by their SEO-friendly URL slug. |
| `idx_property_status` | `status` | Supports public queries that filter active properties. |
| `idx_property_city` | `city_id` | Filters properties by city. |
| `idx_property_district` | `district_id` | Filters properties by district. |
| `idx_property_listing_type` | `listing_type` | Filters sale and rental listings. |
| `idx_property_price` | `price` | Supports price range searches. See [Section 2](#2-evidence). |
| `idx_property_developer` | `property_developer_id` | Joins properties with their developer. |
| `idx_property_category` | `category` | Filters properties by category or property type. |
| `idx_property_created` | `created_at` | Sorts properties by newest first. See [Section 2](#2-evidence). |

---

## `property_developer`

| Index | Columns | Purpose |
|---|---|---|
| `idx_developer_verified` | `is_verified` | Filters verified developers. See [Section 2](#2-evidence). |
| `idx_developer_rating` | `average_rating` | Sorts developers by rating. |
| `idx_developer_city` | `city` | Filters developers by city. |

---

## `district`

| Index | Columns | Purpose |
|---|---|---|
| `idx_district_city` | `city_id` | Loads all districts within a city. |
| `idx_district_city_name` (unique) | `city_id, name` | Ensures a district name is unique within a city while allowing the same name in different cities. |

---

## `property_feature`

| Index | Columns | Purpose |
|---|---|---|
| `idx_property_feature_property` | `property_id` | Loads all amenities for a property. |
| `idx_property_feature_feature` | `feature_id` | Finds all properties that have a specific amenity. |
| `uq_property_feature` (unique) | `property_id, feature_id` | Prevents duplicate property-feature relationships. |

---

## `property_media`

| Index | Columns | Purpose |
|---|---|---|
| `idx_media_property` | `property_id` | Retrieves all media for a property. |
| `idx_media_primary` | `property_id, is_primary` | Retrieves a property's primary image efficiently. |

---

## `property_favorite`

| Index | Columns | Purpose |
|---|---|---|
| `idx_favorite_user` | `user_id` | Retrieves a user's saved properties. |
| `idx_favorite_property` | `property_id` | Counts favorites for a property. |
| `uq_favorite_user_property` (unique) | `user_id, property_id` | Prevents a user from favoriting the same property more than once. |

---

## `property_developer_rating`

| Index | Columns | Purpose |
|---|---|---|
| `idx_rating_developer` | `property_developer_id` | Calculates a developer's average rating. |
| `idx_rating_rater` | `rater_user_id` | Checks whether a user has already submitted a rating. |
| `uq_rating_rater_developer` (unique) | `rater_user_id, property_developer_id` | Ensures each user can rate a developer only once. |

---

## `notification`

| Index | Columns | Purpose |
|---|---|---|
| `idx_notification_developer` | `property_developer_id` | Retrieves notifications for a developer. |
| `idx_notification_read` | `property_developer_id, is_read` | Filters unread notifications and supports unread counts. |

---

## `property_analytics`

| Index | Columns | Purpose |
|---|---|---|
| `idx_analytics_property_date` (unique) | `property_id, date` | Retrieves daily analytics and ensures only one record exists per property per day. |

---

## `report`

| Index | Columns | Purpose |
|---|---|---|
| `idx_report_status` | `status` | Retrieves reports by status for the admin dashboard. |
| `idx_report_target` | `target_type, target_id` | Retrieves all reports associated with a property or developer. |

---

## `refresh_token`

| Index | Columns | Purpose |
|---|---|---|
| `idx_token_user` | `user_id` | Retrieves all refresh tokens belonging to a user. |
| `idx_token_hash` (unique) | `token_hash` | Looks up refresh tokens during authentication. |

---

## `user`, `city`, and `feature`

| Index | Columns | Purpose |
|---|---|---|
| `user_email_key` (unique) | `email` | Looks up users during login and prevents duplicate email addresses. |
| `city_name_key` (unique) | `name` | Prevents duplicate city names. |
| `feature_feature_name_key` (unique) | `feature_name` | Prevents duplicate feature names. |

---

# 2. Evidence

All performance results in this section were collected using:

```sql
EXPLAIN (ANALYZE, BUFFERS)
```

Planner statistics were refreshed with `ANALYZE` before each test to ensure accurate results.

---

## Browse query

This query retrieves active properties in a specific city and category, sorted by the most recently created listings.

```sql
SELECT id, title, price FROM property
WHERE status = 'ACTIVE' AND city_id = 'c1' AND category = 'HOUSE'
ORDER BY created_at DESC LIMIT 20;
```

### With indexes

```
Index Scan Backward using idx_property_created on property
  Filter: (status = 'ACTIVE' AND city_id = 'c1' AND category = 'HOUSE')
  Buffers: shared hit=19
Execution Time: 0.200 ms
```

### Without indexes

```
Seq Scan on property
  Filter: (status = 'ACTIVE' AND city_id = 'c1' AND category = 'HOUSE')
  Rows Removed by Filter: 19000
  Buffers: shared hit=679
Execution Time: 6.023 ms
```

The indexed query is approximately **30 times faster** on a dataset of 20,000 properties.

In this case, PostgreSQL chooses `idx_property_created` because it can satisfy the `ORDER BY created_at DESC` directly by scanning the index in reverse order. This avoids an additional sorting step.

This does **not** mean the city or category indexes are unnecessary. Those indexes are still used for queries that do not sort by `created_at` or that return a different subset of the data.

---

## Price range query

This query filters properties within a price range and returns the lowest-priced results first.

```sql
SELECT id, title, price FROM property
WHERE price BETWEEN 50000 AND 200000
AND status = 'ACTIVE'
ORDER BY price ASC
LIMIT 20;
```

```
Index Scan using idx_property_price on property
  Index Cond: (price >= 50000 AND price <= 200000)
  Filter: (status = 'ACTIVE')
Execution Time: 0.276 ms
```

The `idx_property_price` index supports both the price filter and the sorting operation. PostgreSQL can return the results directly from the index without performing an additional sort.

---

## Property details with media and features

This query retrieves a property's details together with its media and amenities.

```sql
SELECT p.id, p.title, m.url, f.feature_name
FROM property p
LEFT JOIN property_media m ON m.property_id = p.id
LEFT JOIN property_feature pf ON pf.property_id = p.id
LEFT JOIN feature f ON f.id = pf.feature_id
WHERE p.id = 'p100';
```

```
Nested Loop Left Join (× media, × features)
  -> Index Scan using property_pkey on property p
  -> Seq Scan on property_media m / property_feature pf
Execution Time: 0.075 ms
```

This result confirms that related data should be loaded in a single query using joins (or Prisma's `include`) rather than issuing multiple queries for the same property.

Although PostgreSQL performs sequential scans on `property_media` and `property_feature`, this is expected. Each property typically has only a small number of media files and amenities, making a sequential scan more efficient than using an index.

The indexes on these tables become more valuable when retrieving media or features for many properties at once, such as on listing pages.

---

## Developer verification queue

This query retrieves developers waiting for verification.

```sql
SELECT id, business_name, city
FROM property_developer
WHERE is_verified = false
ORDER BY created_at ASC
LIMIT 50;
```

```
Seq Scan on property_developer
  Filter: (NOT is_verified)
  Rows Removed by Filter: 100
Execution Time: 0.155 ms
```

At the current dataset size (300 developers), PostgreSQL chooses a sequential scan instead of `idx_developer_verified`.

This behavior is expected. The table is small enough that scanning it directly is less expensive than performing an index lookup.

The index remains useful because the cost changes as the table grows. Once the number of developers increases into the thousands, PostgreSQL is more likely to use the index for this query.

---

# 3. What We Deliberately Did Not Index

Not every column benefits from an index. Each additional index increases storage requirements and adds overhead to `INSERT`, `UPDATE`, and `DELETE` operations.

The following columns were intentionally left without indexes.

### `property_developer.business_name`, `bio`, and `specialization`

These columns are not indexed because the current MVP does not include free-text search for developers.

If a future release adds a "Search developers" feature, the required indexes should be introduced in a new migration rather than added in advance.

---

### `property.bedrooms`, `bathrooms`, `car_spaces`, `year_built`, `land_size_sq_m`, and `building_size_sq_m`

These fields are expected to be secondary filters.

In most searches, users first narrow the results using location, category, listing type, or price. Only then are these additional filters applied.

Adding indexes to every numeric column would increase write costs while providing little benefit for the current query patterns.

---

### `notification.metadata` (JSONB)

The `metadata` column does not have a GIN index.

Notifications are always retrieved using `property_developer_id`, not by searching the JSON content. Since the application never filters on `metadata`, a JSONB index would add unnecessary overhead.

---

# 4. Notes on Query Planner Decisions

Some of the benchmark queries in this document show PostgreSQL choosing not to use an index, even when one exists.

This behavior is expected.

PostgreSQL's query planner always selects the execution plan with the lowest estimated cost based on:

- table size,
- data distribution,
- available indexes, and
- query structure.

For example:

- The browse query uses `idx_property_created` because it satisfies both the filter and the `ORDER BY` clause efficiently.
- The developer verification query performs a sequential scan because the `property_developer` table is still relatively small.

Neither case indicates a problem with the index design.

As the database grows, PostgreSQL may choose different execution plans for the same queries. For this reason, it's good practice to rerun the benchmark queries periodically and review the execution plans before adding or removing indexes.

---

# Verification Method

Before running the benchmark queries, refresh PostgreSQL's planner statistics.

```bash
psql -d lumavok -c "ANALYZE;"
```

Then execute the verification script.

```bash
psql -d lumavok -f docs/verification_queries.sql
```

The queries in `verification_queries.sql` use `EXPLAIN ANALYZE`, which executes each query while collecting performance statistics.

> **Important:** Never run `EXPLAIN ANALYZE` on `UPDATE`, `DELETE`, or other data-modifying statements against a production database. Since the query is executed, those changes will still be applied.

