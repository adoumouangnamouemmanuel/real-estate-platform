-- Server-only runtime; anon/authenticated remain unable to access application tables.
BEGIN;
DO $$ BEGIN CREATE ROLE lumavok_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
-- Refuse to reuse an unsafe pre-existing runtime role.
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='lumavok_runtime' AND (rolsuper OR rolbypassrls OR rolcreaterole OR rolcreatedb)) THEN RAISE EXCEPTION 'Unsafe lumavok_runtime role'; END IF; END $$;
CREATE SCHEMA lumavok_private;
REVOKE ALL ON SCHEMA lumavok_private FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA public,lumavok_private TO lumavok_runtime;
CREATE FUNCTION lumavok_private.actor_id() RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$ SELECT nullif(current_setting('lumavok.user_id',true),'') $$;
CREATE FUNCTION lumavok_private.auth_id() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$ SELECT nullif(current_setting('lumavok.auth_user_id',true),'')::uuid $$;
CREATE FUNCTION lumavok_private.developer_id() RETURNS text LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$ SELECT nullif(current_setting('lumavok.developer_id',true),'') $$;
CREATE FUNCTION lumavok_private.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$ SELECT coalesce(current_setting('lumavok.role',true)='ADMIN',false) $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA lumavok_private FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA lumavok_private TO lumavok_runtime;
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."user" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."property_developer" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."property_developer" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."property" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."property" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."city" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."city" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."district" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."district" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."feature" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."feature" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."property_feature" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."property_feature" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."property_media" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."property_media" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."property_favorite" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."property_favorite" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."property_developer_rating" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."property_developer_rating" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."notification" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."notification" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."property_analytics" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."property_analytics" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."report" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."report" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."refresh_token" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."refresh_token" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."appointment" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."appointment" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."appointment_history" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."appointment_history" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."language" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."language" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."app_settings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."app_settings" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."property_translation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."property_translation" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."feature_translation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."feature_translation" FROM PUBLIC,anon,authenticated,lumavok_runtime;
ALTER TABLE public."property_developer_translation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."property_developer_translation" FROM PUBLIC,anon,authenticated,lumavok_runtime;
-- Existing policy names are not replaced silently. Audited schema had no policies.
GRANT SELECT(id,email,role,created_at,full_name,auth_user_id,preferred_language_code) ON public."user" TO lumavok_runtime;
GRANT INSERT(id,email,password_hash,role,full_name,auth_user_id,preferred_language_code,created_at) ON public."user" TO lumavok_runtime;
GRANT UPDATE(full_name,preferred_language_code,role,auth_user_id) ON public."user" TO lumavok_runtime;
CREATE POLICY user_read ON public."user" FOR SELECT TO lumavok_runtime USING(id=lumavok_private.actor_id() OR auth_user_id=lumavok_private.auth_id() OR lumavok_private.is_admin());
CREATE POLICY user_create ON public."user" FOR INSERT TO lumavok_runtime WITH CHECK(auth_user_id=lumavok_private.auth_id() AND role='USER');
CREATE POLICY user_update ON public."user" FOR UPDATE TO lumavok_runtime USING(id=lumavok_private.actor_id() OR lumavok_private.is_admin()) WITH CHECK(id=lumavok_private.actor_id() OR lumavok_private.is_admin());
CREATE FUNCTION lumavok_private.protect_user() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$ BEGIN
 IF NOT lumavok_private.is_admin() AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id) THEN RAISE EXCEPTION 'Privileged account fields' USING ERRCODE='42501'; END IF; RETURN NEW; END $$;
CREATE TRIGGER protect_user BEFORE UPDATE ON public."user" FOR EACH ROW EXECUTE FUNCTION lumavok_private.protect_user();
GRANT SELECT,INSERT ON public.property_developer TO lumavok_runtime;
GRANT UPDATE(business_name,whatsapp_number,phone_number,profile_image_url,profile_image_public_id,cover_image_url,cover_image_public_id,bio,years_of_experience,specialization,languages_spoken,address,city,city_id,public_email,updated_at,deleted_at,source_language_code,seller_status,is_verified,verified_since,activated_at,activated_by_user_id) ON public.property_developer TO lumavok_runtime;
CREATE POLICY developer_read ON public.property_developer FOR SELECT TO lumavok_runtime USING(
 (deleted_at IS NULL AND seller_status='ACTIVE') OR user_id=lumavok_private.actor_id() OR lumavok_private.is_admin());
