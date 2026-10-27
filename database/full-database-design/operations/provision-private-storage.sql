-- APPROVAL/DEPLOYMENT STEP ONLY. Not run by application migrations.
-- Requires the Supabase Storage service. No changes to legacy objects.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('property-media','property-media',false,10485760,ARRAY['image/webp'])
ON CONFLICT(id) DO NOTHING;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM storage.buckets WHERE id='property-media' AND public) THEN
 RAISE EXCEPTION 'Expected private property-media bucket; review existing usage before changing it';
END IF; END $$;
-- No anon/authenticated object policies: all operations use the authorized
-- server bridge. The storage key is isolated from the ordinary runtime login.
