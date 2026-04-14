'use server';

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('company_id');
  const partnerId = searchParams.get('partner_id');
  const type = searchParams.get('type');
  const direction = searchParams.get('direction');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const limit = searchParams.get('limit') || '50';
  const offset = searchParams.get('offset') || '0';

  let query = supabase
    .from('transactions_with_details')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (companyId && companyId !== 'all') {
    query = query.eq('company_id', companyId);
  }
  if (partnerId && partnerId !== 'all') {
    query = query.eq('partner_id', partnerId);
  }
  if (type) {
    query = query.eq('type', type);
  }
  if (direction) {
    query = query.eq('direction', direction);
  }
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const body = await request.json();
  const {
    company_id,
    partner_id,
    type,
    direction,
    amount,
    currency = 'USD',
    description,
    reference,
    status = 'completed',
    metadata = {}
  } = body;

  const { data: userData } = await supabase.auth.getUser();
  const recorded_by = userData.user?.id;

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      company_id,
      partner_id,
      type,
      direction,
      amount: parseFloat(amount),
      currency,
      description,
      reference,
      status,
      recorded_by,
      metadata
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function GET_EXPORT(request: NextRequest) {
  const supabase = await createClient();
  
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get('company_id');
  const partnerId = searchParams.get('partner_id');
  const type = searchParams.get('type');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const format = searchParams.get('format') || 'csv';

  let query = supabase
    .from('transactions_with_details')
    .select('*')
    .order('created_at', { ascending: false });

  if (companyId && companyId !== 'all') {
    query = query.eq('company_id', companyId);
  }
  if (partnerId && partnerId !== 'all') {
    query = query.eq('partner_id', partnerId);
  }
  if (type) {
    query = query.eq('type', type);
  }
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === 'csv') {
    const csvHeaders = ['Date', 'Partner', 'Company', 'Type', 'Direction', 'Amount', 'Currency', 'Description', 'Reference', 'Status'];
    const csvRows = data.map(t => [
      new Date(t.created_at).toISOString().split('T')[0],
      t.partner_name || 'N/A',
      t.company_name || 'N/A',
      t.type,
      t.direction,
      t.amount,
      t.currency,
      t.description || '',
      t.reference || '',
      t.status
    ].join(','));

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  }

  return NextResponse.json({ data, count: data.length });
}