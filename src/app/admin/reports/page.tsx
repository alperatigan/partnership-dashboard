'use client';

import { usePartners, useCommissions } from '@/hooks/use-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Download, Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
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

  const COLORS = ['#1a6b4a', '#f5d0c5', '#6b6b6b', '#2d9d6a'];

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-serif">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Overview of partnership program performance
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partnerCount}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Commissions</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.paidCommissions)}</div>
            <p className="text-xs text-muted-foreground">Completed payouts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalCommissions / (commissions?.length || 1))}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Partners by Country */}
        <Card>
          <CardHeader>
            <CardTitle>Partners by Country</CardTitle>
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

        {/* Partners by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Partners by Status</CardTitle>
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
                  <Bar dataKey="value" fill="#1a6b4a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Commission Trend</CardTitle>
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
                    stroke="#1a6b4a"
                    strokeWidth={2}
                    dot={{ fill: '#1a6b4a' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Commission Transactions</CardTitle>
          <CardDescription>Latest commission entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Client</th>
                  <th className="text-right py-3 px-4 font-medium">Amount</th>
                  <th className="text-right py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions?.slice(0, 10).map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-3 px-4">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{c.client_name || 'N/A'}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          c.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : c.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {c.status}
                      </span>
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
