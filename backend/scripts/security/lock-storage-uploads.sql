-- Run after the secure backend upload endpoint is deployed and smoke-tested.
-- The products bucket remains public for reads, but anonymous users can no
-- longer insert arbitrary files. Backend uploads use SUPABASE_SERVICE_ROLE.

BEGIN;
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
COMMIT;
