-- ============================================
-- Fix: Tighten Storage RLS + Add WITH CHECK clauses
-- Run this in Supabase SQL Editor
-- ============================================

-- ─── 1. Tighten Storage Bucket RLS ───
-- Drop overly permissive policies (any authenticated user could read any PDF)
DROP POLICY IF EXISTS "practice_read_own_pdfs" ON storage.objects;
DROP POLICY IF EXISTS "practice_upload_pdfs" ON storage.objects;

-- Recreate with practice-scoped access (PDFs stored under {practice_id}/{batch_id}/...)
CREATE POLICY "practice_upload_pdfs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'eob-pdfs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM practices WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "practice_read_own_pdfs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'eob-pdfs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM practices WHERE auth_id = auth.uid()
    )
  );

-- Allow deleting own PDFs (for batch deletion)
CREATE POLICY "practice_delete_own_pdfs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'eob-pdfs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM practices WHERE auth_id = auth.uid()
    )
  );


-- ─── 2. Add explicit WITH CHECK clauses to all table policies ───

-- practices
DROP POLICY IF EXISTS "users_own_practice" ON practices;
CREATE POLICY "users_own_practice" ON practices
  FOR ALL
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- batches
DROP POLICY IF EXISTS "practices_own_batches" ON batches;
CREATE POLICY "practices_own_batches" ON batches
  FOR ALL
  USING (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()))
  WITH CHECK (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()));

-- eob_extractions
DROP POLICY IF EXISTS "practices_own_eobs" ON eob_extractions;
CREATE POLICY "practices_own_eobs" ON eob_extractions
  FOR ALL
  USING (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()))
  WITH CHECK (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()));

-- eob_line_items
DROP POLICY IF EXISTS "practices_own_line_items" ON eob_line_items;
CREATE POLICY "practices_own_line_items" ON eob_line_items
  FOR ALL
  USING (eob_extraction_id IN (
    SELECT id FROM eob_extractions WHERE practice_id IN (
      SELECT id FROM practices WHERE auth_id = auth.uid()
    )
  ))
  WITH CHECK (eob_extraction_id IN (
    SELECT id FROM eob_extractions WHERE practice_id IN (
      SELECT id FROM practices WHERE auth_id = auth.uid()
    )
  ));

-- payer_templates
DROP POLICY IF EXISTS "practices_own_templates" ON payer_templates;
CREATE POLICY "practices_own_templates" ON payer_templates
  FOR ALL
  USING (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()))
  WITH CHECK (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()));

-- audit_log
DROP POLICY IF EXISTS "practices_own_audit" ON audit_log;
CREATE POLICY "practices_own_audit" ON audit_log
  FOR ALL
  USING (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()))
  WITH CHECK (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()));

-- feedback (already has WITH CHECK on INSERT, just add to SELECT policy for consistency)
-- feedback INSERT policy already has WITH CHECK ✅
-- feedback SELECT policy already has USING ✅
