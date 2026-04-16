'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Market, PlanType, MARKETS, USD_PRICES, SETUP_FEE_USD, MILESTONES, ACTIVITY_BONUS_USD } from './types';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

interface SummaryCardsProps {
  market: Market;
  plan: PlanType;
  monthlySales: number;
}

export function SummaryCards({ market, plan, monthlySales }: SummaryCardsProps) {
  const marketInfo = MARKETS.find((m) => m.id === market)!;
  const isAnnual = plan.includes('annual');
  const usdPrice = USD_PRICES[plan];

  const summary = useMemo(() => {
    const month1Setup = SETUP_FEE_USD * monthlySales;
    const annualCommission = isAnnual
      ? (usdPrice * monthlySales) * (0.6 + 0.2 + 0.2)
      : usdPrice * monthlySales * 12;
    const partnerCommission = annualCommission * 0.3;
    const companyMargin = annualCommission * 0.7;

    const year1CompanyProfit = isAnnual
      ? (usdPrice * 0.4 + usdPrice * 0.4 + usdPrice * 0.2) * monthlySales
      : usdPrice * 0.7 * monthlySales * 12;

    const milestone = MILESTONES.filter((m) => monthlySales >= m.sales).pop();
    const milestoneBonus = milestone?.bonus || 0;

    const year1Partner = month1Setup + partnerCommission + milestoneBonus;

    return {
      month1Setup,
      partnerCommission,
      companyMargin,
      year1CompanyProfit,
      milestoneBonus,
      year1Partner,
      tierLevel: milestone?.tier || 0,
    };
  }, [market, plan, monthlySales, isAnnual, usdPrice]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border border-border overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Month 1 Setup</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.month1Setup)}</p>
              <p className="text-xs text-muted-foreground">100% to partner</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#FFC439]/20 flex items-center justify-center">
              <span className="text-sm">💰</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Year 1 Commission</p>
              <p className="text-2xl font-bold text-[#00A303]">{formatCurrency(summary.partnerCommission)}</p>
              <p className="text-xs text-muted-foreground">30% partner share</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#00A303]/10 flex items-center justify-center">
              <span className="text-sm">📊</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Company Year 1 Profit</p>
              <p className="text-2xl font-bold text-[#003087]">{formatCurrency(summary.year1CompanyProfit)}</p>
              <p className="text-xs text-muted-foreground">After partner share</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center">
              <span className="text-sm">🏢</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Partner Year 1 Total</p>
              <p className="text-2xl font-bold text-[#00A303]">{formatCurrency(summary.year1Partner)}</p>
              <p className="text-xs text-muted-foreground">
                {summary.tierLevel > 0 ? `Tier ${summary.tierLevel} milestone` : 'No milestone yet'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#FFC439]/20 flex items-center justify-center">
              <span className="text-sm">🎯</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
