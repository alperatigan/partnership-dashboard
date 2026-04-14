'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSaveSimulatorSession } from '@/hooks/use-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { formatCurrency, getCountryName, getCountryFlag } from '@/lib/utils';
import { Calculator, Save, RotateCcw, TrendingUp, Users, DollarSign } from 'lucide-react';
import type { Country, Plan, SimulatorSession } from '@/types';

interface Pricing {
  [key: string]: {
    currency: string;
    fx_rate: number;
    plans: {
      [key in Plan]: {
        usd: number;
        local: number;
        commission: number;
      };
    };
  };
}

const PRICING: Pricing = {
  PH: {
    currency: 'PHP',
    fx_rate: 58.50,
    plans: {
      starter: { usd: 29, local: 1696.50, commission: 0.20 },
      professional: { usd: 79, local: 4621.50, commission: 0.20 },
      enterprise: { usd: 199, local: 11631.50, commission: 0.20 },
    },
  },
  VN: {
    currency: 'VND',
    fx_rate: 25400,
    plans: {
      starter: { usd: 29, local: 736600, commission: 0.20 },
      professional: { usd: 79, local: 2006600, commission: 0.20 },
      enterprise: { usd: 199, local: 5054600, commission: 0.20 },
    },
  },
  TH: {
    currency: 'THB',
    fx_rate: 35.20,
    plans: {
      starter: { usd: 29, local: 1020.80, commission: 0.20 },
      professional: { usd: 79, local: 2760.80, commission: 0.20 },
      enterprise: { usd: 199, local: 7004.80, commission: 0.20 },
    },
  },
};

const AVERAGE_SALARIES: Record<string, number> = {
  PH: 450,
  VN: 300,
  TH: 550,
};

export default function SimulatorPage() {
  const { user } = useAuth();
  const saveSession = useSaveSimulatorSession();
  
  const [country, setCountry] = useState<Country>('PH');
  const [plan, setPlan] = useState<Plan>('professional');
  const [monthlyClients, setMonthlyClients] = useState(5);
  const [savedSessions, setSavedSessions] = useState<SimulatorSession[]>([]);

  const pricing = PRICING[country];
  const selectedPlan = pricing.plans[plan];
  const commissionRate = selectedPlan.commission;
  
  const monthlyRevenue = selectedPlan.usd * monthlyClients;
  const monthlyCommission = monthlyRevenue * commissionRate;
  const projectedAnnual = monthlyCommission * 12;

  const localSalary = AVERAGE_SALARIES[country];
  const vsSalaryMultiplier = (monthlyCommission / localSalary).toFixed(1);

  const handleSaveSession = async () => {
    if (!user?.id) return;
    
    try {
      await saveSession.mutateAsync({
        partner_id: user.id,
        anonymous_id: null,
        country,
        plan,
        monthly_clients: monthlyClients,
        monthly_revenue: monthlyRevenue,
        monthly_commission: monthlyCommission,
        projected_annual: projectedAnnual,
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleReset = () => {
    setCountry('PH');
    setPlan('professional');
    setMonthlyClients(5);
  };

  // Generate 12-month projection
  const monthlyProjection = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: monthlyRevenue * (i + 1),
    commission: monthlyCommission * (i + 1),
    cumulative: monthlyCommission * ((i + 1) * (i + 2)) / 2,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Earnings Simulator</h1>
        <p className="text-muted-foreground mt-1">
          Calculate your potential earnings as a partner
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-[#003087]" />
                Calculator
              </CardTitle>
              <CardDescription>
                Adjust the sliders to see your potential earnings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-foreground">Market</Label>
                <Select value={country} onValueChange={(v) => setCountry(v as Country)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PH">
                      {getCountryFlag('PH')} Philippines
                    </SelectItem>
                    <SelectItem value="VN">
                      {getCountryFlag('VN')} Vietnam
                    </SelectItem>
                    <SelectItem value="TH">
                      {getCountryFlag('TH')} Thailand
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-foreground">Plan Type</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">
                      Starter - {formatCurrency(selectedPlan.usd)}/mo
                    </SelectItem>
                    <SelectItem value="professional">
                      Professional - {formatCurrency(selectedPlan.usd)}/mo
                    </SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise - {formatCurrency(selectedPlan.usd)}/mo
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Monthly Clients</Label>
                  <Badge variant="outline" className="text-lg px-3 py-1 font-semibold">
                    {monthlyClients}
                  </Badge>
                </div>
                <Input
                  type="range"
                  min={1}
                  max={50}
                  value={monthlyClients}
                  onChange={(e) => setMonthlyClients(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 client</span>
                  <span>50 clients</span>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Button variant="outline" className="w-full font-semibold border-2" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button className="w-full font-semibold" onClick={handleSaveSession} disabled={!user?.id}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Calculation
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-[#003087]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Projection</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(projectedAnnual)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00A303]/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-[#00A303]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Commission</p>
                    <p className="text-xl font-bold text-foreground">{formatCurrency(monthlyCommission)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#009CDE]/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#009CDE]" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">vs Local Salary</p>
                    <p className="text-xl font-bold text-foreground">{vsSalaryMultiplier}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border border-border bg-gradient-to-br from-[#003087] to-[#003087]/80 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Your Earnings Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-80">Monthly Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</p>
                </div>
                <div>
                  <p className="text-sm opacity-80">Your Commission (20%)</p>
                  <p className="text-2xl font-bold">{formatCurrency(monthlyCommission)}</p>
                </div>
              </div>
              <Separator className="bg-white/20" />
              <div>
                <p className="text-sm opacity-80">Projected Annual Earnings</p>
                <p className="text-4xl font-bold">{formatCurrency(projectedAnnual)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">12-Month Projection</CardTitle>
              <CardDescription>
                Cumulative earnings over 12 months (assuming consistent client acquisition)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5F7FA]">
                    <TableHead className="font-semibold">Month</TableHead>
                    <TableHead className="text-right font-semibold">Monthly Revenue</TableHead>
                    <TableHead className="text-right font-semibold">Commission</TableHead>
                    <TableHead className="text-right font-semibold">Cumulative</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyProjection.map((row) => (
                    <TableRow key={row.month} className="border-b border-border last:border-0">
                      <TableCell className="text-foreground">Month {row.month}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatCurrency(row.revenue)}</TableCell>
                      <TableCell className="text-right text-[#003087] font-medium">
                        {formatCurrency(row.commission)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-foreground">
                        {formatCurrency(row.cumulative)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Plan Comparison</CardTitle>
              <CardDescription>
                How different plans affect your earnings with {monthlyClients} clients/month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#F5F7FA]">
                    <TableHead className="font-semibold">Plan</TableHead>
                    <TableHead className="text-right font-semibold">Per Client</TableHead>
                    <TableHead className="text-right font-semibold">Your Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(['starter', 'professional', 'enterprise'] as Plan[]).map((p) => {
                    const planData = pricing.plans[p];
                    const revenue = planData.usd * monthlyClients;
                    const commission = revenue * planData.commission;
                    return (
                      <TableRow key={p} className="border-b border-border last:border-0">
                        <TableCell className="font-medium capitalize text-foreground">{p}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(planData.usd)}</TableCell>
                        <TableCell className="text-right text-[#003087] font-medium">
                          {formatCurrency(commission)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
