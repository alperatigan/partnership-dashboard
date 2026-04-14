'use client';

import { useState, useMemo } from 'react';
import { useCompany } from '@/lib/company-context';
import { usePartners } from '@/hooks/use-queries';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionDialog } from '@/components/admin/transaction-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  Gift,
  Users,
  RefreshCw,
  X
} from 'lucide-react';
import type { Transaction, TransactionType, TransactionDirection } from '@/types';

const transactionTypeLabels: Record<TransactionType, string> = {
  commission: 'Commission',
  demo_bonus: 'Demo Bonus',
  setup_fee: 'Setup Fee',
  customer_payment: 'Customer Payment',
  refund: 'Refund',
  other: 'Other'
};

const transactionTypeColors: Record<TransactionType, string> = {
  commission: 'bg-green-100 text-green-700 border-green-200',
  demo_bonus: 'bg-blue-100 text-blue-700 border-blue-200',
  setup_fee: 'bg-purple-100 text-purple-700 border-purple-200',
  customer_payment: 'bg-amber-100 text-amber-700 border-amber-200',
  refund: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200'
};

const transactionTypeIcons: Record<TransactionType, typeof ArrowUpRight> = {
  commission: TrendingUp,
  demo_bonus: Gift,
  setup_fee: Users,
  customer_payment: ArrowUpRight,
  refund: RefreshCw,
  other: ArrowLeftRight
};

const directionColors: Record<TransactionDirection, string> = {
  income: 'text-green-600',
  expense: 'text-red-600'
};

const directionLabels: Record<TransactionDirection, string> = {
  income: 'Income',
  expense: 'Expense'
};

export default function AdminActivityPage() {
  const { selectedCompany, isAllCompanies } = useCompany();
  const { data: partners } = usePartners();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const limit = 20;
  const offset = (page - 1) * limit;

  const fetchTransactions = async () => {
    setIsLoading(true);
    const supabase = createClient();
    
    let query = supabase
      .from('transactions_with_details')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (selectedCompany && !isAllCompanies) {
      query = query.eq('company_id', selectedCompany.id);
    }
    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }
    if (directionFilter !== 'all') {
      query = query.eq('direction', directionFilter);
    }
    if (partnerFilter !== 'all') {
      query = query.eq('partner_id', partnerFilter);
    }
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case '7d':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30d':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case '90d':
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
        case '6m':
          startDate = new Date(now.setMonth(now.getMonth() - 6));
          break;
        case '1y':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data, error, count } = await query;
    
    if (!error && data) {
      setTransactions(data as Transaction[]);
      setCount(count || 0);
    }
    setIsLoading(false);
  };

  useState(() => {
    fetchTransactions();
  });

  useMemo(() => {
    fetchTransactions();
  }, [selectedCompany, isAllCompanies, typeFilter, directionFilter, partnerFilter, dateRange, page]);

  const handleExport = async (exportType: 'all' | 'monthly' | 'yearly' | 'custom') => {
    setIsExporting(true);
    const supabase = createClient();
    
    let startDate: string | null = null;
    let endDate: string | null = null;
    
    if (exportType === 'monthly') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    } else if (exportType === 'yearly') {
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
      endDate = new Date(now.getFullYear(), 11, 31).toISOString();
    } else if (exportType === 'custom' && dateRange !== 'all') {
      const now = new Date();
      switch (dateRange) {
        case '7d':
          startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
          endDate = new Date().toISOString();
          break;
        case '30d':
          startDate = new Date(now.setDate(now.getDate() - 30)).toISOString();
          endDate = new Date().toISOString();
          break;
        default:
          startDate = null;
          endDate = null;
      }
    }

    let query = supabase
      .from('transactions_with_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (selectedCompany && !isAllCompanies) {
      query = query.eq('company_id', selectedCompany.id);
    }
    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }
    if (directionFilter !== 'all') {
      query = query.eq('direction', directionFilter);
    }
    if (partnerFilter !== 'all') {
      query = query.eq('partner_id', partnerFilter);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data } = await query;

    if (data) {
      const csvHeaders = ['Date', 'Partner', 'Company', 'Type', 'Direction', 'Amount', 'Currency', 'Description', 'Reference', 'Status'];
      const csvRows = (data as Transaction[]).map(t => [
        format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
        t.partner_name || 'N/A',
        t.company_name || 'N/A',
        t.type,
        t.direction,
        t.amount.toFixed(2),
        t.currency,
        t.description || '',
        t.reference || '',
        t.status
      ].join(','));
      const csv = [csvHeaders.join(','), ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${exportType}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsExporting(false);
  };

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(t => 
      t.partner_name?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  const clearFilters = () => {
    setTypeFilter('all');
    setDirectionFilter('all');
    setPartnerFilter('all');
    setDateRange('all');
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters = typeFilter !== 'all' || directionFilter !== 'all' || partnerFilter !== 'all' || dateRange !== 'all' || searchQuery;

  const totalPages = Math.ceil(count / limit);
  const totalIncome = transactions.filter(t => t.direction === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.direction === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-muted-foreground">
            {isAllCompanies ? 'All companies transaction history' : `Transactions for ${selectedCompany?.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          <TransactionDialog onSuccess={fetchTransactions} />
          <Button variant="outline" onClick={() => handleExport('monthly')} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Monthly
          </Button>
          <Button variant="outline" onClick={() => handleExport('yearly')} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Yearly
          </Button>
          <Button variant="outline" onClick={() => handleExport('custom')} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            Current Filter
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expense</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(totalIncome - totalExpense).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{count}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search partner, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="commission">Commission</SelectItem>
                <SelectItem value="demo_bonus">Demo Bonus</SelectItem>
                <SelectItem value="setup_fee">Setup Fee</SelectItem>
                <SelectItem value="customer_payment">Customer Payment</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Directions</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={partnerFilter} onValueChange={setPartnerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                {partners?.map(partner => (
                  <SelectItem key={partner.id} value={partner.id}>{partner.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F7FA] border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partner</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">Direction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const IconComponent = transactionTypeIcons[transaction.type];
                    return (
                      <tr key={transaction.id} className="hover:bg-[#F5F7FA]/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">
                            {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(transaction.created_at), 'HH:mm')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-foreground">
                            {transaction.partner_name || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.company_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${transactionTypeColors[transaction.type]} border`}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {transactionTypeLabels[transaction.type]}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-foreground max-w-[200px] truncate">
                            {transaction.description || '-'}
                          </div>
                          {transaction.reference && (
                            <div className="text-xs text-muted-foreground">
                              Ref: {transaction.reference}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold">
                            ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {transaction.currency}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Badge variant="outline" className={transaction.direction === 'income' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                            {transaction.direction === 'income' ? (
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 mr-1" />
                            )}
                            {directionLabels[transaction.direction]}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {offset + 1} to {Math.min(offset + limit, count)} of {count} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}