-- Independently authored reconciliation of the audited database. These are NOT
-- replacements for the missing August migration files/checksums. Deploy gate
-- blocks production until that history has been recovered and verified.
ALTER TYPE public."Role" ADD VALUE IF NOT EXISTS 'ADMIN';
ALTER TYPE public."PropertyStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';
ALTER TYPE public."PropertyCategory" ADD VALUE IF NOT EXISTS 'OFFICE';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_REQUESTED';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_CONFIRMED';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_CANCELLED';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_RESCHEDULED';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_COMPLETED';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'APPOINTMENT_NO_SHOW';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_PUBLISHED';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'LISTING_SUSPENDED';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'DRAFT_REMINDER';
ALTER TYPE public."NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM';
DO $$ BEGIN CREATE TYPE public."AppointmentStatus" AS ENUM ('REQUESTED','CONFIRMED','RESCHEDULED','COMPLETED','CANCELLED','NO_SHOW'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public."NotificationStatus" AS ENUM ('UNREAD','READ','ARCHIVED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Commit before any later migration uses newly added enum labels.
