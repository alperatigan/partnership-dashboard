'use client';

import { useAuth } from '@/hooks/use-auth';
import { useTemsilciStats, useLeads, useDemoRecords, usePayments, useExpiringLeads } from '@/hooks/use-crm-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate, getCountryName, getCountryFlag } from '@/lib/utils';
import type { Lead, Payment, LeadsWithExpiry } from '@/types';

export default function TemsilciDashboardPage() {
  const { user } = useAuth();
  const partnerId = user?.id || '';

  const { data: stats, isLoading: statsLoading } = useTemsilciStats(partnerId);
  const { data: leads } = useLeads({ partnerId });
  const { data: demos } = useDemoRecords({ partnerId });
  const { data: payments } = usePayments({ partnerId });
  const { data: expiringLeads } = useExpiringLeads(partnerId, 14);

  const isLoading = statsLoading || !user;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const demoProgress = stats ? (stats.demo_count_this_month / stats.demo_target) * 100 : 0;
  const payoutProgress = stats ? Math.min((stats.pending_balance / stats.payout_threshold) * 100, 100) : 0;

  const recentLeads = leads?.slice(0, 5) || [];
  const recentPayments = payments?.filter(p => p.status === 'paid').slice(0, 5) || [];

  const leadStatusColors: Record<string, string> = {
    contacted: 'bg-blue-100 text-blue-800',
    demo_scheduled: 'bg-yellow-100 text-yellow-800',
    demo_done: 'bg-orange-100 text-orange-800',
    trial_active: 'bg-green-100 text-green-800',
    closed: 'bg-primary/10 text-primary',
    expired: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-serif">
            Welcome back, {user?.name?.split(' ')[0] || 'Partner'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your partnership overview
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/leads/new">
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/demos/new">
              <Calendar className="mr-2 h-4 w-4" />
              Log Demo
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.this_month_earnings || 0)}</div>
            <p className="text-xs text-muted-foreground">Setup + Commission + Bonus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_customers || 0}</div>
            <p className="text-xs text-muted-foreground">In trial or active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Demos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{stats?.demo_count_this_month || 0}</span>
                <span className="text-sm text-muted-foreground">/ {stats?.demo_target || 12}</span>
              </div>
              <Progress value={demoProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {stats?.demo_target ? stats?.demo_target - stats?.demo_count_this_month : 12} more to reach target
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lifetime Portfolio</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.lifetime_commission_portfolio || 0)}</div>
            <p className="text-xs text-muted-foreground">Total commissions earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-lg">Pending Balance</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              $100 payout threshold
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">{formatCurrency(stats?.pending_balance || 0)}</div>
            <div className="space-y-2">
              <Progress value={payoutProgress} className="h-3 bg-primary-foreground/20" />
              <p className="text-sm text-primary-foreground/80">
                {stats?.payout_threshold && stats?.pending_balance < stats?.payout_threshold
                  ? `${formatCurrency((stats?.payout_threshold || 100) - (stats?.pending_balance || 0))} more to reach $100`
                  : 'Ready for payout!'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads This Month</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.new_leads_this_month || 0}</div>
            <Link
              href="/dashboard/leads"
              className="text-sm text-primary hover:underline"
            >
              View all leads →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Expiring Leads */}
        {expiringLeads && expiringLeads.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg">Expiring Soon</CardTitle>
                <Badge variant="destructive">{expiringLeads.length}</Badge>
              </div>
              <CardDescription>
                Leads expiring in the next 14 days - follow up now!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {expiringLeads.map((lead: LeadsWithExpiry) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.clinic_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getCountryFlag(lead.country)} {getCountryName(lead.country)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <Clock className="h-3 w-3 mr-1" />
                          {lead.days_until_expiry}d left
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Leads</CardTitle>
            <Link href="/dashboard/leads" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {recentLeads.length > 0 ? (
              <Table>
                <TableBody>
                  {recentLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.clinic_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getCountryFlag(lead.country)} {getCountryName(lead.country)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={leadStatusColors[lead.status] || 'bg-gray-100'}>
                          {lead.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(lead.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No leads yet</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/dashboard/leads/new">Add your first lead</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment History</CardTitle>
            <Link href="/dashboard/payments" className="text-sm text-primary hover:underline">
              View all →
            </Link>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <Table>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            payment.type === 'commission' ? 'bg-green-100' : 
                            payment.type === 'bonus' ? 'bg-blue-100' : 'bg-red-100'
                          }`}>
                            {payment.type === 'commission' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                            ) : payment.type === 'bonus' ? (
                              <ArrowUpRight className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{payment.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(payment.paid_at || payment.created_at)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          +{formatCurrency(payment.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No payments yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demo Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">This month verified demos</span>
                <span className="font-semibold">{stats?.demo_count_this_month || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Monthly target</span>
                <span className="font-semibold">{stats?.demo_target || 12}</span>
              </div>
              <Progress value={demoProgress} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                {demoProgress >= 100
                  ? '🎉 Target reached! Great job!'
                  : `${Math.round(demoProgress)}% of monthly target`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link href="/dashboard/leads/new">
              <Plus className="h-5 w-5" />
              <span>Add New Lead</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link href="/dashboard/demos/new">
              <Calendar className="h-5 w-5" />
              <span>Log Demo</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link href="/dashboard/commissions">
              <DollarSign className="h-5 w-5" />
              <span>View Commissions</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
            <Link href="/dashboard/documents">
              <FileText className="h-5 w-5" />
              <span>Documents</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
