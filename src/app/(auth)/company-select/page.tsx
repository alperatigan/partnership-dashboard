'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Building2, ArrowRight, Check } from 'lucide-react';
import type { Company } from '@/types';

export default function CompanySelectPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }

      // Get user's partner record
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (!partner) {
        router.push('/dashboard');
        return;
      }

      // Get partner's companies
      const { data: partnerCompanies } = await supabase
        .from('partner_companies')
        .select('company_id')
        .eq('partner_id', partner.id)
        .eq('is_active', true);

      if (!partnerCompanies || partnerCompanies.length <= 1) {
        // Only one company, redirect to dashboard
        if (partnerCompanies && partnerCompanies.length === 1) {
          localStorage.setItem('selected_company_id', partnerCompanies[0].company_id);
        }
        router.push('/dashboard');
        return;
      }

      // Get company details
      const companyIds = partnerCompanies.map((pc: { company_id: string }) => pc.company_id);
      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds);

      if (companyData) {
        setCompanies(companyData as Company[]);
      }
      setLoading(false);
    }

    fetchData();
  }, [router]);

  const handleContinue = () => {
    if (selectedCompany) {
      localStorage.setItem('selected_company_id', selectedCompany);
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <span className="text-primary-foreground font-serif text-xl">CG</span>
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-lg">
            Which company would you like to work with today?
          </p>
        </div>

        {/* Company Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => setSelectedCompany(company.id)}
              className={`relative p-6 rounded-2xl border-2 transition-all duration-200 text-left ${
                selectedCompany === company.id
                  ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                  : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
              }`}
            >
              {/* Company Logo */}
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-4"
                style={{ backgroundColor: company.primary_color }}
              >
                {company.name.charAt(0)}
              </div>

              {/* Company Info */}
              <h3 className="text-xl font-semibold mb-1">{company.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">{company.slug}</p>

              {/* Selection Indicator */}
              {selectedCompany === company.id && (
                <div 
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: company.primary_color }}
                >
                  <Check className="h-5 w-5" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedCompany}
          className={`w-full py-4 rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all ${
            selectedCompany
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          Continue to Dashboard
          <ArrowRight className="h-5 w-5" />
        </button>

        {/* Skip Option */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          You can switch companies later from the dashboard header
        </p>
      </div>
    </div>
  );
}
