-- ============================================
-- EOB Reader — Initial Database Schema
-- ============================================

-- Users / Practices
CREATE TABLE practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  auth_id UUID REFERENCES auth.users(id),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'pro', 'canceled', 'expired')),
  trial_start_date TIMESTAMPTZ DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  polar_customer_id TEXT,
  polar_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  default_pms TEXT DEFAULT 'dentrix' CHECK (default_pms IN ('dentrix', 'eaglesoft', 'open_dental')),
  daily_upload_count INT DEFAULT 0,
  daily_upload_reset_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EOB Batches
CREATE TABLE batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  name TEXT,
  total_eobs INT DEFAULT 0,
  processed_eobs INT DEFAULT 0,
  approved_eobs INT DEFAULT 0,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'exported', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual EOB extractions
CREATE TABLE eob_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  pdf_storage_path TEXT NOT NULL,
  payer_name TEXT,
  payer_id TEXT,
  patient_name TEXT,
  patient_dob DATE,
  patient_id TEXT,
  subscriber_name TEXT,
  subscriber_id TEXT,
  group_number TEXT,
  claim_number TEXT,
  date_of_service DATE,
  provider_name TEXT,
  provider_npi TEXT,
  check_number TEXT,
  check_date DATE,
  check_amount DECIMAL(10,2),
  total_billed DECIMAL(10,2),
  total_allowed DECIMAL(10,2),
  total_insurance_paid DECIMAL(10,2),
  total_patient_responsibility DECIMAL(10,2),
  total_adjustments DECIMAL(10,2),
  remarks TEXT,
  raw_extraction JSONB,
  confidence_score DECIMAL(3,2),
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'flagged', 'rejected')),
  reviewed_by UUID REFERENCES practices(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Line items per EOB
CREATE TABLE eob_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eob_extraction_id UUID REFERENCES eob_extractions(id) ON DELETE CASCADE,
  procedure_code TEXT,
  procedure_description TEXT,
  tooth_number TEXT,
  date_of_service DATE,
  billed_amount DECIMAL(10,2),
  allowed_amount DECIMAL(10,2),
  insurance_paid DECIMAL(10,2),
  patient_responsibility DECIMAL(10,2),
  deductible_applied DECIMAL(10,2),
  copay DECIMAL(10,2),
  coinsurance DECIMAL(10,2),
  adjustment_amount DECIMAL(10,2),
  adjustment_code TEXT,
  adjustment_description TEXT,
  remark_codes TEXT[],
  remark_description TEXT,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payer templates (Stickiness Engine)
CREATE TABLE payer_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  payer_name TEXT NOT NULL,
  payer_id TEXT,
  sample_extraction JSONB,
  extraction_notes TEXT,
  times_seen INT DEFAULT 1,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE practices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_practice" ON practices
  FOR ALL USING (auth_id = auth.uid());

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "practices_own_batches" ON batches
  FOR ALL USING (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()));

ALTER TABLE eob_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "practices_own_eobs" ON eob_extractions
  FOR ALL USING (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()));

ALTER TABLE eob_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "practices_own_line_items" ON eob_line_items
  FOR ALL USING (eob_extraction_id IN (
    SELECT id FROM eob_extractions WHERE practice_id IN (
      SELECT id FROM practices WHERE auth_id = auth.uid()
    )
  ));

ALTER TABLE payer_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "practices_own_templates" ON payer_templates
  FOR ALL USING (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()));

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "practices_own_audit" ON audit_log
  FOR ALL USING (practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid()));

-- ============================================
-- Storage bucket for EOB PDFs
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('eob-pdfs', 'eob-pdfs', false, 52428800, ARRAY['application/pdf']);

-- Storage RLS
CREATE POLICY "practice_upload_pdfs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'eob-pdfs' AND auth.uid() IS NOT NULL);

CREATE POLICY "practice_read_own_pdfs" ON storage.objects
  FOR SELECT USING (bucket_id = 'eob-pdfs' AND auth.uid() IS NOT NULL);

-- ============================================
-- Function to create practice on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.practices (auth_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
