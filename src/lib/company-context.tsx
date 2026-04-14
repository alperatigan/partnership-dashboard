'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Company } from '@/types';

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  isAllCompanies: boolean;
  isLoading: boolean;
  selectCompany: (companyId: string | 'all') => void;
  refreshCompanies: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ 
  children, 
  initialCompanyId = null 
}: { 
  children: ReactNode;
  initialCompanyId?: string | null;
}) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | 'all'>(initialCompanyId || 'all');
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = useMemo(() => createClient(), []);

  const fetchCompanies = useCallback(async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setCompanies(data as Company[]);
    }
  }, [supabase]);

  useEffect(() => {
    const mounted = { current: true };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    fetchCompanies().then(() => {
      if (mounted.current) {
        setIsLoading(false);
      }
    });
    return () => { mounted.current = false; };
  }, [fetchCompanies]);

  const selectedCompany = selectedCompanyId === 'all' 
    ? null 
    : companies.find(c => c.id === selectedCompanyId) || null;

  const selectCompany = useCallback((companyId: string | 'all') => {
    setSelectedCompanyId(companyId);
    if (companyId !== 'all') {
      localStorage.setItem('selected_company_id', companyId);
    } else {
      localStorage.removeItem('selected_company_id');
    }
  }, []);

  const value: CompanyContextType = useMemo(() => ({
    companies,
    selectedCompany,
    isAllCompanies: selectedCompanyId === 'all',
    isLoading,
    selectCompany,
    refreshCompanies: fetchCompanies,
  }), [companies, selectedCompany, selectedCompanyId, isLoading, selectCompany, fetchCompanies]);

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    return {
      companies: [],
      selectedCompany: null,
      isAllCompanies: true,
      isLoading: true,
      selectCompany: () => {},
      refreshCompanies: async () => {},
    };
  }
  return context;
}

export function useCompanies() {
  const { companies, isLoading } = useCompany();
  return { data: companies, isLoading };
}

export function useSelectedCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    return {
      company: null,
      isAllCompanies: true,
      companyId: null,
      companyName: 'All Companies',
      companyColor: null,
    };
  }
  return {
    company: context.selectedCompany,
    isAllCompanies: context.isAllCompanies,
    companyId: context.selectedCompany?.id || null,
    companyName: context.selectedCompany?.name || 'All Companies',
    companyColor: context.selectedCompany?.primary_color || null,
  };
}
