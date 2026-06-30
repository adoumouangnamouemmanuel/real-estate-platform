-- docs/verification_queries.sql
-- Companion to INDEX_STRATEGY.md. Run with `psql -d lumavok -f` after
-- `ANALYZE;` to reproduce the EXPLAIN ANALYZE evidence cited in that
-- document. Read-only — safe to run against a staging copy at any time.

\echo '=== Q1: Browse - status + city + category, sorted by recency ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, price FROM property
WHERE status = 'ACTIVE' AND city_id = 'c1' AND category = 'HOUSE'
ORDER BY created_at DESC
LIMIT 20;

\echo ''
\echo '=== Q2: Price range filter, sorted by price ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, title, price FROM property
WHERE price BETWEEN 50000 AND 200000 AND status = 'ACTIVE'
ORDER BY price ASC
LIMIT 20;

\echo ''
\echo '=== Q3: Property detail with media + features join (N+1 check) ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.title, m.url, f.feature_name
FROM property p
LEFT JOIN property_media m ON m.property_id = p.id
LEFT JOIN property_feature pf ON pf.property_id = p.id
LEFT JOIN feature f ON f.id = pf.feature_id
WHERE p.id = 'p100';

\echo ''
\echo '=== Q4: Developer verification queue (admin panel) ==='
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, business_name, city FROM property_developer
WHERE is_verified = false
ORDER BY created_at ASC
LIMIT 50;

\echo ''
\echo '=== Index usage stats (run periodically in production) ==='
SELECT
  schemaname, relname AS table_name, indexrelname AS index_name,
  idx_scan AS times_used, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
