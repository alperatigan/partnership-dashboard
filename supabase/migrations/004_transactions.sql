-- =============================================
-- Activity & Transaction Management
-- Phase 1: Transactions Table
-- =============================================

-- Transactions table for tracking all money movements
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  partner_id UUID REFERENCES partners(id),           -- NULL for customer payments
  type TEXT NOT NULL CHECK (type IN (
    'commission', 
    'demo_bonus', 
    'setup_fee', 
    'customer_payment', 
    'refund', 
    'other'
  )),
  direction TEXT NOT NULL CHECK (direction IN ('income', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  reference TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  recorded_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Indexes for transactions
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partner_id ON transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_direction ON transactions(direction);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- View: Transactions with partner and company details
CREATE OR REPLACE VIEW transactions_with_details AS
SELECT 
  t.*,
  p.name as partner_name,
  p.email as partner_email,
  p.tier as partner_tier,
  c.name as company_name,
  c.primary_color as company_color
FROM transactions t
LEFT JOIN partners p ON t.partner_id = p.id
LEFT JOIN companies c ON t.company_id = c.id;

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Partners can see their own transactions
CREATE POLICY "transactions_partner_select" ON transactions
  FOR SELECT USING (
    partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
  );

-- Admins can see all transactions
CREATE POLICY "transactions_admin_all" ON transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Anyone can insert (admin will create via API)
CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (true);

-- =============================================
-- ACTIVITY LOG INTEGRATION
-- =============================================

-- Function to log transaction creation to activity_log
-- Note: The trigger references activity_log (singular), not activity_logs
CREATE OR REPLACE FUNCTION log_transaction_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (partner_id, user_id, action, details, ip_address, company_id)
  VALUES (
    NEW.partner_id,
    NEW.recorded_by,
    'transaction_created',
    jsonb_build_object(
      'transaction_id', NEW.id,
      'type', NEW.type,
      'direction', NEW.direction,
      'amount', NEW.amount,
      'description', NEW.description
    ),
    NULL,
    NEW.company_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS transaction_activity_trigger ON transactions;
CREATE TRIGGER transaction_activity_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_activity();

COMMENT ON TABLE transactions IS 'Tracks all money movements: commissions, bonuses, fees, customer payments';
COMMENT ON VIEW transactions_with_details IS 'Transactions with partner and company info joined';