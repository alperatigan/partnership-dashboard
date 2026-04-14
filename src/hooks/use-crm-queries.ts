// Extended queries for CRM modules

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Lead, DemoRecord, Payment, PartnerChecklist, PartnerKPIs, Partner, Commission, TemsilciDashboardStats } from '@/types';

const supabase = createClient();

// Query Keys
export const queryKeys = {
  // ... existing keys
  leads: ['leads'] as const,
  lead: (id: string) => ['leads', id] as const,
  partnerLeads: (partnerId: string) => ['leads', 'partner', partnerId] as const,
  demoRecords: ['demos'] as const,
  partnerDemos: (partnerId: string) => ['demos', 'partner', partnerId] as const,
  payments: ['payments'] as const,
  partnerPayments: (partnerId: string) => ['payments', 'partner', partnerId] as const,
  partnerChecklist: (partnerId: string) => ['checklist', partnerId] as const,
  partnerKPIs: (partnerId: string) => ['kpis', partnerId] as const,
  pendingDemoAudit: ['demos', 'pending_audit'] as const,
  temsilciStats: (partnerId: string) => ['temsilci-stats', partnerId] as const,
};

// ============ LEAD QUERIES ============

export function useLeads(filters?: { partnerId?: string; status?: string }) {
  return useQuery({
    queryKey: filters?.partnerId
      ? queryKeys.partnerLeads(filters.partnerId)
      : queryKeys.leads,
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.partnerId) {
        query = query.eq('partner_id', filters.partnerId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Lead;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'expires_at' | 'is_expired' | 'registered_at' | 'first_contact_date'> & { first_contact_date?: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          first_contact_date: lead.first_contact_date || new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Lead> & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      queryClient.setQueryData(queryKeys.lead(data.id), data);
    },
  });
}

export function useExpiringLeads(partnerId: string, daysThreshold: number = 7) {
  return useQuery({
    queryKey: [...queryKeys.partnerLeads(partnerId), 'expiring'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads_with_expiry')
        .select('*')
        .eq('partner_id', partnerId)
        .lte('days_until_expiry', daysThreshold)
        .gte('days_until_expiry', 0);
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });
}

// ============ DEMO RECORD QUERIES ============

export function useDemoRecords(filters?: { partnerId?: string; status?: string }) {
  return useQuery({
    queryKey: filters?.partnerId
      ? queryKeys.partnerDemos(filters.partnerId)
      : queryKeys.demoRecords,
    queryFn: async () => {
      let query = supabase
        .from('demo_records')
        .select('*, leads:lead_id(*)')
        .order('created_at', { ascending: false });

      if (filters?.partnerId) {
        query = query.eq('partner_id', filters.partnerId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DemoRecord[];
    },
  });
}

export function usePendingDemoAudit() {
  return useQuery({
    queryKey: queryKeys.pendingDemoAudit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demo_records')
        .select('*, leads:lead_id(*)')
        .eq('status', 'pending');
      if (error) throw error;
      return data as DemoRecord[];
    },
  });
}

export function useCreateDemoRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (demo: Omit<DemoRecord, 'id' | 'created_at' | 'updated_at' | 'is_verified'>) => {
      const { data, error } = await supabase
        .from('demo_records')
        .insert(demo)
        .select()
        .single();
      if (error) throw error;
      return data as DemoRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.demoRecords });
    },
  });
}

export function useUpdateDemoRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DemoRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('demo_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DemoRecord;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.demoRecords });
    },
  });
}

export function useApproveDemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, auditedBy, auditNotes }: { id: string; auditedBy: string; auditNotes?: string }) => {
      const { data, error } = await supabase
        .from('demo_records')
        .update({
          status: 'approved',
          audited_by: auditedBy,
          audited_at: new Date().toISOString(),
          audit_notes: auditNotes,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DemoRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.demoRecords });
    },
  });
}

// ============ PAYMENT QUERIES ============

export function usePayments(filters?: { partnerId?: string; status?: string }) {
  return useQuery({
    queryKey: filters?.partnerId
      ? queryKeys.partnerPayments(filters.partnerId)
      : queryKeys.payments,
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.partnerId) {
        query = query.eq('partner_id', filters.partnerId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: Omit<Payment, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();
      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Payment> & { id: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Payment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments });
    },
  });
}

// ============ PARTNER CHECKLIST ============

export function usePartnerChecklist(partnerId: string) {
  return useQuery({
    queryKey: queryKeys.partnerChecklist(partnerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_checklists')
        .select('*')
        .eq('partner_id', partnerId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as PartnerChecklist | null;
    },
    enabled: !!partnerId,
  });
}

export function useUpdatePartnerChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partnerId, ...updates }: Partial<PartnerChecklist> & { partnerId: string }) => {
      const { data, error } = await supabase
        .from('partner_checklists')
        .update(updates)
        .eq('partner_id', partnerId)
        .select()
        .single();
      if (error) throw error;
      return data as PartnerChecklist;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partnerChecklist(data.partner_id) });
    },
  });
}

// ============ PARTNER KPIs ============

export function usePartnerKPIs(partnerId: string) {
  return useQuery({
    queryKey: queryKeys.partnerKPIs(partnerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_kpis')
        .select('*')
        .eq('partner_id', partnerId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as PartnerKPIs | null;
    },
    enabled: !!partnerId,
  });
}

// ============ TEMSILCI DASHBOARD STATS ============

export function useTemsilciStats(partnerId: string) {
  return useQuery({
    queryKey: queryKeys.temsilciStats(partnerId),
    queryFn: async (): Promise<TemsilciDashboardStats> => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [
        { data: commissions },
        { data: payments },
        { data: leads },
        { data: demos },
        { data: partners },
      ] = await Promise.all([
        supabase.from('commissions').select('*').eq('partner_id', partnerId),
        supabase.from('payments').select('*').eq('partner_id', partnerId).eq('status', 'paid'),
        supabase.from('leads').select('*').eq('partner_id', partnerId),
        supabase.from('demo_records').select('*').eq('partner_id', partnerId).eq('is_verified', true),
        supabase.from('partners').select('*').eq('id', partnerId).single(),
      ]);

      const paidPayments = (payments as Payment[] || []).filter(p => p.status === 'paid');
      const pendingPayments = (payments as Payment[] || []).filter(p => p.status === 'pending' || p.status === 'approved');
      const monthlyCommissions = (commissions as Commission[] || []).filter(c => 
        c.created_at >= firstDayOfMonth && (c.status === 'paid' || c.status === 'approved')
      );
      const activeTrials = (leads as Lead[] || []).filter(l => l.status === 'trial_active');
      const monthlyDemos = (demos as DemoRecord[] || []).filter(d => d.created_at >= firstDayOfMonth);
      const newLeadsThisMonth = (leads as Lead[] || []).filter(l => l.created_at >= firstDayOfMonth);

      return {
        this_month_earnings: monthlyCommissions.reduce((sum, c) => sum + (c.amount || 0), 0),
        active_customers: activeTrials.length,
        demo_count_this_month: monthlyDemos.length,
        demo_target: partners?.monthly_demo_quota || 12,
        lifetime_commission_portfolio: paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        pending_balance: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        payout_threshold: 100,
        new_leads_this_month: newLeadsThisMonth.length,
      };
    },
    enabled: !!partnerId,
  });
}
