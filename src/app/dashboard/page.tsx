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
  Plus,
  ArrowUpRight,
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
        <div className="w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const demoProgress = stats ? (stats.demo_count_this_month / stats.demo_target) * 100 : 0;
  const payoutProgress = stats ? Math.min((stats.pending_balance / stats.payout_threshold) * 100, 100) : 0;

  const recentLeads = leads?.slice(0, 5) || [];
  const recentPayments = payments?.filter(p => p.status === 'paid').slice(0, 5) || [];

  const leadStatusColors: Record<string, string> = {
    contacted: 'bg-[#003087]/10 text-[#003087]',
    demo_scheduled: 'bg-[#FFC439]/20 text-[#B8860B]',
    demo_done: 'bg-[#FF8C00]/10 text-[#FF8C00]',
    trial_active: 'bg-[#00A303]/10 text-[#00A303]',
    closed: 'bg-[#003087]/10 text-[#003087]',
    expired: 'bg-[#E61E00]/10 text-[#E61E00]',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0] || 'Partner'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your partnership overview
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="font-semibold">
            <Link href="/dashboard/leads">
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Link>
          </Button>
          <Button variant="outline" asChild className="font-medium border-2">
            <Link href="/dashboard/demos">
              <Calendar className="mr-2 h-4 w-4" />
              Log Demo
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month Earnings</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#00A303]/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#00A303]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats?.this_month_earnings || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Setup + Commission + Bonus</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Customers</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-[#003087]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.active_customers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">In trial or active</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Demos</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#FFC439]/20 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#B8860B]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-foreground">{stats?.demo_count_this_month || 0}</span>
                <span className="text-sm text-muted-foreground">/ {stats?.demo_target || 12}</span>
              </div>
              <Progress value={demoProgress} className="h-2 bg-[#E1E5EB]" />
              <p className="text-xs text-muted-foreground">
                {stats?.demo_target ? stats?.demo_target - stats?.demo_count_this_month : 12} more to reach target
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Portfolio</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#009CDE]/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-[#009CDE]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats?.lifetime_commission_portfolio || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total commissions earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-[#003087] to-[#004095] text-white border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Pending Balance</CardTitle>
            <CardDescription className="text-white/70">
              $100 payout threshold
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold">{formatCurrency(stats?.pending_balance || 0)}</div>
            <div className="space-y-2">
              <Progress value={payoutProgress} className="h-3 bg-white/20" />
              <p className="text-sm text-white/80">
                {stats?.payout_threshold && stats?.pending_balance < stats?.payout_threshold
                  ? `${formatCurrency((stats?.payout_threshold || 100) - (stats?.pending_balance || 0))} more to reach $100`
                  : 'Ready for payout!'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Leads This Month</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#F5F7FA] flex items-center justify-center">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats?.new_leads_this_month || 0}</div>
            <Link
              href="/dashboard/leads"
              className="text-sm text-[#003087] hover:underline font-medium mt-1 inline-block"
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
          <Card className="border-[#FF8C00]/30 bg-[#FF8C00]/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-[#FF8C00]" />
                <CardTitle className="text-lg font-semibold">Expiring Soon</CardTitle>
                <Badge variant="error">{expiringLeads.length}</Badge>
              </div>
              <CardDescription>
                Leads expiring in the next 14 days - follow up now!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {expiringLeads.map((lead: LeadsWithExpiry) => (
                    <TableRow key={lead.id} className="border-b border-border">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{lead.clinic_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getCountryFlag(lead.country)} {getCountryName(lead.country)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="warning" className="font-medium">
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
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Leads</CardTitle>
              <Link href="/dashboard/leads" className="text-sm text-[#003087] hover:underline font-medium">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentLeads.length > 0 ? (
              <Table>
                <TableBody>
                  {recentLeads.map((lead) => (
                    <TableRow key={lead.id} className="border-b border-border last:border-0">
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{lead.clinic_name}</p>
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
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDate(lead.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No leads yet</p>
                <Button asChild variant="link" className="mt-2 text-[#003087]">
                  <Link href="/dashboard/leads/new">Add your first lead</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Payment History</CardTitle>
              <Link href="/dashboard/payments" className="text-sm text-[#003087] hover:underline font-medium">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <Table>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <TableRow key={payment.id} className="border-b border-border last:border-0">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            payment.type === 'commission' ? 'bg-[#00A303]/10' : 
                            payment.type === 'bonus' ? 'bg-[#009CDE]/10' : 'bg-[#E61E00]/10'
                          }`}>
                            {payment.type === 'commission' ? (
                              <ArrowUpRight className="h-4 w-4 text-[#00A303]" />
                            ) : payment.type === 'bonus' ? (
                              <ArrowUpRight className="h-4 w-4 text-[#009CDE]" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-[#E61E00]" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize text-foreground">{payment.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(payment.paid_at || payment.created_at)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-[#00A303]">
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
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Demo Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This month verified demos</span>
                <span className="font-semibold text-foreground">{stats?.demo_count_this_month || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monthly target</span>
                <span className="font-semibold text-foreground">{stats?.demo_target || 12}</span>
              </div>
              <Progress value={demoProgress} className="h-3 bg-[#E1E5EB]" />
              <p className="text-sm text-muted-foreground text-center font-medium">
                {demoProgress >= 100
                  ? 'Target reached! Great job!'
                  : `${Math.round(demoProgress)}% of monthly target`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Button variant="outline" className="h-auto py-5 flex-col gap-2 border-2 hover:bg-[#F5F7FA]" asChild>
            <Link href="/dashboard/leads">
              <Plus className="h-5 w-5 text-[#003087]" />
              <span className="font-medium">Add New Lead</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-5 flex-col gap-2 border-2 hover:bg-[#F5F7FA]" asChild>
            <Link href="/dashboard/demos">
              <Calendar className="h-5 w-5 text-[#003087]" />
              <span className="font-medium">Log Demo</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-5 flex-col gap-2 border-2 hover:bg-[#F5F7FA]" asChild>
            <Link href="/dashboard/commissions">
              <DollarSign className="h-5 w-5 text-[#003087]" />
              <span className="font-medium">View Commissions</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-5 flex-col gap-2 border-2 hover:bg-[#F5F7FA]" asChild>
            <Link href="/dashboard/documents">
              <FileText className="h-5 w-5 text-[#003087]" />
              <span className="font-medium">Documents</span>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
