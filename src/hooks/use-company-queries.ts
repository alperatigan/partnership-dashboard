'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Company, PartnerNote, PartnerWithCompany, Commission } from '@/types';
import { useSelectedCompany } from '@/lib/company-context';

const supabase = createClient();

// Query Keys
export const companyKeys = {
  all: ['companies'] as const,
  company: (id: string) => ['companies', id] as const,
  partnerNotes: (partnerId: string) => ['partner-notes', partnerId] as const,
};

// Company Queries
export function useCompanies() {
  return useQuery({
    queryKey: companyKeys.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as Company[];
    },
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.company(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Company;
    },
    enabled: !!id,
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Company> & { id: string }) => {
      const { data, error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Company;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.all });
      queryClient.setQueryData(companyKeys.company(data.id), data);
    },
  });
}

// Partner Notes
export function usePartnerNotes(partnerId: string) {
  return useQuery({
    queryKey: companyKeys.partnerNotes(partnerId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_notes')
        .select(`
          *,
          admin:admin_id(name)
        `)
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PartnerNote[];
    },
    enabled: !!partnerId,
  });
}

export function useCreatePartnerNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (note: Omit<PartnerNote, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('partner_notes')
        .insert(note)
        .select()
        .single();
      if (error) throw error;
      return data as PartnerNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.partnerNotes(data.partner_id) });
    },
  });
}

export function useUpdatePartnerNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PartnerNote> & { id: string }) => {
      const { data, error } = await supabase
        .from('partner_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as PartnerNote;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.partnerNotes(data.partner_id) });
    },
  });
}

export function useDeletePartnerNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, partnerId }: { id: string; partnerId: string }) => {
      const { error } = await supabase
        .from('partner_notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, partnerId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.partnerNotes(data.partnerId) });
    },
  });
}

// Partner Companies (junction table)
export function usePartnerCompanies(partnerId: string) {
  return useQuery({
    queryKey: ['partner-companies', partnerId] as const,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_companies')
        .select(`
          *,
          company:company_id(*)
        `)
        .eq('partner_id', partnerId);
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });
}

export function useAddPartnerToCompany() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ partnerId, companyId }: { partnerId: string; companyId: string }) => {
      const { data, error } = await supabase
        .from('partner_companies')
        .insert({ partner_id: partnerId, company_id: companyId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-companies'] });
    },
  });
}

// Company-filtered queries helper hook
export function useCompanyFilteredQuery<T>(
  tableName: string,
  selectQuery: string = '*',
  options: { enabled?: boolean } = {}
) {
  const { companyId, isAllCompanies } = useSelectedCompany();
  
  return useQuery({
    queryKey: [tableName, companyId],
    queryFn: async () => {
      let query = supabase.from(tableName).select(selectQuery);
      
      if (!isAllCompanies && companyId) {
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
    enabled: options.enabled !== false,
  });
}

// Stats by company
export function useAdminStatsByCompany() {
  const { companyId, isAllCompanies } = useSelectedCompany();
  
  return useQuery({
    queryKey: ['admin-stats', companyId],
    queryFn: async () => {
      let partnersQuery = supabase.from('partners').select('*', { count: 'exact', head: true });
      let pendingQuery = supabase.from('partners').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      let commissionsQuery = supabase.from('commissions').select('*');
      
      if (!isAllCompanies && companyId) {
        partnersQuery = partnersQuery.eq('company_id', companyId);
        pendingQuery = pendingQuery.eq('company_id', companyId);
        commissionsQuery = commissionsQuery.eq('company_id', companyId);
      }
      
      const [partnersResult, pendingResult, commissionsResult] = await Promise.all([
        partnersQuery,
        pendingQuery,
        commissionsQuery
      ]);
      
      const commissions = commissionsResult.data as Commission[] || [];
      const totalPaid = commissions
        .filter((c: Commission) => c.status === 'paid')
        .reduce((sum: number, c: Commission) => sum + (c.amount || 0), 0);
      const totalPending = commissions
        .filter((c: Commission) => c.status === 'pending' || c.status === 'approved')
        .reduce((sum: number, c: Commission) => sum + (c.amount || 0), 0);
      
      return {
        total_partners: partnersResult.count || 0,
        pending_applications: pendingResult.count || 0,
        total_commissions_paid: totalPaid,
        total_commissions_pending: totalPending,
      };
    },
  });
}
