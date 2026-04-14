'use client';

import { useState, useMemo } from 'react';
import { usePartners } from '@/hooks/use-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle,
  Search,
  TrendingDown,
  Users,
  Mail,
} from 'lucide-react';
import { getCountryFlag, getCountryName } from '@/lib/utils';
import type { Partner } from '@/types';

interface PartnerWithKPI extends Partner {
  monthly_leads?: number;
  monthly_demos?: number;
  lead_quota?: number;
  demo_quota?: number;
  under_quota_months?: number;
}

function generateMockKPI(partnerId: string, seed: number): { leads: number; demos: number; leadQuota: number; demoQuota: number; underMonths: number } {
  const x = Math.sin(seed) * 10000;
  const rand = x - Math.floor(x);
  const x2 = Math.sin(seed * 2) * 10000;
  const rand2 = x2 - Math.floor(x2);
  const x3 = Math.sin(seed * 3) * 10000;
  const rand3 = x3 - Math.floor(x3);
  return {
    leads: Math.floor(rand * 25),
    demos: Math.floor(rand2 * 15),
    leadQuota: 20,
    demoQuota: 12,
    underMonths: Math.floor(rand3 * 3),
  };
}

export default function AdminAlertsPage() {
  const { data: partners, isLoading } = usePartners();
  const [search, setSearch] = useState('');
  const [alertType, setAlertType] = useState<'all' | 'under_lead' | 'under_demo' | 'critical'>('all');
  const [selectedPartner, setSelectedPartner] = useState<PartnerWithKPI | null>(null);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const mockKPIData = useMemo(() => {
    const data: Record<string, { leads: number; demos: number; leadQuota: number; demoQuota: number; underMonths: number }> = {};
    if (partners) {
      partners.forEach((p, idx) => {
        data[p.id] = generateMockKPI(p.id, idx);
      });
    }
    return data;
  }, [partners]);

  const getPartnerKPI = (partner: Partner): PartnerWithKPI => {
    const kpi = mockKPIData[partner.id] || {
      leads: 0,
      demos: 0,
      leadQuota: 20,
      demoQuota: 12,
      underMonths: 0,
    };
    
    return {
      ...partner,
      monthly_leads: kpi.leads,
      monthly_demos: kpi.demos,
      lead_quota: kpi.leadQuota,
      demo_quota: kpi.demoQuota,
      under_quota_months: kpi.underMonths,
    };
  };

  const getLeadProgress = (partner: PartnerWithKPI) => {
    if (!partner.lead_quota) return 0;
    return Math.min(((partner.monthly_leads || 0) / partner.lead_quota) * 100, 100);
  };

  const getDemoProgress = (partner: PartnerWithKPI) => {
    if (!partner.demo_quota) return 0;
    return Math.min(((partner.monthly_demos || 0) / partner.demo_quota) * 100, 100);
  };

  const filteredPartners = partners?.filter(partner => {
    const p = getPartnerKPI(partner);
    const matchesSearch = 
      partner.name.toLowerCase().includes(search.toLowerCase()) ||
      partner.email.toLowerCase().includes(search.toLowerCase());
    
    const leadProgress = getLeadProgress(p);
    const demoProgress = getDemoProgress(p);
    const isUnderLead = leadProgress < 100;
    const isUnderDemo = demoProgress < 100;
    const isCritical = Boolean(p.under_quota_months && p.under_quota_months >= 2);

    let matchesFilter = true;
    if (alertType === 'under_lead') matchesFilter = isUnderLead;
    if (alertType === 'under_demo') matchesFilter = isUnderDemo;
    if (alertType === 'critical') matchesFilter = isCritical;

    return matchesSearch && matchesFilter && partner.status === 'approved';
  }) || [];

  const stats = {
    total: partners?.filter(p => p.status === 'approved').length || 0,
    underLead: partners?.filter(p => {
      const kpi = mockKPIData[p.id];
      return p.status === 'approved' && kpi && kpi.leads < kpi.leadQuota;
    }).length || 0,
    underDemo: partners?.filter(p => {
      const kpi = mockKPIData[p.id];
      return p.status === 'approved' && kpi && kpi.demos < kpi.demoQuota;
    }).length || 0,
    critical: partners?.filter(p => {
      const kpi = mockKPIData[p.id];
      return p.status === 'approved' && kpi && kpi.underMonths >= 2;
    }).length || 0,
  };

  const openAlertDialog = (partner: PartnerWithKPI) => {
    setSelectedPartner(partner);
    const leadPct = getLeadProgress(partner);
    const demoPct = getDemoProgress(partner);
    
    let defaultMessage = `Hi ${partner.name},\n\n`;
    defaultMessage += `This is a friendly reminder about your monthly targets:\n\n`;
    defaultMessage += `- Leads: ${partner.monthly_leads || 0}/${partner.lead_quota || 20} (${leadPct.toFixed(0)}%)\n`;
    defaultMessage += `- Demos: ${partner.monthly_demos || 0}/${partner.demo_quota || 12} (${demoPct.toFixed(0)}%)\n\n`;
    
    if (partner.under_quota_months && partner.under_quota_months >= 2) {
      defaultMessage += `⚠️ You've been under quota for ${partner.under_quota_months} consecutive months. `;
      defaultMessage += `Please reach out to your manager if you need support.\n\n`;
    }
    
    defaultMessage += `Keep up the great work!\nThe ClinixGlow Team`;
    
    setAlertMessage(defaultMessage);
    setShowAlertDialog(true);
  };

  const handleSendAlert = () => {
    // In real app, this would send via email/supabase
    console.log('Sending alert to', selectedPartner?.email, ':', alertMessage);
    setShowAlertDialog(false);
    setSelectedPartner(null);
    setAlertMessage('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">KPI Alerts</h1>
        <p className="text-muted-foreground mt-1">
          Monitor partner performance and send quota alerts
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Active Partners</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total approved</p>
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
                <p className="text-sm font-medium text-muted-foreground">Under Lead Quota</p>
                <p className="text-3xl font-bold text-foreground">{stats.underLead}</p>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#FF8C00]/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-[#FF8C00]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Under Demo Quota</p>
                <p className="text-3xl font-bold text-foreground">{stats.underDemo}</p>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#FF8C00]/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-[#FF8C00]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`border overflow-hidden ${stats.critical > 0 ? 'border-[#E61E00]/30' : 'border-border'}`}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-3xl font-bold text-foreground">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">2+ months under quota</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stats.critical > 0 ? 'bg-[#E61E00]/10' : 'bg-[#00A303]/10'}`}>
                <AlertTriangle className={`h-5 w-5 ${stats.critical > 0 ? 'text-[#E61E00]' : 'text-[#00A303]'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Partner Performance</CardTitle>
              <CardDescription>
                {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  className="pl-9 w-[200px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as typeof alertType)}
              >
                <option value="all">All Partners</option>
                <option value="under_lead">Under Lead Quota</option>
                <option value="under_demo">Under Demo Quota</option>
                <option value="critical">Critical (2+ months)</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F7FA]">
                <TableHead className="font-semibold">Partner</TableHead>
                <TableHead className="font-semibold">Country</TableHead>
                <TableHead className="font-semibold">Leads Progress</TableHead>
                <TableHead className="font-semibold">Demos Progress</TableHead>
                <TableHead className="font-semibold">Under Quota</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No partners found matching criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner) => {
                  const p = getPartnerKPI(partner);
                  const leadProgress = getLeadProgress(p);
                  const demoProgress = getDemoProgress(p);
    const isCritical = !!(p.under_quota_months && p.under_quota_months >= 2);

                  return (
                    <TableRow key={partner.id} className={`border-b border-border last:border-0 ${isCritical ? 'bg-[#E61E00]/5' : ''}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{partner.name}</p>
                          <p className="text-sm text-muted-foreground">{partner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{getCountryFlag(partner.country)}</span>
                          <span className="text-foreground">{getCountryName(partner.country)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{p.monthly_leads || 0}/{p.lead_quota || 20}</span>
                            <span className={leadProgress < 100 ? 'text-[#FF8C00]' : 'text-[#00A303]'}>
                              {leadProgress.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={leadProgress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{p.monthly_demos || 0}/{p.demo_quota || 12}</span>
                            <span className={demoProgress < 100 ? 'text-[#FF8C00]' : 'text-[#00A303]'}>
                              {demoProgress.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={demoProgress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.under_quota_months && p.under_quota_months > 0 ? (
                          <Badge className={isCritical ? 'bg-[#E61E00]/10 text-[#E61E00] border-[#E61E00]/20' : 'bg-[#FFC439]/20 text-[#B8860B] border-[#FFC439]/30'}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {p.under_quota_months} mo
                          </Badge>
                        ) : (
                          <Badge className="bg-[#00A303]/10 text-[#00A303] border-[#00A303]/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            On track
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-medium"
                          onClick={() => openAlertDialog(p)}
                        >
                          <Bell className="h-4 w-4 mr-1" />
                          Alert
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Alert Dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send KPI Alert</DialogTitle>
            <DialogDescription>
              Send a performance reminder to {selectedPartner?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedPartner.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedPartner.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Lead Progress</p>
                  <p className="text-lg font-bold">
                    {selectedPartner.monthly_leads || 0}/{selectedPartner.lead_quota || 20}
                  </p>
                </div>
                <div className="p-3 border rounded">
                  <p className="text-sm text-muted-foreground">Demo Progress</p>
                  <p className="text-lg font-bold">
                    {selectedPartner.monthly_demos || 0}/{selectedPartner.demo_quota || 12}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="alertMessage">Email Message</Label>
                <Textarea
                  id="alertMessage"
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows={10}
                  className="mt-1 font-mono text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="font-semibold border-2" onClick={() => setShowAlertDialog(false)}>
              Cancel
            </Button>
            <Button className="font-semibold bg-[#003087] hover:bg-[#003087]/90" onClick={handleSendAlert}>
              <BellRing className="h-4 w-4 mr-1" />
              Send Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
