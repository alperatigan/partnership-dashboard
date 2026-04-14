-- =============================================
-- ClinixGlow Partner Dashboard Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Partners table (application submissions become partners)
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  
  -- Application data
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL CHECK (country IN ('PH', 'VN', 'TH')),
  role TEXT NOT NULL,
  network TEXT,
  linkedin_url TEXT,
  why_fit TEXT,
  
  -- Status & Tier
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  tier TEXT CHECK (tier IN ('silver', 'gold', 'platinum')),
  
  -- Commission tracking
  total_earned DECIMAL(12,2) DEFAULT 0,
  pending_payout DECIMAL(12,2) DEFAULT 0,
  paid_out DECIMAL(12,2) DEFAULT 0,
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  notes TEXT
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_country ON partners(country);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);

-- Commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) NOT NULL,
  
  -- Commission details
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled', 'clawback')),
  
  -- Context
  client_name TEXT,
  client_email TEXT,
  deal_value DECIMAL(12,2),
  deal_currency TEXT,
  
  -- Payout
  paid_at TIMESTAMPTZ,
  payout_method TEXT,
  payout_reference TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for commissions
CREATE INDEX IF NOT EXISTS idx_commissions_partner_id ON commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);

-- Simulator Sessions table
CREATE TABLE IF NOT EXISTS simulator_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  anonymous_id UUID,
  
  -- Inputs
  country TEXT NOT NULL CHECK (country IN ('PH', 'VN', 'TH')),
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise')),
  monthly_clients INTEGER,
  
  -- Outputs
  monthly_revenue DECIMAL(12,2),
  monthly_commission DECIMAL(12,2),
  projected_annual DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for simulator sessions
CREATE INDEX IF NOT EXISTS idx_simulator_sessions_partner_id ON simulator_sessions(partner_id);

-- =============================================
-- ADMIN TABLES
-- =============================================

-- Admins table (separate from auth.users)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REFERENCE TABLES
-- =============================================

-- Country Pricing Configuration
CREATE TABLE IF NOT EXISTS country_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT UNIQUE NOT NULL CHECK (country IN ('PH', 'VN', 'TH')),
  currency TEXT NOT NULL,
  fx_rate_to_usd DECIMAL(10,4),
  
  -- Plan prices in USD (monthly)
  starter_usd DECIMAL(10,2),
  professional_usd DECIMAL(10,2),
  enterprise_usd DECIMAL(10,2),
  
  -- Local prices
  starter_local DECIMAL(10,2),
  professional_local DECIMAL(10,2),
  enterprise_local DECIMAL(10,2),
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing for all 3 countries
INSERT INTO country_pricing (country, currency, fx_rate_to_usd, starter_usd, professional_usd, enterprise_usd, starter_local, professional_local, enterprise_local) VALUES
('PH', 'PHP', 58.50, 29, 79, 199, 1696.50, 4621.50, 11631.50),
('VN', 'VND', 25400.00, 29, 79, 199, 736600, 2006600, 5054600),
('TH', 'THB', 35.20, 29, 79, 199, 1020.80, 2760.80, 7004.80)
ON CONFLICT (country) DO NOTHING;

-- Commission Tiers
CREATE TABLE IF NOT EXISTS commission_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country TEXT NOT NULL CHECK (country IN ('PH', 'VN', 'TH')),
  tier TEXT NOT NULL CHECK (tier IN ('silver', 'gold', 'platinum')),
  percentage DECIMAL(5,2) NOT NULL,
  min_deals_quarterly INTEGER DEFAULT 0,
  
  UNIQUE(country, tier)
);

-- Insert default commission tiers
INSERT INTO commission_tiers (country, tier, percentage, min_deals_quarterly) VALUES
('PH', 'silver', 20.00, 0),
('PH', 'gold', 25.00, 5),
('PH', 'platinum', 30.00, 15),
('VN', 'silver', 20.00, 0),
('VN', 'gold', 25.00, 5),
('VN', 'platinum', 30.00, 15),
('TH', 'silver', 20.00, 0),
('TH', 'gold', 25.00, 5),
('TH', 'platinum', 30.00, 15)
ON CONFLICT (country, tier) DO NOTHING;

-- =============================================
-- ACTIVITY LOG
-- =============================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  user_id UUID,
  
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_partner_id ON activity_log(partner_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGERS AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commissions_updated_at
  BEFORE UPDATE ON commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE country_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Partners: Users see only their own data, Admins see all
CREATE POLICY "partners_select_own" ON partners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "partners_insert_own" ON partners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "partners_update_own" ON partners
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "partners_admin_all" ON partners
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Commissions: Partners see own, Admins see all
CREATE POLICY "commissions_select_partner" ON commissions
  FOR SELECT USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
  );

CREATE POLICY "commissions_admin_all" ON commissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "commissions_insert_admin" ON commissions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Simulator Sessions: Partners see own, Admins see all
CREATE POLICY "simulator_sessions_partner_select" ON simulator_sessions
  FOR SELECT USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
  );

CREATE POLICY "simulator_sessions_admin_all" ON simulator_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Country Pricing: Public read
CREATE POLICY "country_pricing_public" ON country_pricing
  FOR SELECT USING (true);

-- Commission Tiers: Public read
CREATE POLICY "commission_tiers_public" ON commission_tiers
  FOR SELECT USING (true);

-- Admins: Only super_admin can manage
CREATE POLICY "admins_select" ON admins
  FOR SELECT USING (true);

CREATE POLICY "admins_insert" ON admins
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "admins_update" ON admins
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- Activity Log: Partners see own, Admins see all
CREATE POLICY "activity_log_partner_select" ON activity_log
  FOR SELECT USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
  );

CREATE POLICY "activity_log_admin_all" ON activity_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "activity_log_insert" ON activity_log
  FOR INSERT WITH CHECK (true);

-- =============================================
-- INITIAL ADMIN USER
-- =============================================
-- Note: After creating your auth user, run this SQL to make yourself admin:
-- INSERT INTO admins (user_id, name, email, role) 
-- VALUES ('your-auth-user-uuid', 'Your Name', 'your@email.com', 'super_admin');

-- =============================================
-- STORAGE BUCKETS (for future use)
-- =============================================

-- INSERT INTO storage.buckets (id, name, public) VALUES ('partner-documents', 'partner-documents', false);
