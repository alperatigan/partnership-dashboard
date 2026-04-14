'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePendingDemoAudit, useApproveDemo, useUpdateDemoRecord, useDemoRecords } from '@/hooks/use-crm-queries';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, CheckCircle, XCircle, Clock, AlertCircle, Search, Eye, FileText } from 'lucide-react';
import { formatDate, getCountryFlag, getCountryName } from '@/lib/utils';
import type { DemoRecord } from '@/types';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-[#FFC439]/20 text-[#B8860B] border-[#FFC439]/30', icon: Clock },
  approved: { label: 'Approved', color: 'bg-[#00A303]/10 text-[#00A303] border-[#00A303]/20', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-[#E61E00]/10 text-[#E61E00] border-[#E61E00]/20', icon: XCircle },
};

export default function AdminDemosPage() {
  const { user } = useAuth();
  const { data: pendingDemos, isLoading: pendingLoading } = usePendingDemoAudit();
  const { data: allDemos } = useDemoRecords();
  const approveDemo = useApproveDemo();
  const updateDemo = useUpdateDemoRecord();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedDemo, setSelectedDemo] = useState<DemoRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [auditNotes, setAuditNotes] = useState('');

  const handleApprove = async () => {
    if (!selectedDemo || !user) return;
    
    await approveDemo.mutateAsync({
      id: selectedDemo.id,
      auditedBy: user.id,
      auditNotes,
    });
    
    setShowDetailDialog(false);
    setSelectedDemo(null);
    setAuditNotes('');
  };

  const handleReject = async () => {
    if (!selectedDemo) return;
    
    await updateDemo.mutateAsync({
      id: selectedDemo.id,
      status: 'rejected',
      audit_notes: auditNotes,
    });
    
    setShowRejectDialog(false);
    setShowDetailDialog(false);
    setSelectedDemo(null);
    setAuditNotes('');
  };

  const openDetail = (demo: DemoRecord) => {
    setSelectedDemo(demo);
    setAuditNotes('');
    setShowDetailDialog(true);
  };

  const openReject = (demo: DemoRecord) => {
    setSelectedDemo(demo);
    setAuditNotes('');
    setShowRejectDialog(true);
  };

  const filteredDemos = allDemos?.filter(demo => {
    const matchesSearch = search === '' || 
      demo.lead_id?.toLowerCase().includes(search.toLowerCase()) ||
      demo.partner_id?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || demo.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const pendingCount = pendingDemos?.length || 0;

  if (pendingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-[#003087] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Demo Audit</h1>
        <p className="text-muted-foreground mt-1">
          Review and verify partner demo submissions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
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
                <p className="text-sm font-medium text-muted-foreground">Approved Today</p>
                <p className="text-3xl font-bold text-foreground">
                  {allDemos?.filter(d => d.status === 'approved' && d.audited_at && new Date(d.audited_at).toDateString() === new Date().toDateString()).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Demos verified</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#00A303]/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-[#00A303]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Rejected Today</p>
                <p className="text-3xl font-bold text-foreground">
                  {allDemos?.filter(d => d.status === 'rejected' && d.audited_at && new Date(d.audited_at).toDateString() === new Date().toDateString()).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Demos rejected</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#E61E00]/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-[#E61E00]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Demos</p>
                <p className="text-3xl font-bold text-foreground">{allDemos?.length || 0}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#009CDE]/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#009CDE]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Demo Records</CardTitle>
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
              <select
                className="px-3 py-2 border border-border rounded-md text-sm bg-background"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
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
              <TableRow className="bg-[#F5F7FA]">
                <TableHead className="font-semibold">Partner ID</TableHead>
                <TableHead className="font-semibold">Lead ID</TableHead>
                <TableHead className="font-semibold">Scheduled</TableHead>
                <TableHead className="font-semibold">Verification</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Audit Notes</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDemos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No demos found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDemos.map((demo) => {
                  const status = statusConfig[demo.status] || statusConfig.pending;
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={demo.id} className="border-b border-border last:border-0">
                      <TableCell className="font-mono text-sm text-foreground">
                        {demo.partner_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-mono text-sm text-foreground">
                        {demo.lead_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {demo.scheduled_at ? formatDate(demo.scheduled_at) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Checkbox checked={demo.crm_note_checked} disabled />
                          <Checkbox checked={demo.trial_opened} disabled />
                          <Checkbox checked={demo.follow_up_email_sent} disabled />
                          {demo.is_verified ? (
                            <CheckCircle className="h-4 w-4 text-[#00A303] ml-1" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-[#B8860B] ml-1" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${status.color} border font-medium`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm text-muted-foreground">
                        {demo.audit_notes || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetail(demo)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {demo.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openReject(demo)}
                              className="text-[#E61E00] hover:text-[#E61E00]"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Demo Details</DialogTitle>
            <DialogDescription>
              Review demo verification and approve
            </DialogDescription>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Scheduled</Label>
                  <p className="text-sm">
                    {selectedDemo.scheduled_at ? formatDate(selectedDemo.scheduled_at) : 'Not scheduled'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Completed</Label>
                  <p className="text-sm">
                    {selectedDemo.completed_at ? formatDate(selectedDemo.completed_at) : 'Not completed'}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground mb-2 block">Verification Checkboxes</Label>
                <div className="flex flex-col gap-2 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedDemo.crm_note_checked} disabled />
                    <span className="text-sm">CRM note added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedDemo.trial_opened} disabled />
                    <span className="text-sm">Trial account opened</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedDemo.follow_up_email_sent} disabled />
                    <span className="text-sm">Follow-up email sent</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  {selectedDemo.is_verified ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Verified
                    </Badge>
                  )}
                </div>
              </div>

              {selectedDemo.demo_notes && (
                <div>
                  <Label className="text-muted-foreground">Demo Notes</Label>
                  <p className="text-sm p-2 bg-muted rounded mt-1">{selectedDemo.demo_notes}</p>
                </div>
              )}

              <div>
                <Label htmlFor="auditNotes">Audit Notes (Optional)</Label>
                <Textarea
                  id="auditNotes"
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="Add any notes about this demo..."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="font-semibold border-2" onClick={() => setShowDetailDialog(false)}>
              Cancel
            </Button>
            {selectedDemo?.status === 'pending' && (
              <Button variant="outline" className="font-semibold border-2 border-[#E61E00] text-[#E61E00] hover:bg-[#E61E00]/10" onClick={() => {
                setShowDetailDialog(false);
                openReject(selectedDemo);
              }}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
            {selectedDemo?.status === 'pending' && (
              <Button className="font-semibold bg-[#00A303] hover:bg-[#00A303]/90" onClick={handleApprove}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve Demo
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Demo</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this demo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectNotes">Reason for Rejection</Label>
            <Textarea
              id="rejectNotes"
              value={auditNotes}
              onChange={(e) => setAuditNotes(e.target.value)}
              placeholder="Explain why this demo is being rejected..."
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="font-semibold border-2" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button className="font-semibold bg-[#E61E00] hover:bg-[#E61E00]/90" onClick={handleReject}>
              <XCircle className="h-4 w-4 mr-1" />
              Reject Demo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
