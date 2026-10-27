# Lumavok approved architecture implementation

These files describe a reviewed implementation candidate. Nothing here has been applied to the shared Supabase database. The Burkina Faso seeds are unchanged.

- [Initial audit](AUDIT.md): source branches, observed database and reproduced defects.
- [Implementation and integration](IMPLEMENTATION.md): implemented changes, preserved behavior, security boundary and outstanding work.
- [Schema and bilingual contract](SCHEMA.md): entities, relationships, permissions, design decisions and example responses.
- [Validation](VALIDATION.md): successful checks, inherited failures and verification limits.
- [Controlled rollout](ROLLOUT.md): missing-history gate, staging prerequisites, application cutover and rollback.
- [Snapshot preservation results](snapshot-preservation-results.json): aggregate results only; production-specific manifests and record fingerprints are delivered privately.

Authoritative SQL and operational examples are in `database/full-database-design/migrations` and `database/full-database-design/operations`. The schema includes SQL-only checks, partial indexes, triggers, grants and policies that Prisma does not express. Do not replace these migrations with `prisma db push`.
