'use client';

import { useCompany, useCompanies } from '@/lib/company-context';
import { Check, ChevronDown, Building2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function CompanySwitcher() {
  const { selectedCompany, isAllCompanies, selectCompany, isLoading } = useCompany();
  const { data: companies } = useCompanies();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="h-10 bg-[#E1E5EB] animate-pulse rounded-lg" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white border border-border hover:bg-[#F5F7FA] transition-colors w-full shadow-sm"
      >
        <div 
          className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold bg-[#003087]"
        >
          {(selectedCompany?.name || 'All').charAt(0)}
        </div>
        <span className="flex-1 text-left text-sm font-medium truncate text-foreground">
          {selectedCompany?.name || 'All Companies'}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-border rounded-xl shadow-lg py-2 z-50">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Company
            </p>
          </div>
          
          <div className="h-px bg-border mx-3 my-2" />
          
          <button
            onClick={() => {
              selectCompany('all');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F5F7FA] transition-colors ${
              isAllCompanies ? 'bg-[#F5F7FA]' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#003087] to-[#009CDE] flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-foreground">All Companies</p>
              <p className="text-xs text-muted-foreground">View data from both companies</p>
            </div>
            {isAllCompanies && <Check className="h-4 w-4 text-[#003087]" />}
          </button>

          <div className="h-px bg-border mx-3 my-2" />
          
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Companies
            </p>
          </div>

          {companies?.map((company) => (
            <button
              key={company.id}
              onClick={() => {
                selectCompany(company.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F5F7FA] transition-colors ${
                selectedCompany?.id === company.id ? 'bg-[#F5F7FA]' : ''
              }`}
            >
              <div 
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: company.primary_color }}
              >
                {company.name.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{company.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{company.slug}</p>
              </div>
              {selectedCompany?.id === company.id && (
                <Check className="h-4 w-4 text-[#003087]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
