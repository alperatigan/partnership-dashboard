'use client';

export type Market = 'PH' | 'VN' | 'TH' | 'ID' | 'MY';

export type PlanType = 'starter_monthly' | 'starter_annual' | 'pro_monthly' | 'pro_annual';

export interface MarketInfo {
  id: Market;
  flag: string;
  name: string;
  currency: string;
  fxRate: number;
}

export interface PriceData {
  starter_monthly: number;
  starter_annual: number;
  pro_monthly: number;
  pro_annual: number;
}

export interface RetentionSchedule {
  month: number;
  partnerPercent: number;
  companyPercent: number;
}

export const MARKETS: MarketInfo[] = [
  { id: 'PH', flag: '🇵🇭', name: 'Philippines', currency: 'PHP', fxRate: 60 },
  { id: 'VN', flag: '🇻🇳', name: 'Vietnam', currency: 'VND', fxRate: 26350 },
  { id: 'TH', flag: '🇹🇭', name: 'Thailand', currency: 'THB', fxRate: 32 },
  { id: 'ID', flag: '🇮🇩', name: 'Indonesia', currency: 'IDR', fxRate: 17150 },
  { id: 'MY', flag: '🇲🇾', name: 'Malaysia', currency: 'MYR', fxRate: 4.5 },
];

export const PRICES: Record<Market, PriceData> = {
  PH: { starter_monthly: 3300, starter_annual: 33000, pro_monthly: 6120, pro_annual: 61200 },
  VN: { starter_monthly: 1449250, starter_annual: 14492500, pro_monthly: 2687700, pro_annual: 26877000 },
  TH: { starter_monthly: 1760, starter_annual: 17600, pro_monthly: 3264, pro_annual: 32640 },
  ID: { starter_monthly: 943250, starter_annual: 9432500, pro_monthly: 1749300, pro_annual: 17493000 },
  MY: { starter_monthly: 880, starter_annual: 8800, pro_monthly: 1632, pro_annual: 16320 },
};

export const USD_PRICES: Record<PlanType, number> = {
  starter_monthly: 55,
  starter_annual: 550,
  pro_monthly: 102,
  pro_annual: 1020,
};

export const SETUP_FEE_USD = 50;

export const ANNUAL_RETENTION: RetentionSchedule[] = [
  { month: 1, partnerPercent: 60, companyPercent: 40 },
  { month: 3, partnerPercent: 20, companyPercent: 40 },
  { month: 6, partnerPercent: 20, companyPercent: 20 },
];

export const MILESTONES = [
  { tier: 1, sales: 10, bonus: 50 },
  { tier: 2, sales: 25, bonus: 200 },
  { tier: 3, sales: 50, bonus: 500 },
];

export const PLAN_LABELS: Record<PlanType, string> = {
  starter_monthly: 'Starter Monthly',
  starter_annual: 'Starter Annual',
  pro_monthly: 'Pro Monthly',
  pro_annual: 'Pro Annual',
};

export const ACTIVITY_BONUS_THRESHOLD = 12;
export const ACTIVITY_BONUS_USD = 50;
