-- =============================================================================
-- Phase S4: Supabase Storage RLS Policies
-- =============================================================================
-- Bucket path convention:
--   resident-documents : <society-id>/residents/<resident-id>/<uuid>.<ext>
--   generated-pdfs     : <society-id>/generated/<owner-id>/<filename>.<ext>
--
-- Buckets are private (created via admin API, not SQL).
-- NestJS uses service_role key → bypasses RLS → can always write.
-- authenticated role → subject to policies below → read-only via signed URLs.
-- =============================================================================

-- ─── Storage helper: extract society UUID from object path (position 1) ───────
-- Path: <society-id>/residents/<resident-id>/filename.ext
-- (storage.foldername returns text[], Postgres arrays are 1-indexed)

-- ─── Bucket: resident-documents ──────────────────────────────────────────────

-- Admins: read documents in their society
CREATE POLICY "s4_admin_select_resident_documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resident-documents'
    AND array_length(storage.foldername(name), 1) >= 3
    AND private.has_permission(
          (storage.foldername(name))[1]::uuid,
          'RESIDENT_DOCUMENT_READ'
        )
  );

-- Residents: read own documents only
CREATE POLICY "s4_resident_select_own_documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'resident-documents'
    AND array_length(storage.foldername(name), 1) >= 3
    AND private.owns_resident((storage.foldername(name))[3]::uuid)
  );

-- Nobody (authenticated) can upload directly — all uploads go through NestJS
-- which uses service_role key. Deny explicit INSERT/UPDATE/DELETE.
CREATE POLICY "s4_deny_direct_upload_resident_documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "s4_deny_direct_update_resident_documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "s4_deny_direct_delete_resident_documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (false);

-- ─── Bucket: generated-pdfs ──────────────────────────────────────────────────
-- Path: <society-id>/generated/<owner-id>/<filename>.pdf
-- Covers: resident ID cards, payment receipts, salary slips

-- Admins: read generated PDFs in their society
CREATE POLICY "s4_admin_select_generated_pdfs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'generated-pdfs'
    AND array_length(storage.foldername(name), 1) >= 3
    AND private.has_permission(
          (storage.foldername(name))[1]::uuid,
          'RESIDENT_READ'
        )
  );

-- Residents: read own generated PDFs (ID cards)
CREATE POLICY "s4_resident_select_own_generated_pdfs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'generated-pdfs'
    AND array_length(storage.foldername(name), 1) >= 3
    AND private.owns_resident((storage.foldername(name))[3]::uuid)
  );

-- Deny direct write for authenticated users
CREATE POLICY "s4_deny_direct_upload_generated_pdfs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "s4_deny_direct_update_generated_pdfs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "s4_deny_direct_delete_generated_pdfs"
  ON storage.objects FOR DELETE TO authenticated
  USING (false);
