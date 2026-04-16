'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Market, PlanType, MARKETS, PLAN_LABELS, USD_PRICES, SETUP_FEE_USD, ACTIVITY_BONUS_THRESHOLD, ACTIVITY_BONUS_USD, MILESTONES } from './types';
import { formatCurrency } from '@/lib/utils';

interface EarningsSimulatorProps {
  market: Market;
  plan: PlanType;
  monthlySales: number;
  onMarketChange: (market: Market) => void;
  onPlanChange: (plan: PlanType) => void;
  onSalesChange: (sales: number) => void;
}

export function EarningsSimulator({
  market,
  plan,
  monthlySales,
  onMarketChange,
  onPlanChange,
  onSalesChange,
}: EarningsSimulatorProps) {
  const marketInfo = MARKETS.find((m) => m.id === market)!;
  const isAnnual = plan.includes('annual');
  const usdPrice = USD_PRICES[plan];

  const rows = useMemo(() => {
    const results: {
      month: number;
      sales: number;
      setup: number;
      partnerCommission: number;
      companyProfit: number;
      bonus: number;
      totalPartner: number;
      cumulative: number;
    }[] = [];

    let cumulative = 0;

    for (let month = 1; month <= 12; month++) {
      const setup = SETUP_FEE_USD * monthlySales;

      let partnerCommission = 0;
      let companyProfit = 0;

      if (isAnnual) {
        if (month === 1) {
          partnerCommission = (usdPrice * 0.6) * monthlySales;
          companyProfit = (usdPrice * 0.4) * monthlySales;
        } else if (month === 3) {
          partnerCommission = (usdPrice * 0.2) * monthlySales;
          companyProfit = (usdPrice * 0.4) * monthlySales;
        } else if (month === 6) {
          partnerCommission = (usdPrice * 0.2) * monthlySales;
          companyProfit = (usdPrice * 0.2) * monthlySales;
        }
      } else {
        partnerCommission = usdPrice * 0.3 * monthlySales;
        companyProfit = usdPrice * 0.7 * monthlySales;
      }

      const bonus = month === 1 && monthlySales >= ACTIVITY_BONUS_THRESHOLD ? ACTIVITY_BONUS_USD : 0;

      const totalPartner = setup + partnerCommission + bonus;
      cumulative += totalPartner;

      results.push({
        month,
        sales: monthlySales,
        setup,
        partnerCommission,
        companyProfit,
        bonus,
        totalPartner,
        cumulative,
      });
    }

    return results;
  }, [monthlySales, plan, isAnnual, usdPrice]);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => ({
        setup: acc.setup + row.setup,
        partnerCommission: acc.partnerCommission + row.partnerCommission,
        companyProfit: acc.companyProfit + row.companyProfit,
        bonus: acc.bonus + row.bonus,
        totalPartner: acc.totalPartner + row.totalPartner,
        cumulative: row.cumulative,
      }),
      { setup: 0, partnerCommission: 0, companyProfit: 0, bonus: 0, totalPartner: 0, cumulative: 0 }
    );
  }, [rows]);

  const currentMilestone = useMemo(() => {
    return MILESTONES.filter((m) => monthlySales >= m.sales).pop();
  }, [monthlySales]);

  return (
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Earnings Simulator</CardTitle>
        <div className="flex flex-wrap gap-4 pt-4">
          <div className="w-40">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Market</label>
            <Select value={market} onValueChange={(v) => onMarketChange(v as Market)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKETS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.flag} {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-48">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Plan</label>
            <Select value={plan} onValueChange={(v) => onPlanChange(v as PlanType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLAN_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Monthly Sales: <span className="text-[#003087] font-bold">{monthlySales}</span> clinics
            </label>
            <Slider
              value={[monthlySales]}
              onValueChange={([v]: number[]) => onSalesChange(v)}
              min={1}
              max={15}
              step={1}
              className="pt-2"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {currentMilestone && (
          <div className="bg-[#FFC439]/10 border border-[#FFC439]/20 rounded-lg p-3">
            <p className="text-sm font-medium text-[#B8860B]">
              🎯 Milestone Tier {currentMilestone.tier} achieved! (+${currentMilestone.bonus} bonus)
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F7FA]">
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="font-semibold text-right">Sales</TableHead>
                <TableHead className="font-semibold text-right">Setup Fee</TableHead>
                <TableHead className="font-semibold text-right">Partner Comm.</TableHead>
                <TableHead className="font-semibold text-right">Company Profit</TableHead>
                <TableHead className="font-semibold text-right">Bonus</TableHead>
                <TableHead className="font-semibold text-right">Total Partner</TableHead>
                <TableHead className="font-semibold text-right">Cumulative</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.month} className="last:font-semibold last:bg-[#F5F7FA]/50">
                  <TableCell>Month {row.month}</TableCell>
                  <TableCell className="text-right">{row.sales}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatCurrency(row.setup)}
                  </TableCell>
                  <TableCell className="text-right text-[#00A303]">
                    {formatCurrency(row.partnerCommission)}
                  </TableCell>
                  <TableCell className="text-right text-[#003087]">
                    {formatCurrency(row.companyProfit)}
                  </TableCell>
                  <TableCell className="text-right text-[#FFC439]">
                    {row.bonus > 0 ? formatCurrency(row.bonus) : '-'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(row.totalPartner)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-[#003087]">
                    {formatCurrency(row.cumulative)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Setup (Year 1):</span>{' '}
              <span className="font-semibold">{formatCurrency(totals.setup)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Partner Commission:</span>{' '}
              <span className="font-semibold text-[#00A303]">{formatCurrency(totals.partnerCommission)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Company Profit:</span>{' '}
              <span className="font-semibold text-[#003087]">{formatCurrency(totals.companyProfit)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Bonuses:</span>{' '}
              <span className="font-semibold text-[#FFC439]">{formatCurrency(totals.bonus)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Partner Year 1 Total:</span>{' '}
              <span className="font-bold text-lg text-[#00A303]">{formatCurrency(totals.cumulative)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
