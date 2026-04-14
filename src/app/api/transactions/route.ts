'use server';

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const direction = searchParams.get('direction');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const limit = searchParams.get('limit') || '50';
  const offset = searchParams.get('offset') || '0';

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: partnerData } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', userData.user.id)
    .single();

  if (!partnerData) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
  }

  let query = supabase
    .from('transactions_with_details')
    .select('*', { count: 'exact' })
    .eq('partner_id', partnerData.id)
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

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