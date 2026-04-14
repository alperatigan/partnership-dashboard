'use client';

import { useAuth } from '@/hooks/use-auth';
import { useCommissions } from '@/hooks/use-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DollarSign,
  Download,
  Filter,
  MoreHorizontal,
  ArrowUpRight,
  Clock,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import type { Commission, CommissionStatus } from '@/types';

const statusConfig: Record<CommissionStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-[#FFC439]/20 text-[#B8860B] border-[#FFC439]/30' },
  approved: { label: 'Approved', color: 'bg-[#003087]/10 text-[#003087] border-[#003087]/20' },
  paid: { label: 'Paid', color: 'bg-[#00A303]/10 text-[#00A303] border-[#00A303]/20' },
  cancelled: { label: 'Cancelled', color: 'bg-[#E61E00]/10 text-[#E61E00] border-[#E61E00]/20' },
  clawback: { label: 'Clawback', color: 'bg-[#E61E00]/10 text-[#E61E00] border-[#E61E00]/20' },
};

export default function CommissionsPage() {
  const { user } = useAuth();
  const { data: commissions, isLoading } = useCommissions(
    user ? { partnerId: user.id } : undefined
  );
  const [filter, setFilter] = useState<CommissionStatus | 'all'>('all');

  const filteredCommissions = commissions?.filter((c) =>
    filter === 'all' ? true : c.status === filter
  ) || [];

  const stats = {
    total: commissions?.reduce((sum, c) => sum + c.amount, 0) || 0,
    pending: commissions?.filter(c => c.status === 'pending' || c.status === 'approved').reduce((sum, c) => sum + c.amount, 0) || 0,
    paid: commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commissions</h1>
          <p className="text-muted-foreground mt-1">
            Track your earnings and payouts
          </p>
        </div>
        <Button variant="outline" className="font-semibold border-2">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earned</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#003087]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#FFC439]/20 flex items-center justify-center">
              <Clock className="h-5 w-5 text-[#B8860B]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.pending)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid Out</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#00A303]/10 flex items-center justify-center">
              <ArrowUpRight className="h-5 w-5 text-[#00A303]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(stats.paid)}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            className="font-semibold"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            className="font-semibold"
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'paid' ? 'default' : 'outline'}
            size="sm"
            className="font-semibold"
            onClick={() => setFilter('paid')}
          >
            Paid
          </Button>
        </div>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Transaction History</CardTitle>
          <CardDescription>
            {filteredCommissions.length} commission{filteredCommissions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCommissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F5F7FA]">
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Deal Value</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCommissions.map((commission) => (
                  <TableRow key={commission.id} className="border-b border-border last:border-0">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{commission.client_name || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{commission.client_email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-[#003087]">
                        {formatCurrency(commission.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {commission.deal_value ? (
                        formatCurrency(commission.deal_value, commission.deal_currency || 'USD')
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusConfig[commission.status].color + " border font-medium"}>
                        {statusConfig[commission.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(commission.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-lg bg-[#F5F7FA] flex items-center justify-center mb-4">
                <Wallet className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No commissions yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start referring clients to earn commissions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
