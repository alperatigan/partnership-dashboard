'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, Calendar } from 'lucide-react';

interface UpcomingPayment {
  id: string;
  partnerName: string;
  amount: number;
  scheduledDate: string;
  paymentMethod?: string;
}

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[];
  title?: string;
  maxItems?: number;
}

export function UpcomingPayments({ 
  payments, 
  title = 'Upcoming Payments',
  maxItems = 5 
}: UpcomingPaymentsProps) {
  const displayedPayments = payments.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {displayedPayments.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              No upcoming payments
            </div>
          ) : (
            displayedPayments.map((payment) => (
              <div 
                key={payment.id} 
                className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{payment.partnerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {payment.paymentMethod || 'Bank Transfer'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(payment.amount)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(payment.scheduledDate)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
