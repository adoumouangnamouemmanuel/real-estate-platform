BEGIN;
ALTER TABLE public."user" ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.notification ADD COLUMN IF NOT EXISTS status public."NotificationStatus" NOT NULL DEFAULT 'UNREAD';
ALTER TABLE public.notification ADD COLUMN IF NOT EXISTS link text;
-- Retain legacy is_read if it exists; never drop data to reconcile history.
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notification' AND column_name='is_read') THEN
  UPDATE public.notification SET status=CASE WHEN is_read THEN 'READ'::public."NotificationStatus" ELSE 'UNREAD'::public."NotificationStatus" END;
END IF; END $$;
CREATE TABLE IF NOT EXISTS public.appointment (
 id text PRIMARY KEY, property_id text NOT NULL REFERENCES public.property(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 property_developer_id text NOT NULL REFERENCES public.property_developer(id) ON DELETE CASCADE ON UPDATE CASCADE,
 client_user_id text NOT NULL REFERENCES public."user"(id) ON DELETE RESTRICT ON UPDATE CASCADE,
 client_name text NOT NULL, scheduled_for timestamp(3) NOT NULL, previous_scheduled_for timestamp(3),
 status public."AppointmentStatus" NOT NULL DEFAULT 'REQUESTED', created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at timestamp(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.appointment_history (
 id text PRIMARY KEY, appointment_id text NOT NULL REFERENCES public.appointment(id) ON DELETE CASCADE ON UPDATE CASCADE,
 type text NOT NULL, message text NOT NULL, created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_appointment_developer ON public.appointment(property_developer_id);
CREATE INDEX IF NOT EXISTS idx_appointment_property ON public.appointment(property_id);
CREATE INDEX IF NOT EXISTS idx_appointment_client ON public.appointment(client_user_id);
CREATE INDEX IF NOT EXISTS idx_appointment_status ON public.appointment(status);
CREATE INDEX IF NOT EXISTS idx_appointment_scheduled ON public.appointment(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment ON public.appointment_history(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_status ON public.notification(property_developer_id,status);

CREATE TABLE public.language(code text PRIMARY KEY CHECK (code ~ '^[a-z]{2,3}(-[a-z0-9]{2,8})*$'), is_active boolean NOT NULL DEFAULT true);
INSERT INTO public.language(code) VALUES ('en'),('fr');
CREATE TABLE public.app_settings(id integer PRIMARY KEY DEFAULT 1 CHECK(id=1),
 default_language_code text NOT NULL DEFAULT 'fr' REFERENCES public.language(code),
 fallback_language_code text NOT NULL DEFAULT 'fr' REFERENCES public.language(code));
INSERT INTO public.app_settings(id) VALUES(1);
ALTER TABLE public."user" ADD COLUMN auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
 ADD COLUMN preferred_language_code text REFERENCES public.language(code);
ALTER TABLE public.property ADD COLUMN source_language_code text REFERENCES public.language(code),
 ADD COLUMN currency_code text CHECK(currency_code ~ '^[A-Z]{3}$'),
 ADD COLUMN rent_period text CHECK(rent_period IN ('DAY','WEEK','MONTH','YEAR')),
 ADD COLUMN row_version integer NOT NULL DEFAULT 1 CHECK(row_version>0);
-- Numeric amounts, source text and source-language labels are not guessed or overwritten.
ALTER TABLE public.city ADD COLUMN country_code text NOT NULL DEFAULT 'BF' CHECK(country_code ~ '^[A-Z]{2}$');
ALTER TABLE public.property_developer ADD COLUMN slug text,
 ADD COLUMN seller_status text NOT NULL DEFAULT 'PENDING' CHECK(seller_status IN ('PENDING','ACTIVE','SUSPENDED')),
 ADD COLUMN source_language_code text REFERENCES public.language(code),
 ADD COLUMN public_email text,
 ADD COLUMN activated_at timestamptz(3),
 ADD COLUMN activated_by_user_id text REFERENCES public."user"(id) ON DELETE RESTRICT,
 ADD COLUMN city_id text REFERENCES public.city(id) ON DELETE RESTRICT;
-- Preserve existing public developer slugs once; future name/language changes do not change URLs.
UPDATE public.property_developer d SET slug=coalesce(nullif(trim(BOTH '-' FROM regexp_replace(lower(coalesce(nullif(d.business_name,''),(SELECT nullif(u.full_name,'') FROM public."user" u WHERE u.id=d.user_id),d.id)),'[^a-z0-9]+','-','g')),''),d.id), seller_status='ACTIVE';
ALTER TABLE public.property_developer ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX property_developer_slug_key ON public.property_developer(slug);
ALTER TABLE public.feature ADD COLUMN code text, ADD COLUMN source_language_code text REFERENCES public.language(code);
UPDATE public.feature SET code=id;
ALTER TABLE public.feature ALTER COLUMN code SET NOT NULL;
CREATE UNIQUE INDEX feature_code_key ON public.feature(code);
ALTER TABLE public.property_media ADD COLUMN storage_provider text NOT NULL DEFAULT 'legacy' CHECK(storage_provider IN ('legacy','supabase')),
 ADD COLUMN storage_key text,
 ADD CONSTRAINT chk_media_storage CHECK(storage_provider<>'supabase' OR (storage_key IS NOT NULL AND storage_key<>''));
ALTER TABLE public.notification ADD COLUMN template_key text, ADD COLUMN template_params jsonb;
ALTER TABLE public.report ADD COLUMN property_id text REFERENCES public.property(id) ON DELETE RESTRICT,
 ADD COLUMN property_developer_id text REFERENCES public.property_developer(id) ON DELETE RESTRICT;
UPDATE public.report SET property_id=target_id WHERE target_type='PROPERTY';
UPDATE public.report SET property_developer_id=target_id WHERE target_type='PROPERTY_DEVELOPER';
ALTER TABLE public.report ADD CONSTRAINT chk_report_target CHECK(
 (target_type='PROPERTY' AND property_id=target_id AND property_id IS NOT NULL AND property_developer_id IS NULL) OR
 (target_type='PROPERTY_DEVELOPER' AND property_developer_id=target_id AND property_developer_id IS NOT NULL AND property_id IS NULL));

CREATE TABLE public.property_translation(
 property_id text NOT NULL REFERENCES public.property(id) ON DELETE CASCADE,
 language_code text NOT NULL REFERENCES public.language(code), title text NOT NULL, description text NOT NULL,
 is_published boolean NOT NULL DEFAULT false, updated_at timestamptz(3) NOT NULL DEFAULT now(),
 PRIMARY KEY(property_id,language_code),
 CONSTRAINT chk_translation_lengths CHECK(length(title)<=120 AND length(description)<=2000),
 CONSTRAINT chk_translation_complete CHECK(NOT is_published OR (length(btrim(title))>0 AND length(btrim(description))>0)));
CREATE TABLE public.feature_translation(
 feature_id text NOT NULL REFERENCES public.feature(id) ON DELETE CASCADE,
 language_code text NOT NULL REFERENCES public.language(code), name text NOT NULL CHECK(length(btrim(name)) BETWEEN 1 AND 120),
 updated_at timestamptz(3) NOT NULL DEFAULT now(), PRIMARY KEY(feature_id,language_code));
CREATE TABLE public.property_developer_translation(
 developer_id text NOT NULL REFERENCES public.property_developer(id) ON DELETE CASCADE,
 language_code text NOT NULL REFERENCES public.language(code), bio text, specialization text,
 updated_at timestamptz(3) NOT NULL DEFAULT now(), PRIMARY KEY(developer_id,language_code),
 CHECK(coalesce(length(bio),0)<=5000 AND coalesce(length(specialization),0)<=500));

-- Preserve legacy text exactly. Locale backfill is a separate reviewed manifest/script.
CREATE UNIQUE INDEX uq_district_id_city ON public.district(id,city_id);
ALTER TABLE public.property ADD CONSTRAINT property_district_city_fkey FOREIGN KEY(district_id,city_id) REFERENCES public.district(id,city_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public.property DROP CONSTRAINT property_district_id_fkey; -- composite RESTRICT replaces SET NULL
CREATE UNIQUE INDEX uq_property_id_developer ON public.property(id,property_developer_id);
ALTER TABLE public.appointment ADD CONSTRAINT appointment_property_developer_fkey FOREIGN KEY(property_id,property_developer_id) REFERENCES public.property(id,property_developer_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE public.property_media ADD CONSTRAINT chk_media_order CHECK("order">=0);
CREATE UNIQUE INDEX uq_media_property_order ON public.property_media(property_id,"order");
CREATE UNIQUE INDEX uq_media_one_primary ON public.property_media(property_id) WHERE is_primary;
ALTER TABLE public.property ADD CONSTRAINT chk_property_counters CHECK(view_count>=0 AND whatsapp_click_count>=0 AND favorite_count>=0);
ALTER TABLE public.property_developer ADD CONSTRAINT chk_developer_total_ratings CHECK(total_ratings>=0);
ALTER TABLE public.property_analytics ADD CONSTRAINT chk_analytics_counters CHECK(views>=0 AND whatsapp_clicks>=0 AND favorites>=0);
CREATE INDEX idx_property_owner_updated ON public.property(property_developer_id,updated_at DESC,id);
CREATE INDEX idx_property_public_city_created ON public.property(city_id,created_at DESC,id) WHERE status='ACTIVE' AND deleted_at IS NULL;
CREATE INDEX idx_appointment_owner_schedule ON public.appointment(property_developer_id,scheduled_for,id);
CREATE INDEX idx_notification_owner_status_created ON public.notification(property_developer_id,status,created_at DESC,id);
CREATE INDEX idx_report_reporter ON public.report(reporter_user_id);
-- Deny ordinary clients immediately, even if the subsequent policy migration fails.
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['language','app_settings','property_translation','feature_translation','property_developer_translation','appointment','appointment_history'] LOOP
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
END LOOP; END $$;
CREATE UNIQUE INDEX uq_user_email_casefold ON public."user"(lower(email));
COMMIT;
