'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Partner, Commission, SimulatorSession, CountryPricing, DashboardStats } from '@/types';

const supabase = createClient();

// Query Keys
export const queryKeys = {
  partners: ['partners'] as const,
  partner: (id: string) => ['partners', id] as const,
  commissions: ['commissions'] as const,
  partnerCommissions: (partnerId: string) => ['commissions', partnerId] as const,
  simulatorSessions: (partnerId: string) => ['simulator-sessions', partnerId] as const,
  adminStats: ['admin-stats'] as const,
  countryPricing: ['country-pricing'] as const,
};

// Partner Queries
export function usePartners(filters?: { status?: string; country?: string }) {
  return useQuery({
    queryKey: [...queryKeys.partners, filters],
    queryFn: async () => {
      let query = supabase.from('partners').select('*').order('created_at', { ascending: false });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.country) {
        query = query.eq('country', filters.country);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Partner[];
    },
  });
}

export function usePartner(id: string) {
  return useQuery({
    queryKey: queryKeys.partner(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!id,
  });
}

export function useCurrentPartner(userId: string) {
  return useQuery({
    queryKey: ['current-partner', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error) throw error;
      return data as Partner;
    },
    enabled: !!userId,
  });
}

export function useUpdatePartner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Partner> & { id: string }) => {
      const { data, error } = await supabase
        .from('partners')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Partner;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partners });
      queryClient.setQueryData(queryKeys.partner(data.id), data);
    },
  });
}

export function useApprovePartner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, tier }: { id: string; tier: 'silver' | 'gold' | 'platinum' }) => {
      const { data, error } = await supabase
        .from('partners')
        .update({ status: 'approved', tier, approved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Partner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.partners });
    },
  });
}

// Commission Queries
export function useCommissions(filters?: { partnerId?: string; status?: string }) {
  return useQuery({
    queryKey: filters?.partnerId 
      ? queryKeys.partnerCommissions(filters.partnerId) 
      : queryKeys.commissions,
    queryFn: async () => {
      let query = supabase
        .from('commissions')
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
      return data as Commission[];
    },
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commission: Omit<Commission, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('commissions')
        .insert(commission)
        .select()
        .single();
      if (error) throw error;
      return data as Commission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
    },
  });
}

export function useUpdateCommission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Commission> & { id: string }) => {
      const { data, error } = await supabase
        .from('commissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Commission;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.commissions });
    },
  });
}

// Simulator Sessions
export function useSimulatorSessions(partnerId: string) {
  return useQuery({
    queryKey: queryKeys.simulatorSessions(partnerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulator_sessions')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SimulatorSession[];
    },
    enabled: !!partnerId,
  });
}

export function useSaveSimulatorSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (session: Omit<SimulatorSession, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('simulator_sessions')
        .insert(session)
        .select()
        .single();
      if (error) throw error;
      return data as SimulatorSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.simulatorSessions(data.partner_id || '') 
      });
    },
  });
}

// Admin Stats
export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: async (): Promise<DashboardStats> => {
      const [
        { count: totalPartners },
        { count: pendingApps },
        { data: commissions },
      ] = await Promise.all([
        supabase.from('partners').select('*', { count: 'exact', head: true }),
        supabase.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('commissions').select('*'),
      ]);

      const totalPaid = (commissions as Commission[] | null)?.filter((c: Commission) => c.status === 'paid').reduce((sum, c: Commission) => sum + (c.amount || 0), 0) || 0;
      const totalPending = (commissions as Commission[] | null)?.filter((c: Commission) => c.status === 'pending' || c.status === 'approved').reduce((sum, c: Commission) => sum + (c.amount || 0), 0) || 0;

      return {
        total_partners: totalPartners || 0,
        pending_applications: pendingApps || 0,
        total_commissions_paid: totalPaid,
        total_commissions_pending: totalPending,
        this_month_new_partners: 0,
        this_month_commissions: 0,
      };
    },
  });
}

// Country Pricing
export function useCountryPricing() {
  return useQuery({
    queryKey: queryKeys.countryPricing,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_pricing')
        .select('*');
      if (error) throw error;
      return data as CountryPricing[];
    },
  });
}
