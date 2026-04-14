'use client';

import { useAuth } from '@/hooks/use-auth';
import { usePayments } from '@/hooks/use-crm-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, Clock, CheckCircle, AlertTriangle, CreditCard, Building, Wallet, Shield } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-[#FFC439]/20 text-[#B8860B] border-[#FFC439]/30', icon: Clock },
  approved: { label: 'Approved', color: 'bg-[#003087]/10 text-[#003087] border-[#003087]/20', icon: Clock },
  paid: { label: 'Paid', color: 'bg-[#00A303]/10 text-[#00A303] border-[#00A303]/20', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-[#E61E00]/10 text-[#E61E00] border-[#E61E00]/20', icon: AlertTriangle },
};

const methodConfig: Record<string, { label: string; icon: React.ElementType }> = {
  wise: { label: 'Wise', icon: Wallet },
  payoneer: { label: 'Payoneer', icon: CreditCard },
  gcash: { label: 'GCash', icon: CreditCard },
  bank_transfer: { label: 'Bank Transfer', icon: Building },
};

function Mobile(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
      <path d="M12 18h.01"/>
    </svg>
  );
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const partnerId = user?.id || '';

  const { data: payments, isLoading } = usePayments({ partnerId });

  const paidPayments = payments?.filter(p => p.status === 'paid') || [];
  const pendingPayments = payments?.filter(p => p.status === 'pending' || p.status === 'approved') || [];
  const totalPaid = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const year1Payments = paidPayments.filter(p => p.year_1);
  const year2PlusPayments = paidPayments.filter(p => !p.year_1);
  const year1Total = year1Payments.reduce((sum, p) => sum + p.amount, 0);
  const year2PlusTotal = year2PlusPayments.reduce((sum, p) => sum + p.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">
          Track your earnings and payment history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#00A303]/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#00A303]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
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
            <div className="text-2xl font-bold text-foreground">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payout</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Year 1</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-[#003087]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${year1Total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{year1Payments.length} payments</p>
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Year 2+</CardTitle>
            <div className="w-9 h-9 rounded-lg bg-[#009CDE]/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-[#009CDE]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${year2PlusTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{year2PlusPayments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Payment History</CardTitle>
              <CardDescription>
                {payments?.length || 0} payment{(payments?.length || 0) !== 1 ? 's' : ''} total
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-[#F5F7FA] rounded-lg px-3 py-2">
              <Shield className="w-4 h-4" />
              <span>Secure & Encrypted</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F7FA]">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Method</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No payments yet. Start closing deals to earn commissions!
                  </TableCell>
                </TableRow>
              ) : (
                payments?.map((payment) => {
                  const status = statusConfig[payment.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const method = methodConfig[payment.payment_method || 'bank_transfer'];
                  const MethodIcon = method.icon;

                  return (
                    <TableRow key={payment.id} className="border-b border-border last:border-0">
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">${payment.amount.toFixed(2)}</span>
                          <Badge variant="outline" className="text-xs font-medium">
                            {payment.year_1 ? 'Year 1' : 'Year 2+'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize text-foreground">
                        {payment.type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MethodIcon className="h-4 w-4" />
                          <span>{method.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color + " border font-medium"}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.payment_reference || '-'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
