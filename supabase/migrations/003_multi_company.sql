-- Phase 1: Multi-Company Support Migration
-- Graftscope + ClinixGlow Partnership Platform

-- =============================================
-- 1. COMPANIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#6366F1',
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. SEED COMPANIES DATA
-- =============================================
INSERT INTO companies (name, slug, primary_color, secondary_color) VALUES
  ('Graftscope', 'graftscope', '#3B82F6', '#6366F1'),
  ('ClinixGlow', 'clinixglow', '#10B981', '#059669')
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- 3. PARTNER_COMPANIES JUNCTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS partner_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  selected_company_id UUID, -- Default company for this partner-company combo
  access_level TEXT DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, company_id)
);

-- =============================================
-- 4. ADD COMPANY_ID TO EXISTING TABLES
-- =============================================
-- Partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Demo records table
ALTER TABLE demo_records ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE demo_records ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Commissions table
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE commissions ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Simulator sessions table
ALTER TABLE simulator_sessions ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE simulator_sessions ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Partner checklists table
ALTER TABLE partner_checklists ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Partner KPIs table
ALTER TABLE partner_kpis ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- =============================================
-- 5. ADMIN NOTES TABLE (for partner notes)
-- =============================================
CREATE TABLE IF NOT EXISTS partner_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'warning', 'kpi', 'payment', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. ACTIVITY LOGS (enhanced with company)
-- =============================================
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- =============================================
-- 7. VIEWS
-- =============================================

-- View: Partner with active company
CREATE OR REPLACE VIEW partners_with_company AS
SELECT 
  p.*,
  c.name as company_name,
  c.slug as company_slug,
  c.primary_color as company_color
FROM partners p
LEFT JOIN companies c ON p.company_id = c.id;

-- View: Leads with company info
CREATE OR REPLACE VIEW leads_with_company AS
SELECT 
  l.*,
  c.name as company_name,
  c.primary_color as company_color
FROM leads l
LEFT JOIN companies c ON l.company_id = c.id;

-- View: Demo records with company info
CREATE OR REPLACE VIEW demo_records_with_company AS
SELECT 
  dr.*,
  c.name as company_name,
  c.primary_color as company_color
FROM demo_records dr
LEFT JOIN companies c ON dr.company_id = c.id;

-- View: Partner monthly stats by company
CREATE OR REPLACE VIEW partner_monthly_stats_by_company AS
SELECT 
  partner_id,
  company_id,
  company_name,
  date_trunc('month', created_at) as month,
  COUNT(*) as total_leads,
  SUM(CASE WHEN status IN ('demo_scheduled', 'demo_done', 'trial_active') THEN 1 ELSE 0 END) as engaged_leads,
  SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_deals
FROM leads_with_company
GROUP BY partner_id, company_id, company_name, date_trunc('month', created_at);

-- =============================================
-- 8. FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for companies table
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. RLS POLICIES (Enable Row Level Security)
-- =============================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_notes ENABLE ROW LEVEL SECURITY;

-- Companies: Everyone can read
CREATE POLICY "Companies are viewable by everyone" ON companies
  FOR SELECT USING (true);

-- Companies: Only admins can modify
CREATE POLICY "Admins can modify companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN admins a ON a.user_id = u.id
      WHERE u.id = auth.uid()
    )
  );

-- Partner companies: Partners can read their own
CREATE POLICY "Partners can view their company assignments" ON partner_companies
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- Partner notes: Admins can do everything, partners can read their own notes
CREATE POLICY "Admins can manage all notes" ON partner_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      JOIN admins a ON a.user_id = u.id
      WHERE u.id = auth.uid()
    )
  );

CREATE POLICY "Partners can view their own notes" ON partner_notes
  FOR SELECT USING (
    partner_id IN (
      SELECT id FROM partners WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- 10. MIGRATE EXISTING DATA
-- =============================================
-- This assumes there's already a default company or we assign to first company
-- Update existing records to have company_id = first company (Graftscope)

DO $$
DECLARE
  graftscope_id UUID;
  clinixglow_id UUID;
BEGIN
  -- Get company IDs
  SELECT id INTO graftscope_id FROM companies WHERE slug = 'graftscope';
  SELECT id INTO clinixglow_id FROM companies WHERE slug = 'clinixglow';
  
  -- Update partners without company_id (assign to Graftscope by default)
  UPDATE partners SET 
    company_id = COALESCE(company_id, graftscope_id),
    company_name = COALESCE(company_name, 'Graftscope')
  WHERE company_id IS NULL;
  
  -- Update leads without company_id
  UPDATE leads SET 
    company_id = COALESCE(company_id, graftscope_id),
    company_name = COALESCE(company_name, 'Graftscope')
  WHERE company_id IS NULL;
  
  -- Update demo_records without company_id
  UPDATE demo_records SET 
    company_id = COALESCE(company_id, graftscope_id),
    company_name = COALESCE(company_name, 'Graftscope')
  WHERE company_id IS NULL;
  
  -- Update payments without company_id
  UPDATE payments SET 
    company_id = COALESCE(company_id, graftscope_id),
    company_name = COALESCE(company_name, 'Graftscope')
  WHERE company_id IS NULL;
  
  -- Update commissions without company_id
  UPDATE commissions SET 
    company_id = COALESCE(company_id, graftscope_id),
    company_name = COALESCE(company_name, 'Graftscope')
  WHERE company_id IS NULL;
  
  -- Update simulator_sessions without company_id
  UPDATE simulator_sessions SET 
    company_id = COALESCE(company_id, graftscope_id),
    company_name = COALESCE(company_name, 'Graftscope')
  WHERE company_id IS NULL;
  
  -- Update partner_checklists without company_id
  UPDATE partner_checklists SET 
    company_id = COALESCE(company_id, graftscope_id)
  WHERE company_id IS NULL;
  
  -- Update partner_kpis without company_id
  UPDATE partner_kpis SET 
    company_id = COALESCE(company_id, graftscope_id)
  WHERE company_id IS NULL;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;

-- =============================================
-- 11. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_partners_company_id ON partners(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_demo_records_company_id ON demo_records(company_id);
CREATE INDEX IF NOT EXISTS idx_payments_company_id ON payments(company_id);
CREATE INDEX IF NOT EXISTS idx_commissions_company_id ON commissions(company_id);
CREATE INDEX IF NOT EXISTS idx_partner_companies_partner_id ON partner_companies(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_companies_company_id ON partner_companies(company_id);
CREATE INDEX IF NOT EXISTS idx_partner_notes_partner_id ON partner_notes(partner_id);

COMMENT ON TABLE companies IS 'Multi-company support: Graftscope and ClinixGlow';
COMMENT ON TABLE partner_companies IS 'Junction table for partners working at multiple companies';
COMMENT ON TABLE partner_notes IS 'Admin notes about partners';
