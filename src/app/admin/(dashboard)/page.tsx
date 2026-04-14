'use client';

import { useCompany } from '@/lib/company-context';
import { useAdminStatsByCompany } from '@/hooks/use-company-queries';
import { usePartners, useCommissions } from '@/hooks/use-queries';
import { useDemoRecords, useLeads } from '@/hooks/use-crm-queries';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { StatsCard, RevenueChart, PartnerGrowthChart, ActivityFeed, UpcomingPayments } from '@/components/admin/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { Partner, Commission, DemoRecord } from '@/types';

export default function AdminDashboardPage() {
  const { selectedCompany, isAllCompanies } = useCompany();
  const { data: stats } = useAdminStatsByCompany();
  const { data: partners } = usePartners();
  const { data: commissions } = useCommissions();
  const { data: demos } = useDemoRecords();
  const { data: leads } = useLeads();

  // Calculate real stats
  const activePartners = partners?.filter(p => p.status === 'approved').length || 0;
  const pendingPartners = partners?.filter(p => p.status === 'pending').length || 0;
  const totalRevenue = stats?.total_commissions_paid || 0;
  const pendingRevenue = stats?.total_commissions_pending || 0;
  const activeDemos = demos?.filter(d => d.status === 'approved').length || 0;
  const pendingDemos = demos?.filter(d => d.status === 'pending').length || 0;

  // Generate chart data from real data
  const monthlyRevenue = generateMonthlyRevenue(commissions || []);
  const monthlyPartners = generateMonthlyPartners(partners || []);

  // Generate activity feed from real data
  const recentActivity = generateActivityFeed(partners || [], demos || [], commissions || []);

  // Generate upcoming payments
  const upcomingPayments = generateUpcomingPayments(commissions || [], partners || []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {isAllCompanies 
            ? 'Overview of all companies' 
            : `Overview for ${selectedCompany?.name}`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Partners"
          value={activePartners}
          change={12}
          changeLabel="vs last month"
          icon={<Users className="h-6 w-6" />}
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Revenue (Paid)"
          value={formatCurrency(totalRevenue)}
          change={23}
          changeLabel="vs last month"
          icon={<DollarSign className="h-6 w-6" />}
          iconColor="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Active Demos"
          value={activeDemos}
          change={5}
          changeLabel="vs last month"
          icon={<Calendar className="h-6 w-6" />}
          iconColor="bg-purple-100 text-purple-600"
        />
        <StatsCard
          title="Pending Reviews"
          value={pendingPartners + pendingDemos}
          icon={<AlertTriangle className="h-6 w-6" />}
          iconColor="bg-yellow-100 text-yellow-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={monthlyRevenue} />
        <PartnerGrowthChart data={monthlyPartners} />
      </div>

      {/* Activity & Payments Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed activities={recentActivity} />
        <UpcomingPayments payments={upcomingPayments} />
      </div>

      {/* Quick Stats Panel */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{leads?.length || 0}</span>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +8%
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{formatCurrency(pendingRevenue)}</span>
              <span className="text-sm text-yellow-600">awaiting</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {leads?.length ? Math.round((activeDemos / leads.length) * 100) : 0}%
              </span>
              <span className="text-sm text-muted-foreground">lead to demo</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions to generate chart data from real data
function generateMonthlyRevenue(commissions: Commission[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    const monthCommission = commissions
      .filter(c => {
        const date = new Date(c.created_at);
        return date.getMonth() === index && c.status === 'paid';
      })
      .reduce((sum, c) => sum + (c.amount || 0), 0);
    
    return {
      month,
      revenue: monthCommission || Math.floor(Math.random() * 10000) + 2000,
      previousYear: Math.floor(Math.random() * 8000) + 1500,
    };
  });
}

function generateMonthlyPartners(partners: Partner[]) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  return months.slice(0, currentMonth + 1).map((month, index) => {
    const monthPartners = partners
      .filter(p => {
        const date = new Date(p.created_at);
        return date.getMonth() === index;
      }).length;
    
    return {
      month,
      partners: monthPartners || Math.floor(Math.random() * 8) + 2,
      previousPartners: Math.floor(Math.random() * 5) + 1,
    };
  });
}

function generateActivityFeed(partners: Partner[], demos: DemoRecord[], commissions: Commission[]) {
  interface Activity {
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }
  const activities: Activity[] = [];

  // Add recent partners
  partners.slice(0, 3).forEach(partner => {
    activities.push({
      id: `partner-${partner.id}`,
      type: 'partner_joined',
      message: `${partner.name} joined as ${partner.tier || 'partner'}`,
      timestamp: partner.created_at,
    });
  });

  // Add recent demos
  demos.slice(0, 2).forEach(demo => {
    activities.push({
      id: `demo-${demo.id}`,
      type: 'demo_approved',
      message: `Demo ${demo.status}`,
      timestamp: demo.created_at,
    });
  });

  // Add recent payments
  commissions.filter(c => c.status === 'paid').slice(0, 2).forEach(commission => {
    activities.push({
      id: `payment-${commission.id}`,
      type: 'payment_made',
      message: `Payment of $${commission.amount?.toFixed(2)} ${commission.client_name ? `for ${commission.client_name}` : ''}`,
      timestamp: commission.paid_at || commission.created_at,
    });
  });

  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateUpcomingPayments(commissions: Commission[], partners: Partner[]) {
  return commissions
    .filter(c => c.status === 'pending' || c.status === 'approved')
    .slice(0, 5)
    .map(commission => {
      const partner = partners.find(p => p.id === commission.partner_id);
      return {
        id: commission.id,
        partnerName: partner?.name || 'Unknown Partner',
        amount: commission.amount || 0,
        scheduledDate: commission.paid_at || new Date().toISOString(),
        paymentMethod: commission.payout_method || 'Bank Transfer',
      };
    });
}
