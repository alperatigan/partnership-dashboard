'use client';

import { usePartners, useCommissions } from '@/hooks/use-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Download, Calendar, TrendingUp, Users, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency, getCountryName } from '@/lib/utils';
import { useMemo } from 'react';

export default function AdminReportsPage() {
  const { data: partners } = usePartners();
  const { data: commissions } = useCommissions();

  const stats = useMemo(() => {
    if (!partners || !commissions) return null;

    const byCountry = partners.reduce((acc, p) => {
      acc[p.country] = (acc[p.country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = partners.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
    const paidCommissions = commissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      byCountry: Object.entries(byCountry).map(([name, value]) => ({
        name,
        value,
        label: getCountryName(name),
      })),
      byStatus: Object.entries(byStatus).map(([name, value]) => ({
        name,
        value,
      })),
      totalCommissions,
      paidCommissions,
      partnerCount: partners.length,
    };
  }, [partners, commissions]);

  const COLORS = ['#003087', '#009CDE', '#FFC439', '#00A303'];

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Overview of partnership program performance
          </p>
        </div>
        <Button variant="outline" className="font-semibold border-2">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Partners</p>
                <p className="text-3xl font-bold text-foreground">{stats.partnerCount}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#003087]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Commissions</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(stats.totalCommissions)}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#00A303]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#00A303]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Paid Commissions</p>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(stats.paidCommissions)}</p>
                <p className="text-xs text-muted-foreground">Completed payouts</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#009CDE]/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#009CDE]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Avg Commission</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(stats.totalCommissions / (commissions?.length || 1))}
                </p>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#FFC439]/20 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#B8860B]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Partners by Country</CardTitle>
            <CardDescription>Distribution of partners across markets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byCountry}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.byCountry.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Partners by Status</CardTitle>
            <CardDescription>Application status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#003087" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Commission Trend</CardTitle>
            <CardDescription>Monthly commission payments over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { month: 'Jan', amount: 1200 },
                    { month: 'Feb', amount: 1900 },
                    { month: 'Mar', amount: 1500 },
                    { month: 'Apr', amount: 2200 },
                    { month: 'May', amount: 2800 },
                    { month: 'Jun', amount: 2400 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#003087"
                    strokeWidth={2}
                    dot={{ fill: '#003087' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Commission Transactions</CardTitle>
          <CardDescription>Latest commission entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5F7FA]">
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Partner</th>
                  <th className="text-right py-3 px-4 font-semibold">Amount</th>
                  <th className="text-right py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions?.slice(0, 10).map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-foreground">{c.partner_name || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#003087]">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge className={
                        c.status === 'paid'
                          ? 'bg-[#00A303]/10 text-[#00A303] border-[#00A303]/20'
                          : c.status === 'pending'
                          ? 'bg-[#FFC439]/20 text-[#B8860B] border-[#FFC439]/30'
                          : 'bg-[#E61E00]/10 text-[#E61E00] border-[#E61E00]/20'
                      }>
                        {c.status === 'paid' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {c.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {c.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
