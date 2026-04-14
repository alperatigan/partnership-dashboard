-- =============================================
-- ClinixGlow Partner Dashboard - Extended Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) NOT NULL,
  clinic_name TEXT NOT NULL,
  country TEXT NOT NULL CHECK (country IN ('PH', 'VN', 'TH')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_role TEXT,
  status TEXT DEFAULT 'contacted' CHECK (status IN ('contacted', 'demo_scheduled', 'demo_done', 'trial_active', 'closed', 'expired')),
  registered_at TIMESTAMPTZ,
  first_contact_date TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days'),
  is_expired BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Demo Records
CREATE TABLE IF NOT EXISTS demo_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) NOT NULL,
  partner_id UUID REFERENCES partners(id) NOT NULL,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  crm_note_checked BOOLEAN DEFAULT FALSE,
  trial_opened BOOLEAN DEFAULT FALSE,
  follow_up_email_sent BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  audited_by UUID REFERENCES admins(id),
  audited_at TIMESTAMPTZ,
  audit_notes TEXT,
  demo_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT DEFAULT 'commission' CHECK (type IN ('commission', 'bonus', 'clawback', 'refund')),
  commission_id UUID REFERENCES commissions(id),
  lead_id UUID REFERENCES leads(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_method TEXT CHECK (payment_method IN ('wise', 'payoneer', 'gcash', 'bank_transfer')),
  payment_reference TEXT,
  year_1 BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner Checklists
CREATE TABLE IF NOT EXISTS partner_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) UNIQUE NOT NULL,
  contract_signed BOOLEAN DEFAULT FALSE,
  contract_signed_at TIMESTAMPTZ,
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_completed_at TIMESTAMPTZ,
  tax_form_submitted BOOLEAN DEFAULT FALSE,
  tax_form_submitted_at TIMESTAMPTZ,
  payment_method_selected BOOLEAN DEFAULT FALSE,
  payment_method_selected_at TIMESTAMPTZ,
  orientation_completed BOOLEAN DEFAULT FALSE,
  orientation_completed_at TIMESTAMPTZ,
  avatar_doc_received BOOLEAN DEFAULT FALSE,
  offer_doc_received BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partner KPIs
CREATE TABLE IF NOT EXISTS partner_kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) UNIQUE NOT NULL,
  monthly_new_leads INTEGER DEFAULT 0,
  monthly_demo_scheduled INTEGER DEFAULT 0,
  monthly_demo_completed INTEGER DEFAULT 0,
  monthly_trial_started INTEGER DEFAULT 0,
  monthly_closed_deals INTEGER DEFAULT 0,
  monthly_lead_quota INTEGER DEFAULT 20,
  monthly_demo_quota INTEGER DEFAULT 12,
  consecutive_months_under_quota INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_partner_id ON leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_expires_at ON leads(expires_at);
CREATE INDEX IF NOT EXISTS idx_demo_records_lead_id ON demo_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_demo_records_partner_id ON demo_records(partner_id);
CREATE INDEX IF NOT EXISTS idx_demo_records_status ON demo_records(status);
CREATE INDEX IF NOT EXISTS idx_payments_partner_id ON payments(partner_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_demo_records_updated_at BEFORE UPDATE ON demo_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_checklists_updated_at BEFORE UPDATE ON partner_checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_kpis_updated_at BEFORE UPDATE ON partner_kpis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update is_expired and is_verified
CREATE OR REPLACE FUNCTION update_lead_expiry_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_expired = (NEW.expires_at < NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_lead_expiry
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_lead_expiry_status();

CREATE OR REPLACE FUNCTION update_demo_verified_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_verified = (NEW.crm_note_checked AND NEW.trial_opened AND NEW.follow_up_email_sent);
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_demo_verified
  BEFORE UPDATE ON demo_records
  FOR EACH ROW EXECUTE FUNCTION update_demo_verified_status();

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE demo_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_kpis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "leads_partner_select" ON leads FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "leads_partner_insert" ON leads FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "leads_partner_update" ON leads FOR UPDATE USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "leads_admin_all" ON leads FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "demo_partner_select" ON demo_records FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "demo_partner_insert" ON demo_records FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "demo_partner_update" ON demo_records FOR UPDATE USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "demo_admin_all" ON demo_records FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "payments_partner_select" ON payments FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "checklists_partner_select" ON partner_checklists FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "checklists_admin_all" ON partner_checklists FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

CREATE POLICY "kpis_partner_select" ON partner_kpis FOR SELECT USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
CREATE POLICY "kpis_admin_all" ON partner_kpis FOR ALL USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));

-- Views
CREATE OR REPLACE VIEW partner_monthly_stats AS
SELECT p.id as partner_id, p.name,
  COUNT(DISTINCT l.id) FILTER (WHERE l.created_at > NOW() - INTERVAL '30 days') as new_leads_30d,
  COUNT(DISTINCT d.id) FILTER (WHERE d.is_verified = TRUE AND d.created_at > NOW() - INTERVAL '30 days') as demo_completed_30d,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'trial_active') as active_trials,
  COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'closed') as closed_deals,
  COALESCE(SUM(c.amount) FILTER (WHERE c.status = 'paid'), 0) as total_paid,
  COALESCE(SUM(c.amount) FILTER (WHERE c.status IN ('pending', 'approved')), 0) as pending_commission
FROM partners p
LEFT JOIN leads l ON l.partner_id = p.id
LEFT JOIN demo_records d ON d.partner_id = p.id
LEFT JOIN commissions c ON c.partner_id = p.id
GROUP BY p.id, p.name;

CREATE OR REPLACE VIEW leads_with_expiry AS
SELECT l.*, p.name as partner_name,
  CASE WHEN l.is_expired THEN 'expired' WHEN l.expires_at < NOW() + INTERVAL '7 days' THEN 'expiring_soon' ELSE 'active' END as expiry_status,
  EXTRACT(DAYS FROM (l.expires_at - NOW())) as days_until_expiry
FROM leads l JOIN partners p ON p.id = l.partner_id;