CREATE POLICY developer_create ON public.property_developer FOR INSERT TO lumavok_runtime WITH CHECK(
 lumavok_private.is_admin() OR (user_id=lumavok_private.actor_id() AND seller_status='PENDING' AND NOT is_verified AND average_rating=0 AND total_ratings=0));
CREATE POLICY developer_update ON public.property_developer FOR UPDATE TO lumavok_runtime USING(user_id=lumavok_private.actor_id() OR lumavok_private.is_admin()) WITH CHECK(user_id=lumavok_private.actor_id() OR lumavok_private.is_admin());
CREATE FUNCTION lumavok_private.protect_developer() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$ BEGIN
 IF NOT lumavok_private.is_admin() AND (NEW.seller_status IS DISTINCT FROM OLD.seller_status OR NEW.is_verified IS DISTINCT FROM OLD.is_verified OR NEW.verified_since IS DISTINCT FROM OLD.verified_since OR NEW.activated_at IS DISTINCT FROM OLD.activated_at OR NEW.activated_by_user_id IS DISTINCT FROM OLD.activated_by_user_id) THEN RAISE EXCEPTION 'Privileged seller fields' USING ERRCODE='42501'; END IF; RETURN NEW; END $$;
CREATE TRIGGER protect_developer BEFORE UPDATE ON public.property_developer FOR EACH ROW EXECUTE FUNCTION lumavok_private.protect_developer();
GRANT SELECT,INSERT ON public.property TO lumavok_runtime;
GRANT UPDATE(title,description,category,listing_type,price,address,city_id,district_id,bedrooms,bathrooms,car_spaces,land_size_sq_m,building_size_sq_m,year_built,status,published_at,updated_at,deleted_at,source_language_code,currency_code,rent_period,row_version) ON public.property TO lumavok_runtime;
CREATE POLICY property_read ON public.property FOR SELECT TO lumavok_runtime USING(
 lumavok_private.is_admin() OR property_developer_id=lumavok_private.developer_id() OR
 (status='ACTIVE' AND deleted_at IS NULL AND EXISTS(SELECT 1 FROM public.property_developer d WHERE d.id=property_developer_id AND d.deleted_at IS NULL AND d.seller_status='ACTIVE')));
CREATE POLICY property_create ON public.property FOR INSERT TO lumavok_runtime WITH CHECK(
 lumavok_private.is_admin() OR (property_developer_id=lumavok_private.developer_id() AND view_count=0 AND whatsapp_click_count=0 AND favorite_count=0 AND
 EXISTS(SELECT 1 FROM public.property_developer d WHERE d.id=property_developer_id AND d.user_id=lumavok_private.actor_id() AND d.seller_status='ACTIVE' AND d.deleted_at IS NULL)));
