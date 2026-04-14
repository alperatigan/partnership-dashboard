'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePayments } from '@/hooks/use-crm-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { DollarSign, Clock, CheckCircle, AlertTriangle, CreditCard, Building, Wallet } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Payment, PaymentStatus, PaymentMethod } from '@/types';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
};

const methodConfig: Record<string, { label: string; icon: React.ElementType }> = {
  wise: { label: 'Wise', icon: Wallet },
  payoneer: { label: 'Payoneer', icon: CreditCard },
  gcash: { label: 'GCash', icon: Mobile },
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wise');

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
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif">Payments</h1>
        <p className="text-muted-foreground mt-1">
          Track your earnings and payment history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CardDescription>Lifetime earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">${totalPaid.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CardDescription>Awaiting payout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-3xl font-bold">${totalPending.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Year 1</CardTitle>
            <CardDescription>First year commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">${year1Total.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{year1Payments.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Year 2+</CardTitle>
            <CardDescription>Renewal commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">${year2PlusTotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{year2PlusPayments.length} payments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            {payments?.length || 0} payment{payments?.length !== 1 ? 's' : ''} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
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
                    <TableRow key={payment.id}>
                      <TableCell className="text-muted-foreground">
                        {formatDate(payment.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">${payment.amount.toFixed(2)}</span>
                          <Badge variant="outline" className="text-xs">
                            {payment.year_1 ? 'Year 1' : 'Year 2+'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MethodIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{method.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} border`}>
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