-- REVIEWED OPERATOR STEP ONLY. Bind $1=existing app CUID, $2=verified Auth UUID.
-- Use a migration-owner connection; runtime cannot use this as an open API.
-- Do not map accounts from editable user_metadata or an unverified email.
BEGIN;
SELECT set_config('lumavok.role','ADMIN',true);
UPDATE public."user" u SET auth_user_id=a.id
FROM auth.users a
WHERE u.id=$1 AND a.id=$2::uuid AND a.email_confirmed_at IS NOT NULL
AND lower(u.email)=lower(a.email) AND u.auth_user_id IS NULL
RETURNING u.id;
-- Require exactly one mapped row; if zero or ambiguous, ROLLBACK and investigate.
COMMIT;
-- The project owner separately selects the first administrator. No automatic
-- promotion and no credential/hash import is included in this operation.