CREATE POLICY property_update ON public.property FOR UPDATE TO lumavok_runtime USING(property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin()) WITH CHECK(property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin());
GRANT SELECT,INSERT,UPDATE ON public."city" TO lumavok_runtime;
CREATE POLICY city_read ON public."city" FOR SELECT TO lumavok_runtime USING(true);
CREATE POLICY city_admin_insert ON public."city" FOR INSERT TO lumavok_runtime WITH CHECK(lumavok_private.is_admin());
CREATE POLICY city_admin_update ON public."city" FOR UPDATE TO lumavok_runtime USING(lumavok_private.is_admin()) WITH CHECK(lumavok_private.is_admin());
GRANT SELECT,INSERT,UPDATE ON public."district" TO lumavok_runtime;
CREATE POLICY district_read ON public."district" FOR SELECT TO lumavok_runtime USING(true);
CREATE POLICY district_admin_insert ON public."district" FOR INSERT TO lumavok_runtime WITH CHECK(lumavok_private.is_admin());
CREATE POLICY district_admin_update ON public."district" FOR UPDATE TO lumavok_runtime USING(lumavok_private.is_admin()) WITH CHECK(lumavok_private.is_admin());
GRANT SELECT,INSERT,UPDATE ON public."feature" TO lumavok_runtime;
CREATE POLICY feature_read ON public."feature" FOR SELECT TO lumavok_runtime USING(true);
CREATE POLICY feature_admin_insert ON public."feature" FOR INSERT TO lumavok_runtime WITH CHECK(lumavok_private.is_admin());
CREATE POLICY feature_admin_update ON public."feature" FOR UPDATE TO lumavok_runtime USING(lumavok_private.is_admin()) WITH CHECK(lumavok_private.is_admin());
GRANT SELECT,INSERT,UPDATE ON public."language" TO lumavok_runtime;
CREATE POLICY language_read ON public."language" FOR SELECT TO lumavok_runtime USING(true);
CREATE POLICY language_admin_insert ON public."language" FOR INSERT TO lumavok_runtime WITH CHECK(lumavok_private.is_admin());
CREATE POLICY language_admin_update ON public."language" FOR UPDATE TO lumavok_runtime USING(lumavok_private.is_admin()) WITH CHECK(lumavok_private.is_admin());
GRANT SELECT,INSERT,UPDATE ON public."app_settings" TO lumavok_runtime;
CREATE POLICY app_settings_read ON public."app_settings" FOR SELECT TO lumavok_runtime USING(true);
CREATE POLICY app_settings_admin_insert ON public."app_settings" FOR INSERT TO lumavok_runtime WITH CHECK(lumavok_private.is_admin());
CREATE POLICY app_settings_admin_update ON public."app_settings" FOR UPDATE TO lumavok_runtime USING(lumavok_private.is_admin()) WITH CHECK(lumavok_private.is_admin());
GRANT SELECT,INSERT,UPDATE ON public."feature_translation" TO lumavok_runtime;
CREATE POLICY feature_translation_read ON public."feature_translation" FOR SELECT TO lumavok_runtime USING(true);
CREATE POLICY feature_translation_admin_insert ON public."feature_translation" FOR INSERT TO lumavok_runtime WITH CHECK(lumavok_private.is_admin());
CREATE POLICY feature_translation_admin_update ON public."feature_translation" FOR UPDATE TO lumavok_runtime USING(lumavok_private.is_admin()) WITH CHECK(lumavok_private.is_admin());
GRANT SELECT ON public."property_translation" TO lumavok_runtime;
CREATE POLICY property_translation_read ON public."property_translation" FOR SELECT TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id) AND (is_published OR EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin()))));
GRANT INSERT,DELETE ON public."property_translation" TO lumavok_runtime;
GRANT UPDATE(title,description,is_published,updated_at) ON public."property_translation" TO lumavok_runtime;
CREATE POLICY property_translation_insert ON public."property_translation" FOR INSERT TO lumavok_runtime WITH CHECK(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin())));
CREATE POLICY property_translation_update ON public."property_translation" FOR UPDATE TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin()))) WITH CHECK(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin())));
CREATE POLICY property_translation_delete ON public."property_translation" FOR DELETE TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin())));
GRANT SELECT ON public."property_feature" TO lumavok_runtime;
CREATE POLICY property_feature_read ON public."property_feature" FOR SELECT TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id));
GRANT INSERT,UPDATE,DELETE ON public."property_feature" TO lumavok_runtime;
CREATE POLICY property_feature_insert ON public."property_feature" FOR INSERT TO lumavok_runtime WITH CHECK(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin())));
CREATE POLICY property_feature_update ON public."property_feature" FOR UPDATE TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin()))) WITH CHECK(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin())));
CREATE POLICY property_feature_delete ON public."property_feature" FOR DELETE TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin())));
GRANT SELECT ON public."property_media" TO lumavok_runtime;
CREATE POLICY property_media_read ON public."property_media" FOR SELECT TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id));
GRANT INSERT,DELETE ON public."property_media" TO lumavok_runtime;
GRANT UPDATE(url,public_id,media_type,is_primary,"order",alt_text,storage_provider,storage_key) ON public."property_media" TO lumavok_runtime;
CREATE POLICY property_media_insert ON public."property_media" FOR INSERT TO lumavok_runtime WITH CHECK(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin())));
CREATE POLICY property_media_update ON public."property_media" FOR UPDATE TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin()))) WITH CHECK(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin())));
CREATE POLICY property_media_delete ON public."property_media" FOR DELETE TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND (p.property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin())));
GRANT SELECT ON public."property_analytics" TO lumavok_runtime;
CREATE POLICY property_analytics_read ON public."property_analytics" FOR SELECT TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id));
GRANT SELECT,INSERT,UPDATE ON public.property_developer_translation TO lumavok_runtime;
CREATE POLICY developer_translation_read ON public.property_developer_translation FOR SELECT TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property_developer d WHERE d.id=developer_id));
CREATE POLICY developer_translation_insert ON public.property_developer_translation FOR INSERT TO lumavok_runtime WITH CHECK(developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin());
CREATE POLICY developer_translation_update ON public.property_developer_translation FOR UPDATE TO lumavok_runtime USING(developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin()) WITH CHECK(developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin());
GRANT SELECT,INSERT,DELETE ON public.property_favorite TO lumavok_runtime;
CREATE POLICY favorite_read ON public.property_favorite FOR SELECT TO lumavok_runtime USING(user_id=lumavok_private.actor_id());
CREATE POLICY favorite_insert ON public.property_favorite FOR INSERT TO lumavok_runtime WITH CHECK(user_id=lumavok_private.actor_id() AND EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND p.status='ACTIVE' AND p.deleted_at IS NULL));
CREATE POLICY favorite_delete ON public.property_favorite FOR DELETE TO lumavok_runtime USING(user_id=lumavok_private.actor_id());
GRANT SELECT,INSERT ON public.property_developer_rating TO lumavok_runtime;
CREATE POLICY rating_read ON public.property_developer_rating FOR SELECT TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.property_developer d WHERE d.id=property_developer_id));
CREATE POLICY rating_insert ON public.property_developer_rating FOR INSERT TO lumavok_runtime WITH CHECK(rater_user_id=lumavok_private.actor_id());
GRANT SELECT ON public.notification TO lumavok_runtime;
GRANT UPDATE(status,read_at) ON public.notification TO lumavok_runtime;
CREATE POLICY notification_read ON public.notification FOR SELECT TO lumavok_runtime USING(property_developer_id=lumavok_private.developer_id() OR lumavok_private.is_admin());
CREATE POLICY notification_update ON public.notification FOR UPDATE TO lumavok_runtime USING(property_developer_id=lumavok_private.developer_id()) WITH CHECK(property_developer_id=lumavok_private.developer_id());
GRANT SELECT,INSERT ON public.appointment TO lumavok_runtime;
GRANT UPDATE(scheduled_for,previous_scheduled_for,status,updated_at) ON public.appointment TO lumavok_runtime;
CREATE POLICY appointment_read ON public.appointment FOR SELECT TO lumavok_runtime USING(property_developer_id=lumavok_private.developer_id() OR client_user_id=lumavok_private.actor_id() OR lumavok_private.is_admin());
CREATE POLICY appointment_insert ON public.appointment FOR INSERT TO lumavok_runtime WITH CHECK(client_user_id=lumavok_private.actor_id() AND EXISTS(SELECT 1 FROM public.property p WHERE p.id=property_id AND p.status='ACTIVE' AND p.deleted_at IS NULL));
CREATE POLICY appointment_update ON public.appointment FOR UPDATE TO lumavok_runtime USING(property_developer_id=lumavok_private.developer_id()) WITH CHECK(property_developer_id=lumavok_private.developer_id());
GRANT SELECT,INSERT ON public.appointment_history TO lumavok_runtime;
CREATE POLICY history_read ON public.appointment_history FOR SELECT TO lumavok_runtime USING(EXISTS(SELECT 1 FROM public.appointment a WHERE a.id=appointment_id));
CREATE POLICY history_insert ON public.appointment_history FOR INSERT TO lumavok_runtime WITH CHECK(EXISTS(SELECT 1 FROM public.appointment a WHERE a.id=appointment_id AND (a.property_developer_id=lumavok_private.developer_id() OR a.client_user_id=lumavok_private.actor_id())));
GRANT SELECT,INSERT ON public.report TO lumavok_runtime;
GRANT UPDATE(status,resolution_note,updated_at) ON public.report TO lumavok_runtime;
CREATE POLICY report_read ON public.report FOR SELECT TO lumavok_runtime USING(reporter_user_id=lumavok_private.actor_id() OR lumavok_private.is_admin());
CREATE POLICY report_insert ON public.report FOR INSERT TO lumavok_runtime WITH CHECK(reporter_user_id=lumavok_private.actor_id() AND status='OPEN' AND resolution_note IS NULL);
CREATE POLICY report_admin_update ON public.report FOR UPDATE TO lumavok_runtime USING(lumavok_private.is_admin()) WITH CHECK(lumavok_private.is_admin());
-- Legacy refresh_token and migration history have no runtime grants or policies.
DO $$ BEGIN IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
 ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
 REVOKE ALL ON public._prisma_migrations FROM PUBLIC,anon,authenticated,lumavok_runtime;
