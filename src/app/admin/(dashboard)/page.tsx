'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePendingDemoAudit, useApproveDemo, useUpdateDemoRecord, useDemoRecords } from '@/hooks/use-crm-queries';
import { usePartners, useAdminStats } from '@/hooks/use-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Calendar,
  AlertTriangle,
  Settings,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Eye,
  Bell,
  BellRing,
  TrendingDown,
  DollarSign,
  UserCheck,
  Mail,
  ChevronDown,
} from 'lucide-react';
import { formatDate, formatCurrency, getCountryFlag, getCountryName } from '@/lib/utils';
import type { DemoRecord, Partner } from '@/types';

type TabType = 'partners' | 'demos' | 'alerts' | 'reports' | 'settings';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

const partnerStatusConfig = {
  pending: { label: 'Pending', variant: 'warning' as const },
  approved: { label: 'Approved', variant: 'success' as const },
  rejected: { label: 'Rejected', variant: 'destructive' as const },
  suspended: { label: 'Suspended', variant: 'destructive' as const },
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('partners');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [selectedPartnerData, setSelectedPartnerData] = useState<Partner | null>(null);
  const supabase = createClient();

  const handlePartnerClick = async (partner: Partner) => {
    setSelectedPartnerId(partner.id);
    setSelectedPartnerData(partner);
  };

  const handleCloseModal = () => {
    setSelectedPartnerId(null);
    setSelectedPartnerData(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif text-sm">CG</span>
              </div>
              <div>
                <h1 className="font-serif text-xl">Admin Panel</h1>
                <p className="text-sm text-muted-foreground">Graftscope Partnership Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {[
              { id: 'partners', label: 'Partners', icon: Users },
              { id: 'demos', label: 'Demos', icon: Calendar },
              { id: 'alerts', label: 'Alerts', icon: Bell },
              { id: 'reports', label: 'Reports', icon: BarChart3 },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'partners' && <PartnersSection onPartnerClick={handlePartnerClick} />}
        {activeTab === 'demos' && <DemosSection adminId="" />}
        {activeTab === 'alerts' && <AlertsSection />}
        {activeTab === 'reports' && <ReportsSection />}
        {activeTab === 'settings' && <SettingsSection />}
      </main>

      {/* Partner Detail Modal */}
      <Dialog open={!!selectedPartnerId} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Partner Dashboard: {selectedPartnerData?.name}</DialogTitle>
            <DialogDescription>{selectedPartnerData?.email} - {getCountryName(selectedPartnerData?.country || '')}</DialogDescription>
          </DialogHeader>
          {selectedPartnerId && <PartnerDetailModal partnerId={selectedPartnerId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PartnersSection({ onPartnerClick }: { onPartnerClick: (partner: Partner) => void }) {
  const { data: partners, isLoading } = usePartners();
  const { data: stats } = useAdminStats();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPartners = partners?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_partners || 0}</p>
                <p className="text-sm text-muted-foreground">Total Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.pending_applications || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.total_commissions_paid || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.this_month_new_partners || 0}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Partners</CardTitle>
              <CardDescription>{filteredPartners.length} partners found</CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 w-[200px]" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="px-3 py-2 border rounded-md text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Earnings</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => (
                <TableRow 
                  key={partner.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onPartnerClick(partner)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{partner.name}</p>
                      <p className="text-sm text-muted-foreground">{partner.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span>{getCountryFlag(partner.country)}</span>
                      <span>{getCountryName(partner.country)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{partner.tier || 'None'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={partnerStatusConfig[partner.status]?.variant || 'default'}>
                      {partnerStatusConfig[partner.status]?.label || partner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{formatCurrency(partner.total_earned)}</p>
                      <p className="text-sm text-muted-foreground">Pending: {formatCurrency(partner.pending_payout)}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(partner.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DemosSection({ adminId }: { adminId: string }) {
  const { data: pendingDemos, isLoading: pendingLoading } = usePendingDemoAudit();
  const { data: allDemos } = useDemoRecords();
  const approveDemo = useApproveDemo();
  const updateDemo = useUpdateDemoRecord();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedDemo, setSelectedDemo] = useState<DemoRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [auditNotes, setAuditNotes] = useState('');

  const handleApprove = async () => {
    if (!selectedDemo) return;
    await approveDemo.mutateAsync({ id: selectedDemo.id, auditedBy: adminId, auditNotes });
    setShowDetailDialog(false);
    setSelectedDemo(null);
    setAuditNotes('');
  };

  const handleReject = async () => {
    if (!selectedDemo) return;
    await updateDemo.mutateAsync({ id: selectedDemo.id, status: 'rejected', audit_notes: auditNotes });
    setShowDetailDialog(false);
    setSelectedDemo(null);
    setAuditNotes('');
  };

  const filteredDemos = allDemos?.filter(d => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesStatus;
  }) || [];

  const pendingCount = pendingDemos?.length || 0;

  if (pendingLoading) {
    return <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allDemos?.filter(d => d.status === 'approved').length || 0}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allDemos?.filter(d => d.status === 'rejected').length || 0}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{allDemos?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Demos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demos Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Demo Records</CardTitle>
              <CardDescription>{filteredDemos.length} demos found</CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="pl-9 w-[200px]" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="px-3 py-2 border rounded-md text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner ID</TableHead>
                <TableHead>Lead ID</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDemos.map((demo) => {
                const status = statusConfig[demo.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={demo.id}>
                    <TableCell className="font-mono text-sm">{demo.partner_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-sm">{demo.lead_id.slice(0, 8)}...</TableCell>
                    <TableCell>{demo.scheduled_at ? formatDate(demo.scheduled_at) : '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Checkbox checked={demo.crm_note_checked} disabled />
                        <Checkbox checked={demo.trial_opened} disabled />
                        <Checkbox checked={demo.follow_up_email_sent} disabled />
                        {demo.is_verified ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.color} border`}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {demo.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedDemo(demo); setShowDetailDialog(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demo Details</DialogTitle>
          </DialogHeader>
          {selectedDemo && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Partner ID</Label>
                  <p className="font-mono text-sm">{selectedDemo.partner_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Lead ID</Label>
                  <p className="font-mono text-sm">{selectedDemo.lead_id}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground mb-2 block">Verification</Label>
                <div className="flex flex-col gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2"><Checkbox checked={selectedDemo.crm_note_checked} disabled /> <span className="text-sm">CRM note</span></div>
                  <div className="flex items-center gap-2"><Checkbox checked={selectedDemo.trial_opened} disabled /> <span className="text-sm">Trial opened</span></div>
                  <div className="flex items-center gap-2"><Checkbox checked={selectedDemo.follow_up_email_sent} disabled /> <span className="text-sm">Follow-up email</span></div>
                </div>
              </div>
              <div>
                <Label htmlFor="auditNotes">Audit Notes</Label>
                <Textarea id="auditNotes" value={auditNotes} onChange={(e) => setAuditNotes(e.target.value)} className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}><XCircle className="h-4 w-4 mr-1" />Reject</Button>
            <Button onClick={handleApprove}><CheckCircle className="h-4 w-4 mr-1" />Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertsSection() {
  const { data: partners } = usePartners();
  const [search, setSearch] = useState('');

  const mockKPIData: Record<string, { leads: number; demos: number; leadQuota: number; demoQuota: number; underMonths: number }> = {};

  const getPartnerKPI = (partner: Partner) => {
    if (!mockKPIData[partner.id]) {
      mockKPIData[partner.id] = {
        leads: Math.floor(Math.random() * 25),
        demos: Math.floor(Math.random() * 15),
        leadQuota: 20,
        demoQuota: 12,
        underMonths: Math.floor(Math.random() * 4),
      };
    }
    return mockKPIData[partner.id];
  };

  const filteredPartners = partners?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && p.status === 'approved';
  }) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Partner Performance Alerts</CardTitle>
          <CardDescription>Monitor partner KPIs and send alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Leads Progress</TableHead>
                <TableHead>Demos Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map((partner) => {
                const kpi = getPartnerKPI(partner);
                const leadPct = (kpi.leads / kpi.leadQuota) * 100;
                const demoPct = (kpi.demos / kpi.demoQuota) * 100;
                const isCritical = kpi.underMonths >= 2;
                return (
                  <TableRow key={partner.id} className={isCritical ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{partner.name}</p>
                        <p className="text-sm text-muted-foreground">{partner.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 w-[120px]">
                        <div className="flex justify-between text-sm"><span>{kpi.leads}/{kpi.leadQuota}</span><span className={leadPct < 100 ? 'text-orange-500' : 'text-green-500'}>{leadPct.toFixed(0)}%</span></div>
                        <Progress value={leadPct} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 w-[120px]">
                        <div className="flex justify-between text-sm"><span>{kpi.demos}/{kpi.demoQuota}</span><span className={demoPct < 100 ? 'text-orange-500' : 'text-green-500'}>{demoPct.toFixed(0)}%</span></div>
                        <Progress value={demoPct} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      {isCritical ? <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Critical</Badge> : kpi.underMonths > 0 ? <Badge className="bg-orange-100 text-orange-800"><TrendingDown className="h-3 w-3 mr-1" />Under</Badge> : <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />On Track</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline"><BellRing className="h-4 w-4 mr-1" />Send Alert</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsSection() {
  const { data: stats } = useAdminStats();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_partners || 0}</p>
                <p className="text-sm text-muted-foreground">Total Partners</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.total_commissions_paid || 0)}</p>
                <p className="text-sm text-muted-foreground">Total Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.total_commissions_pending || 0)}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.this_month_commissions || 0}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart visualization coming soon
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Partner Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Chart visualization coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>Configure commission tiers and rates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Silver Tier</h4>
              <p className="text-2xl font-bold">10%</p>
              <p className="text-sm text-muted-foreground">Per deal commission</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Gold Tier</h4>
              <p className="text-2xl font-bold">15%</p>
              <p className="text-sm text-muted-foreground">Per deal commission</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Platinum Tier</h4>
              <p className="text-2xl font-bold">20%</p>
              <p className="text-sm text-muted-foreground">Per deal commission</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Country Pricing</CardTitle>
          <CardDescription>Manage pricing by country</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Country pricing configuration coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function PartnerDetailModal({ partnerId }: { partnerId: string }) {
  const [activeTab, setActiveTab] = useState<'leads' | 'demos' | 'payments' | 'commissions' | 'documents' | 'profile' | 'simulator'>('leads');
  const { data: partner } = usePartners();
  const currentPartner = partner?.find(p => p.id === partnerId);

  return (
    <div className="py-4">
      <div className="border-b mb-4">
        <nav className="flex gap-1 overflow-x-auto">
          {[
            { id: 'leads', label: 'Leads' },
            { id: 'demos', label: 'Demos' },
            { id: 'payments', label: 'Payments' },
            { id: 'commissions', label: 'Commissions' },
            { id: 'documents', label: 'Documents' },
            { id: 'profile', label: 'Profile' },
            { id: 'simulator', label: 'Simulator' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 text-sm border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'leads' && <PartnerLeads partnerId={partnerId} />}
        {activeTab === 'demos' && <PartnerDemos partnerId={partnerId} />}
        {activeTab === 'payments' && <PartnerPayments partnerId={partnerId} />}
        {activeTab === 'commissions' && <PartnerCommissions partnerId={partnerId} />}
        {activeTab === 'documents' && <PartnerDocuments partnerId={partnerId} />}
        {activeTab === 'profile' && currentPartner && <PartnerProfile partner={currentPartner} />}
        {activeTab === 'simulator' && <PartnerSimulator partnerId={partnerId} />}
      </div>
    </div>
  );
}

function PartnerLeads({ partnerId }: { partnerId: string }) {
  const { data: leads } = usePartners();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Leads ({leads?.length || 0})</h3>
      </div>
      <p className="text-muted-foreground text-sm">Leads management coming soon...</p>
    </div>
  );
}

function PartnerDemos({ partnerId }: { partnerId: string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Demos</h3>
      <p className="text-muted-foreground text-sm">Demo management coming soon...</p>
    </div>
  );
}

function PartnerPayments({ partnerId }: { partnerId: string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Payments</h3>
      <p className="text-muted-foreground text-sm">Payment history coming soon...</p>
    </div>
  );
}

function PartnerCommissions({ partnerId }: { partnerId: string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Commissions</h3>
      <p className="text-muted-foreground text-sm">Commission details coming soon...</p>
    </div>
  );
}

function PartnerDocuments({ partnerId }: { partnerId: string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Documents</h3>
      <p className="text-muted-foreground text-sm">Document checklist coming soon...</p>
    </div>
  );
}

function PartnerProfile({ partner }: { partner: Partner }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Profile</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground">Name</Label>
          <p>{partner.name}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Email</Label>
          <p>{partner.email}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Country</Label>
          <p>{getCountryFlag(partner.country)} {getCountryName(partner.country)}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Status</Label>
          <Badge variant={partnerStatusConfig[partner.status]?.variant || 'default'}>
            {partnerStatusConfig[partner.status]?.label || partner.status}
          </Badge>
        </div>
        <div>
          <Label className="text-muted-foreground">Tier</Label>
          <p>{partner.tier || 'None'}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">Joined</Label>
          <p>{formatDate(partner.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

function PartnerSimulator({ partnerId }: { partnerId: string }) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Simulator</h3>
      <p className="text-muted-foreground text-sm">Simulator sessions coming soon...</p>
    </div>
  );
}
