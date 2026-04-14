// Database types for ClinixGlow Partner Dashboard

export type Country = 'PH' | 'VN' | 'TH';

export type PartnerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export type Tier = 'silver' | 'gold' | 'platinum';

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'cancelled' | 'clawback';

export type Plan = 'starter' | 'professional' | 'enterprise';

// Lead CRM statuses
export type LeadStatus = 'contacted' | 'demo_scheduled' | 'demo_done' | 'trial_active' | 'closed' | 'expired';

export type DemoStatus = 'pending' | 'approved' | 'rejected';

export type PaymentStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

export type PaymentType = 'commission' | 'bonus' | 'clawback' | 'refund';

export type PaymentMethod = 'wise' | 'payoneer' | 'gcash' | 'bank_transfer';

// Transaction types
export type TransactionType = 'commission' | 'demo_bonus' | 'setup_fee' | 'customer_payment' | 'refund' | 'other';
export type TransactionDirection = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

// ============ COMPANY TYPES ============

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerCompany {
  id: string;
  partner_id: string;
  company_id: string;
  is_active: boolean;
  selected_company_id: string | null;
  access_level: 'read' | 'write' | 'admin';
  created_at: string;
}

export interface PartnerNote {
  id: string;
  partner_id: string;
  admin_id: string | null;
  content: string;
  note_type: 'general' | 'warning' | 'kpi' | 'payment' | 'other';
  created_at: string;
  updated_at: string;
  admin_name?: string;
}

// ============ PARTNER WITH COMPANY ============

export interface PartnerWithCompany extends Partner {
  company_id: string;
  company_name: string;
  company_slug?: string;
  company_color?: string;
}

// ============ CORE TABLES ============

export interface Partner {
  id: string;
  user_id: string;
  name: string;
  email: string;
  country: Country;
  role: string;
  network: string | null;
  linkedin_url: string | null;
  why_fit: string | null;
  status: PartnerStatus;
  tier: Tier | null;
  total_earned: number;
  pending_payout: number;
  paid_out: number;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  notes: string | null;
  company_id?: string | null;
  company_name?: string | null;
}

export interface Commission {
  id: string;
  partner_id: string;
  amount: number;
  currency: string;
  status: CommissionStatus;
  client_name: string | null;
  client_email: string | null;
  deal_value: number | null;
  deal_currency: string | null;
  paid_at: string | null;
  payout_method: string | null;
  payout_reference: string | null;
  created_at: string;
  updated_at: string;
  company_id?: string | null;
  company_name?: string | null;
}

export interface SimulatorSession {
  id: string;
  partner_id: string | null;
  anonymous_id: string | null;
  country: Country;
  plan: Plan;
  monthly_clients: number;
  monthly_revenue: number;
  monthly_commission: number;
  projected_annual: number;
  created_at: string;
  company_id?: string | null;
  company_name?: string | null;
}

export interface Admin {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  created_at: string;
}

export interface CountryPricing {
  id: string;
  country: Country;
  currency: string;
  fx_rate_to_usd: number;
  starter_usd: number;
  professional_usd: number;
  enterprise_usd: number;
  starter_local: number;
  professional_local: number;
  enterprise_local: number;
  updated_at: string;
}

export interface CommissionTier {
  id: string;
  country: Country;
  tier: Tier;
  percentage: number;
  min_deals_quarterly: number;
}

export interface ActivityLog {
  id: string;
  partner_id: string | null;
  user_id: string | null;
  action: string;
  details: Record<string, unknown>;
  ip_address: string | null;
  lead_id: string | null;
  demo_id: string | null;
  created_at: string;
}

// ============ NEW CRM TABLES ============

export interface Lead {
  id: string;
  partner_id: string;
  clinic_name: string;
  country: Country;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_role: string | null;
  status: LeadStatus;
  registered_at: string | null;
  first_contact_date: string;
  expires_at: string;
  is_expired: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company_id?: string | null;
  company_name?: string | null;
}

export interface DemoRecord {
  id: string;
  lead_id: string;
  partner_id: string;
  scheduled_at: string | null;
  completed_at: string | null;
  crm_note_checked: boolean;
  trial_opened: boolean;
  follow_up_email_sent: boolean;
  is_verified: boolean;
  status: DemoStatus;
  audited_by: string | null;
  audited_at: string | null;
  audit_notes: string | null;
  demo_notes: string | null;
  created_at: string;
  updated_at: string;
  company_id?: string | null;
  company_name?: string | null;
}

export interface Payment {
  id: string;
  partner_id: string;
  amount: number;
  currency: string;
  type: PaymentType;
  commission_id: string | null;
  lead_id: string | null;
  status: PaymentStatus;
  scheduled_at: string | null;
  paid_at: string | null;
  payment_method: PaymentMethod | null;
  payment_reference: string | null;
  year_1: boolean;
  created_at: string;
  updated_at: string;
  company_id?: string | null;
  company_name?: string | null;
}

export interface Transaction {
  id: string;
  company_id: string | null;
  partner_id: string | null;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  currency: string;
  description: string | null;
  reference: string | null;
  status: TransactionStatus;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  partner_name?: string | null;
  partner_email?: string | null;
  partner_tier?: string | null;
  company_name?: string | null;
  company_color?: string | null;
}

export interface PartnerChecklist {
  id: string;
  partner_id: string;
  contract_signed: boolean;
  contract_signed_at: string | null;
  profile_completed: boolean;
  profile_completed_at: string | null;
  tax_form_submitted: boolean;
  tax_form_submitted_at: string | null;
  payment_method_selected: boolean;
  payment_method_selected_at: string | null;
  orientation_completed: boolean;
  orientation_completed_at: string | null;
  avatar_doc_received: boolean;
  offer_doc_received: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartnerKPIs {
  id: string;
  partner_id: string;
  monthly_new_leads: number;
  monthly_demo_scheduled: number;
  monthly_demo_completed: number;
  monthly_trial_started: number;
  monthly_closed_deals: number;
  monthly_lead_quota: number;
  monthly_demo_quota: number;
  consecutive_months_under_quota: number;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}

// ============ VIEW TYPES ============

export interface PartnerMonthlyStats {
  partner_id: string;
  name: string;
  new_leads_30d: number;
  demo_scheduled_30d: number;
  demo_completed_30d: number;
  active_trials: number;
  closed_deals: number;
  total_paid: number;
  pending_commission: number;
}

export interface LeadsWithExpiry extends Lead {
  partner_name: string;
  expiry_status: 'expired' | 'expiring_soon' | 'active';
  days_until_expiry: number;
}

// ============ API Response types ============

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// ============ Dashboard Stats ============

export interface DashboardStats {
  total_partners: number;
  pending_applications: number;
  total_commissions_paid: number;
  total_commissions_pending: number;
  this_month_new_partners: number;
  this_month_commissions: number;
}

export interface PartnerStats {
  total_earned: number;
  pending_payout: number;
  paid_out: number;
  active_deals: number;
  total_sessions: number;
}

// Temsilci Dashboard specific stats
export interface TemsilciDashboardStats {
  this_month_earnings: number;
  active_customers: number;
  demo_count_this_month: number;
  demo_target: number;
  lifetime_commission_portfolio: number;
  pending_balance: number;
  payout_threshold: number;
  new_leads_this_month: number;
}
