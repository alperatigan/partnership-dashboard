'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCompany } from '@/lib/company-context';
import { usePartners } from '@/hooks/use-queries';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  FileText,
  Download,
  Loader2,
  X,
  Calendar,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import type { Transaction, TransactionType, TransactionDirection, Lead, Partner } from '@/types';

type ReportType = 'transaction_activity' | 'commission_summary' | 'partner_performance' | 'demo_prospective';

interface ReportDialogProps {
  onSuccess?: () => void;
}

const reportTypeLabels: Record<ReportType, string> = {
  transaction_activity: 'Transaction Activity',
  commission_summary: 'Commission Summary',
  partner_performance: 'Partner Performance',
  demo_prospective: 'Demo & Prospective Customer',
};

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

export function ReportDialog({ onSuccess }: ReportDialogProps) {
  const { selectedCompany, isAllCompanies } = useCompany();
  const { data: partners } = usePartners();
  const supabase = createClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('transaction_activity');
  
  const [customers, setCustomers] = useState<Lead[]>([]);
  const [previewData, setPreviewData] = useState<Transaction[]>([]);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch customers for dropdown
  useEffect(() => {
    async function fetchCustomers() {
      const { data } = await supabase
        .from('leads')
        .select('id, clinic_name, contact_name, country')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (data) {
        setCustomers(data as Lead[]);
      }
    }
    
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen, supabase]);

  // Fetch preview data when filters change
  useEffect(() => {
    if (isOpen) {
      fetchPreviewData();
    }
  }, [isOpen, typeFilter, directionFilter, partnerFilter, customerFilter, dateRange, customStartDate, customEndDate, reportType]);

  const fetchPreviewData = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('transactions_with_details')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); // Preview limit

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
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      query = query.gte('created_at', new Date(customStartDate).toISOString());
      query = query.query.lte('created_at', new Date(customEndDate + 'T23:59:59').toISOString());
    } else if (dateRange !== 'all') {
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

    const { data } = await query;
    
    if (data) {
      setPreviewData(data as Transaction[]);
    }
    setIsLoading(false);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    
    const params = new URLSearchParams({
      report_type: reportType,
      company_id: isAllCompanies ? 'all' : (selectedCompany?.id || 'all'),
      type: typeFilter,
      direction: directionFilter,
      partner_id: partnerFilter,
      date_range: dateRange,
      custom_start_date: customStartDate,
      custom_end_date: customEndDate,
    });
      
    window.open(`/api/admin/reports/pdf?${params.toString()}`, '_blank');
    setIsExporting(false);
  };

  const handleExportCSV = () => {
    if (previewData.length === 0) return;
    
    const csvHeaders = ['Date', 'Partner', 'Company', 'Type', 'Direction', 'Amount', 'Currency', 'Description', 'Reference', 'Status'];
    const csvRows = previewData.map(t => [
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
    a.download = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setTypeFilter('all');
    setDirectionFilter('all');
    setPartnerFilter('all');
    setCustomerFilter('all');
    setDateRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasActiveFilters = typeFilter !== 'all' || directionFilter !== 'all' || partnerFilter !== 'all' || customerFilter !== 'all' || dateRange !== 'all';

  const totalIncome = previewData.filter(t => t.direction === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = previewData.filter(t => t.direction === 'expense').reduce((sum, t) => sum + t.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Create Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Report</DialogTitle>
          <DialogDescription>
            Build and preview your report with custom filters, then export to PDF or CSV.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex gap-4 min-h-0">
          {/* Left Panel - Filters */}
          <div className="w-[280px] flex-shrink-0 space-y-4 overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Report Type</Label>
              <Select value={reportType} onValueChange={(v: ReportType) => setReportType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Filters</Label>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
              
              {/* Partner Filter */}
              <div className="space-y-2 mb-4">
                <Label className="text-xs text-muted-foreground">Partner</Label>
                <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Partners" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Partners</SelectItem>
                    {partners?.map(partner => (
                      <SelectItem key={partner.id} value={partner.id}>
                        {partner.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Filter */}
              <div className="space-y-2 mb-4">
                <Label className="text-xs text-muted-foreground">Customer</Label>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Customers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Customers</SelectItem>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.clinic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2 mb-4">
                <Label className="text-xs text-muted-foreground">Transaction Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Types" />
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
              </div>

              {/* Direction Filter */}
              <div className="space-y-2 mb-4">
                <Label className="text-xs text-muted-foreground">Direction</Label>
                <Select value={directionFilter} onValueChange={setDirectionFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Directions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2 mb-4">
                <Label className="text-xs text-muted-foreground">Date Range</Label>
                <Select value={dateRange} onValueChange={(v) => {
                  setDateRange(v);
                  if (v !== 'custom') {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="1y">Last 1 Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Picker */}
              {dateRange === 'custom' && (
                <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start Date</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden border rounded-lg">
            {/* Preview Header */}
            <div className="flex items-center justify-between p-3 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Preview</span>
                <Badge variant="secondary">{previewData.length} records</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Total Income: <span className="text-green-600 font-medium">${totalIncome.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Total Expense: <span className="text-red-600 font-medium">${totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                </span>
              </div>
            </div>

            {/* Preview Table */}
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : previewData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <FileText className="h-10 w-10 mb-2" />
                  <p>No transactions found with current filters.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[#003087] text-white sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Date</th>
                      <th className="px-3 py-2 text-left font-medium">Partner</th>
                      <th className="px-3 py-2 text-left font-medium">Type</th>
                      <th className="px-3 py-2 text-left font-medium">Direction</th>
                      <th className="px-3 py-2 text-right font-medium">Amount</th>
                      <th className="px-3 py-2 text-left font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((transaction, idx) => (
                      <tr key={transaction.id} className={idx % 2 === 1 ? 'bg-slate-50' : ''}>
                        <td className="px-3 py-2">
                          {format(new Date(transaction.created_at), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-3 py-2">
                          {transaction.partner_name || 'N/A'}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs rounded border ${transactionTypeColors[transaction.type]}`}>
                            {transactionTypeLabels[transaction.type]}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
                            transaction.direction === 'income' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {transaction.direction === 'income' ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            {transaction.direction === 'income' ? 'Income' : 'Expense'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {transaction.currency} {transaction.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">
                          {transaction.description || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleExportCSV} disabled={isExporting || previewData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button type="button" onClick={handleExportPDF} disabled={isExporting || previewData.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}