'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Market, PlanType, MARKETS, USD_PRICES, SETUP_FEE_USD, MILESTONES } from './types';
import { formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

interface SummaryCardsProps {
  market: Market;
  plan: PlanType;
  monthlySales: number;
}

export function SummaryCards({ market, plan, monthlySales }: SummaryCardsProps) {
  const isAnnual = plan.includes('annual');
  const usdPrice = USD_PRICES[plan];

  const summary = useMemo(() => {
    const month1Setup = SETUP_FEE_USD * monthlySales;
    const annualRevenue = usdPrice * monthlySales;

    const companyProfit = isAnnual ? annualRevenue * 0.7 : annualRevenue * 12 * 0.7;
    const partnerCommission = isAnnual ? annualRevenue * 0.3 : annualRevenue * 12 * 0.3;

    const milestone = MILESTONES.filter((m) => monthlySales >= m.sales).pop();
    const milestoneBonus = milestone?.bonus || 0;

    const year1Partner = month1Setup + partnerCommission + milestoneBonus;

    return {
      month1Setup,
      partnerCommission,
      companyProfit,
      milestoneBonus,
      year1Partner,
      tierLevel: milestone?.tier || 0,
    };
  }, [market, plan, monthlySales, isAnnual, usdPrice]);

  const cards = [
    {
      label: 'Setup',
      value: formatCurrency(summary.month1Setup),
      subtext: '100% partner',
      color: 'bg-[#FFC439]/20 text-[#B8860B]',
      icon: '💰',
    },
    {
      label: 'Partner 30%',
      value: formatCurrency(summary.partnerCommission),
      subtext: 'Year 1',
      color: 'bg-[#00A303]/10 text-[#00A303]',
      icon: '📊',
    },
    {
      label: 'Company 70%',
      value: formatCurrency(summary.companyProfit),
      subtext: 'Year 1',
      color: 'bg-[#003087]/10 text-[#003087]',
      icon: '🏢',
    },
    {
      label: 'Partner Total',
      value: formatCurrency(summary.year1Partner),
      subtext: summary.tierLevel > 0 ? `Tier ${summary.tierLevel}` : 'No milestone',
      color: 'bg-[#FFC439]/20 text-[#B8860B]',
      icon: '🎯',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="border border-border overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center shrink-0`}>
                <span className="text-lg">{card.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground truncate">{card.label}</p>
                <p className="text-xl font-bold text-foreground truncate">{card.value}</p>
                <p className="text-[10px] text-muted-foreground truncate">{card.subtext}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
