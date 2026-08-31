-- Migration: 20260629000000_init
-- LUMAVOK Real Estate Platform — Initial schema
-- Generated to match `prisma migrate dev` output for schema.prisma.
-- Do not hand-edit this file once it has been applied to a shared
-- environment; create a new migration instead.

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE "Role" AS ENUM ('USER', 'PROPERTY_DEVELOPER');
CREATE TYPE "PropertyCategory" AS ENUM ('APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL');
CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT');
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESERVED', 'SOLD');
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');
CREATE TYPE "TransactionType" AS ENUM ('SALE', 'RENT', 'OTHER');
CREATE TYPE "NotificationType" AS ENUM ('PROPERTY_LIKED', 'PROPERTY_VIEWED_MILESTONE');
CREATE TYPE "ReportTargetType" AS ENUM ('PROPERTY', 'PROPERTY_DEVELOPER');
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_developer" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "business_name" TEXT,
    "whatsapp_number" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "profile_image_url" TEXT NOT NULL,
    "profile_image_public_id" TEXT NOT NULL,
    "cover_image_url" TEXT,
    "cover_image_public_id" TEXT,
    "bio" TEXT,
    "years_of_experience" INTEGER,
    "specialization" TEXT,
    "languages_spoken" TEXT,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_since" TIMESTAMP(3),
    "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "total_ratings" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "property_developer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property" (
    "id" TEXT NOT NULL,
    "property_developer_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "PropertyCategory" NOT NULL,
    "listing_type" "ListingType" NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,
    "address" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "district_id" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "car_spaces" INTEGER,
    "land_size_sq_m" DECIMAL(10,2),
    "building_size_sq_m" DECIMAL(10,2),
    "year_built" INTEGER,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_click_count" INTEGER NOT NULL DEFAULT 0,
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "city" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "district" (
    "id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "district_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "feature" (
    "id" TEXT NOT NULL,
    "feature_name" TEXT NOT NULL,
    "category" TEXT,
    "icon_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_feature" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "feature_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_feature_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_media" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "media_type" "MediaType" NOT NULL DEFAULT 'IMAGE',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "alt_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_media_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_favorite" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_favorite_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_developer_rating" (
    "id" TEXT NOT NULL,
    "rater_user_id" TEXT NOT NULL,
    "property_developer_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "transaction_type" "TransactionType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_developer_rating_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "property_developer_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_analytics" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "whatsapp_clicks" INTEGER NOT NULL DEFAULT 0,
    "favorites" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "reporter_user_id" TEXT,
    "target_type" "ReportTargetType" NOT NULL,
    "target_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "refresh_token" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- ─────────────────────────────────────────────
-- UNIQUE CONSTRAINTS
-- ─────────────────────────────────────────────

CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
CREATE UNIQUE INDEX "property_developer_user_id_key" ON "property_developer"("user_id");
CREATE UNIQUE INDEX "property_slug_key" ON "property"("slug");
CREATE UNIQUE INDEX "city_name_key" ON "city"("name");
CREATE UNIQUE INDEX "idx_district_city_name" ON "district"("city_id", "name");
CREATE UNIQUE INDEX "feature_feature_name_key" ON "feature"("feature_name");
CREATE UNIQUE INDEX "uq_property_feature" ON "property_feature"("property_id", "feature_id");
CREATE UNIQUE INDEX "uq_favorite_user_property" ON "property_favorite"("user_id", "property_id");
CREATE UNIQUE INDEX "uq_rating_rater_developer" ON "property_developer_rating"("rater_user_id", "property_developer_id");
CREATE UNIQUE INDEX "idx_analytics_property_date" ON "property_analytics"("property_id", "date");
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- ─────────────────────────────────────────────
-- INDEXES (see docs/INDEX_STRATEGY.md for rationale)
-- ─────────────────────────────────────────────

CREATE INDEX "idx_developer_verified" ON "property_developer"("is_verified");
CREATE INDEX "idx_developer_rating" ON "property_developer"("average_rating");
CREATE INDEX "idx_developer_city" ON "property_developer"("city");

CREATE INDEX "idx_property_status" ON "property"("status");
CREATE INDEX "idx_property_city" ON "property"("city_id");
CREATE INDEX "idx_property_district" ON "property"("district_id");
CREATE INDEX "idx_property_listing_type" ON "property"("listing_type");
CREATE INDEX "idx_property_price" ON "property"("price");
CREATE INDEX "idx_property_developer" ON "property"("property_developer_id");
CREATE INDEX "idx_property_category" ON "property"("category");
CREATE INDEX "idx_property_created" ON "property"("created_at");

CREATE INDEX "idx_district_city" ON "district"("city_id");

CREATE INDEX "idx_property_feature_property" ON "property_feature"("property_id");
CREATE INDEX "idx_property_feature_feature" ON "property_feature"("feature_id");

CREATE INDEX "idx_media_property" ON "property_media"("property_id");
CREATE INDEX "idx_media_primary" ON "property_media"("property_id", "is_primary");

CREATE INDEX "idx_favorite_user" ON "property_favorite"("user_id");
CREATE INDEX "idx_favorite_property" ON "property_favorite"("property_id");

CREATE INDEX "idx_rating_developer" ON "property_developer_rating"("property_developer_id");
CREATE INDEX "idx_rating_rater" ON "property_developer_rating"("rater_user_id");

CREATE INDEX "idx_notification_developer" ON "notification"("property_developer_id");
CREATE INDEX "idx_notification_read" ON "notification"("property_developer_id", "is_read");

CREATE INDEX "idx_report_status" ON "report"("status");
CREATE INDEX "idx_report_target" ON "report"("target_type", "target_id");

CREATE INDEX "idx_token_user" ON "refresh_token"("user_id");
CREATE INDEX "idx_token_hash" ON "refresh_token"("token_hash");

-- ─────────────────────────────────────────────
-- FOREIGN KEYS
-- ─────────────────────────────────────────────

ALTER TABLE "property_developer" ADD CONSTRAINT "property_developer_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property" ADD CONSTRAINT "property_property_developer_id_fkey"
    FOREIGN KEY ("property_developer_id") REFERENCES "property_developer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "property" ADD CONSTRAINT "property_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "property" ADD CONSTRAINT "property_district_id_fkey"
    FOREIGN KEY ("district_id") REFERENCES "district"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "district" ADD CONSTRAINT "district_city_id_fkey"
    FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_feature" ADD CONSTRAINT "property_feature_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_feature" ADD CONSTRAINT "property_feature_feature_id_fkey"
    FOREIGN KEY ("feature_id") REFERENCES "feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_media" ADD CONSTRAINT "property_media_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_favorite" ADD CONSTRAINT "property_favorite_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_favorite" ADD CONSTRAINT "property_favorite_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_developer_rating" ADD CONSTRAINT "property_developer_rating_rater_user_id_fkey"
    FOREIGN KEY ("rater_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "property_developer_rating" ADD CONSTRAINT "property_developer_rating_property_developer_id_fkey"
    FOREIGN KEY ("property_developer_id") REFERENCES "property_developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification" ADD CONSTRAINT "notification_property_developer_id_fkey"
    FOREIGN KEY ("property_developer_id") REFERENCES "property_developer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "property_analytics" ADD CONSTRAINT "property_analytics_property_id_fkey"
    FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "report" ADD CONSTRAINT "report_reporter_user_id_fkey"
    FOREIGN KEY ("reporter_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────
-- CHECK CONSTRAINTS (README §4 "The Rules")
-- ─────────────────────────────────────────────

-- Rating must be 1-5.
ALTER TABLE "property_developer_rating" ADD CONSTRAINT "chk_rating_score_range"
    CHECK ("score" >= 1 AND "score" <= 5);

-- Price cannot be negative.
ALTER TABLE "property" ADD CONSTRAINT "chk_property_price_non_negative"
    CHECK ("price" >= 0);

-- Defensive bounds on physical attributes (not explicitly in README but
-- consistent with its intent — catches bad data entry early).
ALTER TABLE "property" ADD CONSTRAINT "chk_property_bedrooms_non_negative"
    CHECK ("bedrooms" IS NULL OR "bedrooms" >= 0);
ALTER TABLE "property" ADD CONSTRAINT "chk_property_bathrooms_non_negative"
    CHECK ("bathrooms" IS NULL OR "bathrooms" >= 0);
ALTER TABLE "property" ADD CONSTRAINT "chk_property_car_spaces_non_negative"
    CHECK ("car_spaces" IS NULL OR "car_spaces" >= 0);
ALTER TABLE "property" ADD CONSTRAINT "chk_property_land_size_positive"
    CHECK ("land_size_sq_m" IS NULL OR "land_size_sq_m" > 0);
ALTER TABLE "property" ADD CONSTRAINT "chk_property_building_size_positive"
    CHECK ("building_size_sq_m" IS NULL OR "building_size_sq_m" > 0);

-- average_rating must stay within the 0-5 star range it represents.
ALTER TABLE "property_developer" ADD CONSTRAINT "chk_developer_average_rating_range"
    CHECK ("average_rating" >= 0 AND "average_rating" <= 5);
