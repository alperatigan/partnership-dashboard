'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setCompanies(data as Company[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
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

  const value: CompanyContextType = {
    companies,
    selectedCompany,
    isAllCompanies: selectedCompanyId === 'all',
    isLoading,
    selectCompany,
    refreshCompanies: fetchCompanies,
  };

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}

export function useCompanies() {
  const { companies, isLoading } = useCompany();
  return { data: companies, isLoading };
}

export function useSelectedCompany() {
  const { selectedCompany, isAllCompanies } = useCompany();
  return { 
    company: selectedCompany, 
    isAllCompanies,
    companyId: selectedCompany?.id || null,
    companyName: selectedCompany?.name || 'All Companies',
    companyColor: selectedCompany?.primary_color || null,
  };
}
