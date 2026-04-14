'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLeads, useDemoRecords, useCreateDemoRecord, useUpdateDemoRecord } from '@/hooks/use-crm-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Progress } from '@/components/ui/progress';
import { Plus, Calendar, CheckCircle, Clock, XCircle, AlertCircle, Search } from 'lucide-react';
import { formatDate, getCountryFlag, getCountryName } from '@/lib/utils';
import type { Lead, DemoRecord, DemoStatus } from '@/types';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
};

export default function DemosPage() {
  const { user } = useAuth();
  const partnerId = user?.id || '';

  const { data: leads } = useLeads({ partnerId });
  const { data: demos, isLoading } = useDemoRecords({ partnerId });
  const createDemo = useCreateDemoRecord();
  const updateDemo = useUpdateDemoRecord();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewDemoDialog, setShowNewDemoDialog] = useState(false);

  const [newDemo, setNewDemo] = useState({
    lead_id: '',
    demo_notes: '',
    scheduled_at: '',
  });

  const [demoTarget] = useState(12);
  const monthlyDemos = demos?.filter(d => {
    const thisMonth = new Date(d.created_at);
    const now = new Date();
    return thisMonth.getMonth() === now.getMonth() && thisMonth.getFullYear() === now.getFullYear();
  }) || [];

  const progressPercent = Math.min((monthlyDemos.length / demoTarget) * 100, 100);

  const filteredDemos = demos?.filter((demo) => {
    const lead = leads?.find(l => l.id === demo.lead_id);
    const matchesSearch = lead?.clinic_name.toLowerCase().includes(search.toLowerCase()) ||
      lead?.contact_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || demo.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreateDemo = async () => {
    if (!user?.id || !newDemo.lead_id) return;

    const isAllChecked = newDemo.demo_notes.length > 0;

    await createDemo.mutateAsync({
      partner_id: user.id,
      lead_id: newDemo.lead_id,
      scheduled_at: newDemo.scheduled_at || null,
      completed_at: null,
      crm_note_checked: isAllChecked,
      trial_opened: isAllChecked,
      follow_up_email_sent: isAllChecked,
      status: isAllChecked ? 'approved' : 'pending',
      audited_by: null,
      audited_at: null,
      audit_notes: null,
      demo_notes: newDemo.demo_notes || null,
    });

    setShowNewDemoDialog(false);
    setNewDemo({ lead_id: '', demo_notes: '', scheduled_at: '' });
  };

  const handleCheckboxChange = async (demoId: string, field: 'crm_note_checked' | 'trial_opened' | 'follow_up_email_sent', currentValue: boolean, demo: DemoRecord) => {
    const newValue = !currentValue;
    const updates: Partial<DemoRecord> = { [field]: newValue };

    if (field === 'follow_up_email_sent') {
      updates.follow_up_email_sent = newValue;
    }

    const updatedDemo = { ...demo, ...updates };
    const allChecked = updatedDemo.crm_note_checked && updatedDemo.trial_opened && updatedDemo.follow_up_email_sent;
    updates.is_verified = allChecked;

    if (allChecked && demo.status === 'pending') {
      updates.status = 'approved';
    }

    await updateDemo.mutateAsync({ id: demoId, ...updates });
  };

  const handleLogDemo = async (demoId: string) => {
    const demo = demos?.find(d => d.id === demoId);
    if (!demo) return;

    await updateDemo.mutateAsync({
      id: demoId,
      demo_notes: demo.demo_notes,
      completed_at: new Date().toISOString(),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-serif">Demos</h1>
          <p className="text-muted-foreground mt-1">
            Log and track your demo sessions
          </p>
        </div>
        <Dialog open={showNewDemoDialog} onOpenChange={setShowNewDemoDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log New Demo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Log New Demo</DialogTitle>
              <DialogDescription>
                Select a lead and log the demo session details. All 3 checkboxes must be checked to auto-verify.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="lead">Lead *</Label>
                <Select value={newDemo.lead_id} onValueChange={(v) => setNewDemo({ ...newDemo, lead_id: v })}>
                  <SelectTrigger id="lead">
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads?.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {getCountryFlag(lead.country)} {lead.clinic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Scheduled Date (Optional)</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={newDemo.scheduled_at}
                  onChange={(e) => setNewDemo({ ...newDemo, scheduled_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="demo_notes">Demo Notes</Label>
                <Textarea
                  id="demo_notes"
                  value={newDemo.demo_notes}
                  onChange={(e) => setNewDemo({ ...newDemo, demo_notes: e.target.value })}
                  placeholder="Key points discussed, objections raised, next steps..."
                />
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <p className="text-sm font-medium">Verification Checklist</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={newDemo.demo_notes.length > 0}
                      onCheckedChange={() => {}}
                    />
                    <span>CRM note added</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox checked={newDemo.demo_notes.length > 0} onCheckedChange={() => {}} />
                    <span>Trial account opened</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Checkbox checked={newDemo.demo_notes.length > 0} onCheckedChange={() => {}} />
                    <span>Follow-up email sent</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Demo will be auto-verified once all checkboxes are complete
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDemoDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDemo} disabled={!newDemo.lead_id}>
                Log Demo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CardDescription>Demo target progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">{monthlyDemos.length}</span>
              <span className="text-muted-foreground">/ {demoTarget}</span>
            </div>
            <Progress value={progressPercent} className="mt-3" />
            <p className="text-xs text-muted-foreground mt-1">
              {demoTarget - monthlyDemos.length} demos to reach target
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CardDescription>Demos verified this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {monthlyDemos.filter(d => d.is_verified).length}
              </span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CardDescription>Awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {monthlyDemos.filter(d => d.status === 'pending').length}
              </span>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>All Demos</CardTitle>
              <CardDescription>
                {filteredDemos.length} demo{filteredDemos.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search demos..."
                  className="pl-9 w-[200px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clinic</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDemos.map((demo) => {
                const lead = leads?.find(l => l.id === demo.lead_id);
                const status = statusConfig[demo.status] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <TableRow key={demo.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{lead?.clinic_name || 'Unknown'}</p>
                        {lead?.contact_name && (
                          <p className="text-sm text-muted-foreground">{lead.contact_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead && (
                        <div className="flex items-center gap-1">
                          <span>{getCountryFlag(lead.country)}</span>
                          <span>{getCountryName(lead.country)}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{formatDate(demo.scheduled_at || demo.created_at)}</p>
                        {demo.completed_at && (
                          <p className="text-xs text-muted-foreground">
                            Completed: {formatDate(demo.completed_at)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Checkbox
                          checked={demo.crm_note_checked}
                          onCheckedChange={() => handleCheckboxChange(demo.id, 'crm_note_checked', demo.crm_note_checked, demo)}
                        />
                        <Checkbox
                          checked={demo.trial_opened}
                          onCheckedChange={() => handleCheckboxChange(demo.id, 'trial_opened', demo.trial_opened, demo)}
                        />
                        <Checkbox
                          checked={demo.follow_up_email_sent}
                          onCheckedChange={() => handleCheckboxChange(demo.id, 'follow_up_email_sent', demo.follow_up_email_sent, demo)}
                        />
                        {demo.is_verified ? (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500 ml-1" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.color} border`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLogDemo(demo.id)}
                      >
                        View
                      </Button>
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