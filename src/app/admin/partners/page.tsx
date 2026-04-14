'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  DollarSign,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAdminStats } from '@/hooks/use-queries';
import { PartnersTable } from '@/components/admin/partners/partners-table';
import { PartnerDetailModal } from '@/components/admin/partners/partner-detail-modal';
import type { Partner } from '@/types';

export default function AdminPartnersPage() {
  const { data: stats } = useAdminStats();
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif">Partner Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage partner applications and accounts
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_partners || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_applications || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.total_commissions_paid || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Commissions</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.total_commissions_pending || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table */}
      <PartnersTable 
        onPartnerClick={setSelectedPartner}
      />

      {/* Partner Detail Modal */}
      <PartnerDetailModal
        partner={selectedPartner}
        open={!!selectedPartner}
        onOpenChange={(open) => !open && setSelectedPartner(null)}
      />
    </div>
  );
}
