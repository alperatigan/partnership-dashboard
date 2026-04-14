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
      <div className="h-10 bg-muted animate-pulse rounded-lg" />
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors w-full"
      >
        <div 
          className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
          style={{ 
            backgroundColor: selectedCompany?.primary_color || '#6366F1' 
          }}
        >
          {(selectedCompany?.name || 'All').charAt(0)}
        </div>
        <span className="flex-1 text-left text-sm font-medium truncate">
          {selectedCompany?.name || 'All Companies'}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-background border rounded-xl shadow-lg py-2 z-50">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Select Company
            </p>
          </div>
          
          <div className="h-px bg-border mx-3 my-2" />
          
          <button
            onClick={() => {
              selectCompany('all');
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors ${
              isAllCompanies ? 'bg-muted/50' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">All Companies</p>
              <p className="text-xs text-muted-foreground">View data from both companies</p>
            </div>
            {isAllCompanies && <Check className="h-4 w-4 text-primary" />}
          </button>

          <div className="h-px bg-border mx-3 my-2" />
          
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors ${
                selectedCompany?.id === company.id ? 'bg-muted/50' : ''
              }`}
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: company.primary_color }}
              >
                {company.name.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{company.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{company.slug}</p>
              </div>
              {selectedCompany?.id === company.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
