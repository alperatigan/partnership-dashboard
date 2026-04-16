'use client';

import { useState } from 'react';
import { Market, PlanType } from '@/components/admin/markets/types';
import {
  MarketTabs,
  PriceCards,
  EarningsSimulator,
  SummaryCards,
  MilestoneDisplay,
} from '@/components/admin/markets';

export default function AdminMarketsPage() {
  const [market, setMarket] = useState<Market>('MY');
  const [plan, setPlan] = useState<PlanType>('pro_monthly');
  const [monthlySales, setMonthlySales] = useState(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Markets & Income Simulator</h1>
        <p className="text-muted-foreground mt-1">Choose your market. See your numbers.</p>
      </div>

      <div className="flex flex-col gap-6">
        <MarketTabs selected={market} onChange={setMarket} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <PriceCards market={market} />
            <EarningsSimulator
              market={market}
              plan={plan}
              monthlySales={monthlySales}
              onMarketChange={setMarket}
              onPlanChange={setPlan}
              onSalesChange={setMonthlySales}
            />
          </div>
          <div className="space-y-6">
            <SummaryCards market={market} plan={plan} monthlySales={monthlySales} />
            <MilestoneDisplay monthlySales={monthlySales} />
          </div>
        </div>

        <div className="bg-[#F5F7FA] rounded-lg p-4 text-sm text-muted-foreground">
          <h4 className="font-semibold text-foreground mb-2">Technical Notes</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Minimum payout: $100 USD</li>
            <li>Payment methods: Wise / Payoneer / GCash / Bank Transfer</li>
            <li>Annual plan retention: Month 1 (60%) / Month 3 (20%) / Month 6 (20%)</li>
            <li>Activity bonus: $50/month when reaching 12 demos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
