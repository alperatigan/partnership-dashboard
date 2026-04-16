'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Market, MARKETS, PRICES, SETUP_FEE_USD, PlanType } from './types';
import { formatCurrency } from '@/lib/utils';

interface PriceCardsProps {
  market: Market;
}

const planColors: Record<PlanType, { bg: string; text: string; label: string }> = {
  starter_monthly: { bg: 'bg-[#009CDE]/10', text: 'text-[#009CDE]', label: 'Starter' },
  starter_annual: { bg: 'bg-[#009CDE]/20', text: 'text-[#007AB8]', label: 'Starter' },
  pro_monthly: { bg: 'bg-[#003087]/10', text: 'text-[#003087]', label: 'Pro' },
  pro_annual: { bg: 'bg-[#003087]/20', text: 'text-[#001F5C]', label: 'Pro' },
};

export function PriceCards({ market }: PriceCardsProps) {
  const marketInfo = MARKETS.find((m) => m.id === market)!;
  const prices = PRICES[market];

  const plans: { key: PlanType; monthly: boolean }[] = [
    { key: 'starter_monthly', monthly: true },
    { key: 'starter_annual', monthly: false },
    { key: 'pro_monthly', monthly: true },
    { key: 'pro_annual', monthly: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pricing - {marketInfo.name}</h3>
        <div className="text-sm text-muted-foreground">
          Setup Fee: <span className="font-semibold text-[#003087]">${SETUP_FEE_USD} USD</span> (100% partner)
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map(({ key, monthly }) => {
          const price = prices[key];
          const color = planColors[key];
          const usdPrice = monthly ? price / marketInfo.fxRate : price / marketInfo.fxRate;

          return (
            <Card key={key} className="border border-border overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${color.bg} flex items-center justify-center`}>
                    <span className={`text-sm font-bold ${color.text}`}>
                      {monthly ? 'M' : 'A'}
                    </span>
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {color.label} {monthly ? 'Monthly' : 'Annual'}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {marketInfo.currency === 'VND' || marketInfo.currency === 'IDR'
                      ? `${marketInfo.currency} ${price.toLocaleString()}`
                      : `${marketInfo.currency} ${price.toLocaleString()}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${usdPrice.toFixed(0)} USD
                  </p>
                  {monthly && (
                    <p className="text-xs text-muted-foreground">per month</p>
                  )}
                  {!monthly && (
                    <p className="text-xs text-muted-foreground">per year</p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
