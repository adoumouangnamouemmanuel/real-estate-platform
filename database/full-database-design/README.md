# Database README — Auth: Clément Sampebgo

**Last updated:** June 30, 2026

This package contains the database layer for the Lumavok Real Estate Platform. It includes the database schema, migrations, and seed data, all fully built and tested.

This guide walks you through setting everything up on your machine so you can start working right away. While building the database, I ran into a few setup issues and have already fixed them in the files included here. I'm sharing those issues anyway so that if you ever come across something similar, you'll know what to check first.

**Please read the "Two things I had to fix" section before you begin.** It will save you time.

---

# What you are getting

This package includes:

* `schema.prisma` — the complete database schema with 14 tables.
* `migrations/` — the SQL migrations used to create all database tables.
* `seeds/` — scripts that populate the database with sample data, including cities, districts, amenities, three sample developers, and eight sample properties.
* `docs/ER_DIAGRAM.md` and `docs/INDEX_STRATEGY.md` — explanations of the database structure and indexing strategy.
* `docs/DATABASE.md` (located in the root `docs/` folder) — design decisions, implementation notes, and a known inconsistency in the original specification.

You'll also find a `README.md` in this folder. It serves as the technical reference for the database and is worth reading after you've completed the setup.

---

# Before you start: two things I had to fix

## 1. Seed script on newer Node.js versions

If you are using Node.js 22 or later, running `npm run seed` without a `tsconfig.json` file may produce a confusing `Cannot find module` error.

This package already includes the required `tsconfig.json` file and uses `"type": "commonjs"` in `package.json`, so you don't need to make any changes. I'm mentioning it only so you'll recognize the issue if you encounter it elsewhere.

---

## 2. Special characters in your PostgreSQL password

If your PostgreSQL password contains characters such as `@`, `:`, `/`, or `#`, they must be URL-encoded inside the `DATABASE_URL`.

For example, if your password is:

```text
F@b3456b
```

Your connection string should look like this:

```text
DATABASE_URL="postgresql://postgres:F%40b3456b@localhost:5432/lumavok_real_estate"
```

Here, `@` becomes `%40`.

If your password contains only letters and numbers, you can ignore this section.

---

# Setting up the database

This guide assumes you already have Node.js and PostgreSQL installed.

## 1. Extract the package

Unzip the package and open a terminal inside the `database` folder.

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Create a local database

Create a PostgreSQL database. You can choose any name. The example below uses `lumavok_real_estate`.

```bash
psql -U postgres -c "CREATE DATABASE lumavok_real_estate;"
```

Enter your PostgreSQL password when prompted.

---

## 4. Configure the environment file

Copy the example environment file.

```bash
cp .env.example .env
```

Open `.env` and update the `DATABASE_URL` with your own username, password, and database name.

```text
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/lumavok_real_estate"
```

If your password contains special characters, remember to URL-encode them as explained earlier.

---

## 5. Generate the Prisma Client

```bash
npx prisma generate
```

You should see:

```text
Generated Prisma Client
```

If Prisma suggests upgrading to a newer major version, ignore it for now. We should upgrade intentionally rather than during development.

---

## 6. Apply the migrations

Run the following command to create all database tables.

```bash
npx prisma migrate deploy
```

You should see:

```text
All migrations have been successfully applied.
```

---

## 7. Load the sample data

```bash
npm run seed
```

The script should load:

* 2 cities
* 7 districts
* 10 features
* 3 developers
* 8 properties

It should finish with:

```text
Seed complete.
```

---

## 8. Verify the setup

You can inspect the database visually with Prisma Studio:

```bash
npx prisma studio
```

Or check the tables from the command line:

```bash
psql -U postgres -d lumavok_real_estate -c "\dt"
```

You should see all 14 tables.

If any step fails, send me the exact error message. Most setup issues have straightforward solutions, and I've already encountered the common ones.

---

# Known issue: accented characters

The seed data includes French words with accented characters such as `é`, `à`, and `ô`.

On some Windows terminals, these characters may display incorrectly because of a PostgreSQL encoding issue. This only affects how the text appears in the terminal—it does not affect the stored data or your application.

If you notice the issue anywhere outside the terminal, let me know before trying to fix it so we can investigate it properly.

---

# Backend Engineers — before you start the backend

Everything you need is available in `schema.prisma` and the generated Prisma Client after running:

```bash
npx prisma generate
```

A few important points:

* Use **soft deletes** for `Property` and `PropertyDeveloper`. Instead of deleting records, update the `deletedAt` field.
* Always exclude soft-deleted records in public queries by filtering with `deletedAt: null`. Most public queries should also filter by `status: 'ACTIVE'`.
* Keep the `favorite_count` field updated whenever a property is added to or removed from `PropertyFavorite`. Both operations should happen in the same transaction.
* Before creating a `Report`, verify that the `targetId` exists. Since a report can reference either a property or a developer, this validation must happen in the service layer.

For more details, see **Section 4** of `docs/DATABASE.md`.

---

# CTO — before building on top of this

Even if you're not working directly on the backend, it's useful to understand how the data is organized.

* Cities and districts come from predefined lists. Users cannot create new ones.
* Amenities (`Feature`) also come from a predefined list rather than free text.
* The `city` field on `PropertyDeveloper` is not linked to the `City` table used by properties. This is a known limitation in the original specification and is documented in `docs/DATABASE.md`.

---

# Keeping the documentation up to date

Please update the documentation whenever you make database changes.

### If you modify `schema.prisma`

* Create a new migration using:

```bash
npx prisma migrate dev --name describe_your_change
```

* Update `docs/INDEX_STRATEGY.md` or `docs/ER_DIAGRAM.md` if your changes affect indexes or relationships.
* If you make an important design decision, document it in `docs/DATABASE.md`.

---

### If you modify the seed scripts

Use `upsert` instead of `create` so the scripts can be safely run multiple times.

Always test by running:

```bash
npm run seed
```

twice and confirm that no duplicate data is created.

---

### If you find something incorrect

If any part of this handoff is outdated, unclear, or incorrect, please let me know instead of working around it. Updating the documentation now saves time for everyone later.

As a general rule, if a design decision isn't obvious from the code, document it in `docs/DATABASE.md` so future contributors understand the reasoning behind it.

---

Let me know how the setup goes. Also, please check with me before making changes to the database schema—even small ones—so we can avoid creating conflicting migrations.

— Clément_Sampebgo