-- ============================================
-- Feedback table for user suggestions
-- ============================================

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID REFERENCES practices(id) ON DELETE SET NULL,
  user_email TEXT,
  category TEXT DEFAULT 'suggestion' CHECK (category IN ('suggestion', 'bug', 'feature', 'other')),
  message TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can insert their own feedback, only admin can read all
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_submit_feedback" ON feedback
  FOR INSERT WITH CHECK (
    practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid())
  );

CREATE POLICY "users_can_view_own_feedback" ON feedback
  FOR SELECT USING (
    practice_id IN (SELECT id FROM practices WHERE auth_id = auth.uid())
  );
