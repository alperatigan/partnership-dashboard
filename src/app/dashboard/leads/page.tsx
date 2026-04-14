'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLeads, useCreateLead, useUpdateLead } from '@/hooks/use-crm-queries';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Search, Clock, AlertTriangle, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { formatDate, getCountryName, getCountryFlag } from '@/lib/utils';
import type { Lead, Country, LeadStatus } from '@/types';

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  contacted: { label: 'Contacted', color: 'bg-[#003087]/10 text-[#003087] border-[#003087]/20', icon: Clock },
  demo_scheduled: { label: 'Demo Scheduled', color: 'bg-[#FFC439]/20 text-[#B8860B] border-[#FFC439]/30', icon: Clock },
  demo_done: { label: 'Demo Done', color: 'bg-[#FF8C00]/10 text-[#FF8C00] border-[#FF8C00]/20', icon: CheckCircle },
  trial_active: { label: 'Trial Active', color: 'bg-[#00A303]/10 text-[#00A303] border-[#00A303]/20', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-[#003087]/10 text-[#003087] border-[#003087]/20', icon: CheckCircle },
  expired: { label: 'Expired', color: 'bg-[#E61E00]/10 text-[#E61E00] border-[#E61E00]/20', icon: XCircle },
};

export default function LeadsPage() {
  const { user } = useAuth();
  const partnerId = user?.id || '';
  
  const { data: leads, isLoading } = useLeads({ partnerId });
  const createLead = useCreateLead();
  const updateLead = useUpdateLead();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewLeadDialog, setShowNewLeadDialog] = useState(false);
  const [now] = useState(() => Date.now());
  
  const [newLead, setNewLead] = useState({
    clinic_name: '',
    country: 'PH' as Country,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    contact_role: '',
    notes: '',
  });

  const filteredLeads = leads?.filter((lead) => {
    const matchesSearch = 
      lead.clinic_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      lead.contact_email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const handleCreateLead = async () => {
    if (!user?.id) return;
    
    await createLead.mutateAsync({
      ...newLead,
      partner_id: user.id,
      status: 'contacted',
    });
    
    setShowNewLeadDialog(false);
    setNewLead({
      clinic_name: '',
      country: 'PH',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      contact_role: '',
      notes: '',
    });
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    await updateLead.mutateAsync({
      id: leadId,
      status: newStatus as LeadStatus,
    });
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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead & CRM</h1>
          <p className="text-muted-foreground mt-1">
            Manage your leads and track their progress
          </p>
        </div>
        <Dialog open={showNewLeadDialog} onOpenChange={setShowNewLeadDialog}>
          <DialogTrigger asChild>
            <Button className="font-semibold">
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>
                Enter the clinic information. Remember: first registered wins!
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clinic_name" className="text-sm font-medium text-foreground">Clinic Name *</Label>
                <Input
                  id="clinic_name"
                  value={newLead.clinic_name}
                  onChange={(e) => setNewLead({ ...newLead, clinic_name: e.target.value })}
                  placeholder="Enter clinic name"
                  className="h-11"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-medium text-foreground">Country *</Label>
                  <Select value={newLead.country} onValueChange={(v) => setNewLead({ ...newLead, country: v as Country })}>
                    <SelectTrigger id="country" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PH">Philippines</SelectItem>
                      <SelectItem value="VN">Vietnam</SelectItem>
                      <SelectItem value="TH">Thailand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_role" className="text-sm font-medium text-foreground">Contact Role</Label>
                  <Input
                    id="contact_role"
                    value={newLead.contact_role}
                    onChange={(e) => setNewLead({ ...newLead, contact_role: e.target.value })}
                    placeholder="e.g. Owner, Manager"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name" className="text-sm font-medium text-foreground">Contact Name</Label>
                  <Input
                    id="contact_name"
                    value={newLead.contact_name}
                    onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                    placeholder="Contact person name"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="text-sm font-medium text-foreground">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newLead.contact_email}
                    onChange={(e) => setNewLead({ ...newLead, contact_email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="text-sm font-medium text-foreground">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={newLead.contact_phone}
                  onChange={(e) => setNewLead({ ...newLead, contact_phone: e.target.value })}
                  placeholder="+63 xxx xxx xxxx"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-foreground">Notes</Label>
                <Textarea
                  id="notes"
                  value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                  placeholder="Additional notes about this lead..."
                  className="min-h-[80px] rounded-lg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewLeadDialog(false)} className="border-2 font-medium">
                Cancel
              </Button>
              <Button onClick={handleCreateLead} disabled={!newLead.clinic_name} className="font-semibold">
                Add Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">All Leads</CardTitle>
              <CardDescription>
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  className="pl-9 w-[200px] h-10 rounded-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] h-10 rounded-lg">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                  <SelectItem value="demo_done">Demo Done</SelectItem>
                  <SelectItem value="trial_active">Trial Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F5F7FA]">
                <TableHead className="font-semibold">Clinic</TableHead>
                <TableHead className="font-semibold">Country</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Expires</TableHead>
                <TableHead className="font-semibold">Added</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => {
                const status = statusConfig[lead.status] || statusConfig.contacted;
                const StatusIcon = status.icon;
                const isExpiringSoon = lead.expires_at && 
                  new Date(lead.expires_at).getTime() - now < 14 * 24 * 60 * 60 * 1000;
                
                return (
                  <TableRow key={lead.id} className="border-b border-border last:border-0">
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{lead.clinic_name}</p>
                        {lead.contact_name && (
                          <p className="text-sm text-muted-foreground">{lead.contact_name}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span>{getCountryFlag(lead.country)}</span>
                        <span>{getCountryName(lead.country)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${status.color} border font-medium`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isExpiringSoon ? (
                        <Badge variant="outline" className="text-[#FF8C00] border-[#FF8C00]/30 font-medium">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {lead.expires_at ? 
                            `${Math.ceil((new Date(lead.expires_at).getTime() - now) / (1000 * 60 * 60 * 24))}d` 
                            : '-'}
                        </Badge>
                      ) : lead.expires_at ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDate(lead.expires_at)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(lead.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'contacted')}>
                            Mark as Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'demo_scheduled')}>
                            Demo Scheduled
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'demo_done')}>
                            Demo Done
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'trial_active')}>
                            Trial Active
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(lead.id, 'closed')}>
                            Closed Won
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
