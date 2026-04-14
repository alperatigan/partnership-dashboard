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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Partner Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage partner applications and accounts
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Partners</p>
                <p className="text-3xl font-bold text-foreground">{stats?.total_partners || 0}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#003087]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Applications</p>
                <p className="text-3xl font-bold text-foreground">{stats?.pending_applications || 0}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#FFC439]/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-[#B8860B]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Commissions Paid</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(stats?.total_commissions_paid || 0)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#00A303]/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-[#00A303]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Commissions</p>
                <p className="text-3xl font-bold text-foreground">
                  {formatCurrency(stats?.total_commissions_pending || 0)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#FF8C00]/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-[#FF8C00]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <PartnersTable 
        onPartnerClick={setSelectedPartner}
      />

      <PartnerDetailModal
        partner={selectedPartner}
        open={!!selectedPartner}
        onOpenChange={(open) => !open && setSelectedPartner(null)}
      />
    </div>
  );
}