END IF; END $$;
-- Defaults for the migration owner; avoid changing other services' role defaults.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM PUBLIC,anon,authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC,anon,authenticated;

-- A narrow trigger is deliberately SECURITY DEFINER: a buyer must not receive
-- UPDATE access to a seller's aggregate. No input parameters or callable API;
-- it only applies +/-1 for an actual committed favorite event.
CREATE FUNCTION lumavok_private.favorite_counter() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN
 IF TG_OP='INSERT' THEN UPDATE public.property SET favorite_count=favorite_count+1 WHERE id=NEW.property_id; RETURN NEW;
 ELSE UPDATE public.property SET favorite_count=favorite_count-1 WHERE id=OLD.property_id; RETURN OLD; END IF; END $$;
CREATE TRIGGER favorite_counter AFTER INSERT OR DELETE ON public.property_favorite FOR EACH ROW EXECUTE FUNCTION lumavok_private.favorite_counter();

-- Publication checks see the final transaction state after media and translations.
CREATE FUNCTION lumavok_private.validate_publication() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE pid text; p public.property; BEGIN
 IF TG_TABLE_NAME='property' THEN pid:=NEW.id; ELSE pid:=coalesce(NEW.property_id,OLD.property_id); END IF;
 SELECT * INTO p FROM public.property WHERE id=pid;
 IF p.status='ACTIVE' AND p.deleted_at IS NULL THEN
  IF p.source_language_code IS NULL OR p.currency_code IS NULL OR (p.listing_type='RENT' AND p.rent_period IS NULL) OR p.price<=0 OR btrim(p.address)='' OR (p.category='LAND' AND p.land_size_sq_m IS NULL) OR
   NOT EXISTS(SELECT 1 FROM public.property_media m WHERE m.property_id=p.id) OR
   NOT EXISTS(SELECT 1 FROM public.property_translation t WHERE t.property_id=p.id AND t.language_code=p.source_language_code AND t.is_published) THEN
   RAISE EXCEPTION 'Listing is incomplete for publication' USING ERRCODE='23514';
  END IF;
 END IF; RETURN NULL; END $$;
CREATE CONSTRAINT TRIGGER property_publication AFTER INSERT OR UPDATE ON public.property DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumavok_private.validate_publication();
CREATE CONSTRAINT TRIGGER media_publication AFTER DELETE OR UPDATE ON public.property_media DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumavok_private.validate_publication();
CREATE CONSTRAINT TRIGGER translation_publication AFTER DELETE OR UPDATE ON public.property_translation DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION lumavok_private.validate_publication();
CREATE FUNCTION lumavok_private.session_active(sid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM auth.sessions s WHERE s.id=sid AND s.user_id=nullif(current_setting('lumavok.auth_user_id',true),'')::uuid)
$$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA lumavok_private FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION lumavok_private.session_active(uuid) TO lumavok_runtime;
GRANT EXECUTE ON FUNCTION lumavok_private.protect_user(),lumavok_private.protect_developer(),lumavok_private.validate_publication() TO lumavok_runtime;
REVOKE ALL ON FUNCTION lumavok_private.favorite_counter() FROM lumavok_runtime;
COMMIT;
