import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { TransactionReportPDF } from '@/components/admin/report-pdf';
import type { Transaction } from '@/types';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const searchParams = request.nextUrl.searchParams;
  
  // Filter parameters
  const companyId = searchParams.get('company_id');
  const type = searchParams.get('type');
  const direction = searchParams.get('direction');
  const partnerId = searchParams.get('partner_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const dateRangeLabel = searchParams.get('date_range_label') || 'Tümü';
  
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
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate + 'T23:59:59');
  }

  const { data: transactions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate summary
  const txList = transactions as Transaction[];
  const totalIncome = txList
    .filter(t => t.direction === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = txList
    .filter(t => t.direction === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const summary = {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    count: txList.length,
  };

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

  // Generate PDF
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
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transaction-report-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (pdfError) {
    console.error('PDF generation error:', pdfError);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}