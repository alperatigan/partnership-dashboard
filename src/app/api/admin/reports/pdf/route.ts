import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { TransactionReportPDF } from '@/components/admin/report-pdf';
import type { Transaction } from '@/types';

type ReportType = 'transaction_activity' | 'commission_summary' | 'partner_performance' | 'demo_prospective';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const searchParams = request.nextUrl.searchParams;
  
  const reportType = (searchParams.get('report_type') || 'transaction_activity') as ReportType;
  const companyId = searchParams.get('company_id');
  const type = searchParams.get('type');
  const direction = searchParams.get('direction');
  const partnerId = searchParams.get('partner_id');
  const dateRange = searchParams.get('date_range') || 'all';
  const customStartDate = searchParams.get('custom_start_date');
  const customEndDate = searchParams.get('custom_end_date');
  
  // Build query
  let query = supabase
    .from('transactions_with_details')
    .select('*')
    .order('created_at', { ascending: false });

  if (companyId && companyId !== 'all') {
    query = query.eq('company_id', companyId);
  }
  if (type && type !== 'all') {
    query = query.eq('type', type);
  }
  if (direction && direction !== 'all') {
    query = query.eq('direction', direction);
  }
  if (partnerId && partnerId !== 'all') {
    query = query.eq('partner_id', partnerId);
  }
  
  // Apply date range filters
  let startDate: string | null = null;
  let endDate: string | null = null;
  
  if (dateRange === 'custom' && customStartDate && customEndDate) {
    startDate = customStartDate;
    endDate = customEndDate;
    query = query.gte('created_at', new Date(startDate).toISOString());
    query = query.lte('created_at', new Date(endDate + 'T23:59:59').toISOString());
  } else if (dateRange !== 'all') {
    const now = new Date();
    let start: Date;
    switch (dateRange) {
      case '7d':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        start = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90d':
        start = new Date(now.setDate(now.getDate() - 90));
        break;
      case '6m':
        start = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1y':
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        start = new Date(0);
    }
    query = query.gte('created_at', start.toISOString());
  }

  const { data: transactions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const txList = transactions as Transaction[];
  const totalIncome = txList
    .filter(t => t.direction === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = txList
    .filter(t => t.direction === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Get company name
  let companyName = 'ClinixGlow & Graftscope';
  if (companyId && companyId !== 'all') {
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();
    if (company) {
      companyName = company.name;
    }
  }

  // Get date range label
  let dateRangeLabel = 'All Time';
  if (dateRange === 'custom' && customStartDate && customEndDate) {
    dateRangeLabel = `${customStartDate} - ${customEndDate}`;
  } else if (dateRange !== 'all') {
    const rangeLabels: Record<string, string> = {
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      '6m': 'Last 6 Months',
      '1y': 'Last 1 Year',
    };
    dateRangeLabel = rangeLabels[dateRange] || dateRange;
  }

  const reportTypeLabels: Record<ReportType, string> = {
    transaction_activity: 'Islem Aktivite Raporu',
    commission_summary: 'Komisyon Ozet Raporu',
    partner_performance: 'Partner Performans Raporu',
    demo_prospective: 'Demo & Potansiyel Musteri Raporu',
  };

  const summary = {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    count: txList.length,
  };

  try {
    const pdfBuffer = await renderToBuffer(
      TransactionReportPDF({
        transactions: txList,
        dateRange: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          label: dateRangeLabel,
        },
        summary,
        companyName,
        reportType,
        reportTitle: reportTypeLabels[reportType],
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportType}-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (pdfError) {
    console.error('PDF generation error:', pdfError);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}