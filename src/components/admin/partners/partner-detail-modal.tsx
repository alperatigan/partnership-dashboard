'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  Download,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Briefcase,
  CreditCard,
  BarChart3,
  File,
  Eye,
  Save,
  X,
} from 'lucide-react';
import { formatCurrency, formatDate, getCountryFlag, getCountryName, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { usePartnerNotes, useCreatePartnerNote, useDeletePartnerNote } from '@/hooks/use-company-queries';
import { useCommissions, useUpdatePartner } from '@/hooks/use-queries';
import type { Partner, Lead, DemoRecord, Payment, PartnerNote } from '@/types';

interface PartnerDetailModalProps {
  partner: Partner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'view' | 'edit';
}

const statusConfig = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
  approved: { label: 'Active', icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'text-red-600 bg-red-50' },
  suspended: { label: 'Suspended', icon: AlertCircle, color: 'text-red-600 bg-red-50' },
};

const tierConfig = {
  silver: { label: 'Silver', color: 'bg-gray-100 text-gray-700 border-gray-200', commission: '20%' },
  gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', commission: '25%' },
  platinum: { label: 'Platinum', color: 'bg-purple-100 text-purple-700 border-purple-200', commission: '30%' },
};

const leadStatusConfig: Record<string, { label: string; color: string }> = {
  contacted: { label: 'Contacted', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  demo_scheduled: { label: 'Demo Scheduled', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  demo_done: { label: 'Demo Done', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  trial_active: { label: 'Trial Active', color: 'bg-green-50 text-green-700 border-green-200' },
  closed: { label: 'Closed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  expired: { label: 'Expired', color: 'bg-gray-50 text-gray-700 border-gray-200' },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Paid', color: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
};

const commissionStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved: { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  paid: { label: 'Paid', color: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
  clawback: { label: 'Clawback', color: 'bg-orange-50 text-orange-700 border-orange-200' },
};

export function PartnerDetailModal({ partner, open, onOpenChange, mode = 'view' }: PartnerDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<PartnerNote['note_type']>('general');
  const [editData, setEditData] = useState<{
    name?: string;
    email?: string;
    country?: string;
    tier?: string | null;
    status?: string;
    company_name?: string | null;
  }>({});

  const { data: notes, isLoading: notesLoading } = usePartnerNotes(partner?.id || '');
  const { data: commissions } = useCommissions(partner?.id ? { partnerId: partner.id } : undefined);
  const createNote = useCreatePartnerNote();
  const deleteNote = useDeletePartnerNote();
  const updatePartner = useUpdatePartner();

  const [leads] = useState<Lead[]>([]);
  const [demos] = useState<DemoRecord[]>([]);
  const [payments] = useState<Payment[]>([]);

  const handleDeleteNote = async (noteId: string) => {
    if (!partner) return;
    try {
      await deleteNote.mutateAsync({ id: noteId, partnerId: partner.id });
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !partner) return;
    try {
      await createNote.mutateAsync({
        partner_id: partner.id,
        content: newNote.trim(),
        note_type: noteType,
        admin_id: null,
      });
      setNewNote('');
      setNoteType('general');
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!partner) return;
    try {
      await updatePartner.mutateAsync({ id: partner.id, ...editData } as any);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update partner:', error);
    }
  };

  const handleCancelEdit = () => {
    if (partner) {
      setEditData({
        name: partner.name,
        email: partner.email,
        company_name: partner.company_name,
        country: partner.country,
        tier: partner.tier,
        status: partner.status,
      });
    }
    onOpenChange(false);
  };

  useEffect(() => {
    if (partner) {
      setEditData({
        name: partner.name,
        email: partner.email,
        company_name: partner.company_name,
        country: partner.country,
        tier: partner.tier,
        status: partner.status,
      });
    }
  }, [partner]);

  if (!partner) return null;

  const status = statusConfig[partner.status];
  const tier = partner.tier ? tierConfig[partner.tier] : null;
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 bg-gradient-to-br from-sky-500 to-sky-600">
              <AvatarFallback className="bg-transparent text-white text-xl font-semibold">
                {getInitials(partner.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-serif font-semibold">{partner.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{partner.email}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{getCountryFlag(partner.country)}</span>
                <span className="text-muted-foreground">{getCountryName(partner.country)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Badge className={cn(status.color, 'border')}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
              {tier && (
                <Badge className={cn(tier.color, 'border')}>
                  <Award className="h-3 w-3 mr-1" />
                  {tier.label} ({tier.commission})
                </Badge>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Joined {formatDate(partner.created_at)}
            </span>
            {mode === 'edit' && (
              <div className="flex items-center gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdit} disabled={updatePartner.isPending}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="w-full justify-start rounded-none border-b px-6 h-12 bg-transparent">
            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent">
              <User className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-transparent">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </TabsTrigger>
            <TabsTrigger value="demos" className="data-[state=active]:bg-transparent">
              <Briefcase className="h-4 w-4 mr-2" />
              Demos
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-transparent">
              <CreditCard className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-transparent">
              <DollarSign className="h-4 w-4 mr-2" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="kpi" className="data-[state=active]:bg-transparent">
              <BarChart3 className="h-4 w-4 mr-2" />
              KPI
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-transparent">
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-transparent">
              <File className="h-4 w-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Overview Tab */}
            <TabsContent value="overview" className="m-0 space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(partner.total_earned)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(partner.pending_payout)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(partner.paid_out)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.filter(l => l.status === 'trial_active').length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Partner Details */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Partner Information</CardTitle>
                    <CardDescription>Basic partner details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mode === 'edit' ? (
                      <>
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input 
                            value={editData.name || ''} 
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input 
                            value={editData.email || ''} 
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Company Name</Label>
                          <Input 
                            value={editData.company_name || ''} 
                            onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tier</Label>
                          <select 
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            value={editData.tier || ''}
                            onChange={(e) => setEditData({ ...editData, tier: e.target.value as any })}
                          >
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="platinum">Platinum</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select 
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                            value={editData.status || ''}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value as any })}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium">{partner.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Country</p>
                            <p className="font-medium">{getCountryName(partner.country)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Joined</p>
                            <p className="font-medium">{formatDate(partner.created_at)}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest actions by this partner</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                        <div>
                          <p className="font-medium">Account approved</p>
                          <p className="text-sm text-muted-foreground">{formatDate(partner.approved_at || partner.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                        <div>
                          <p className="font-medium">Profile completed</p>
                          <p className="text-sm text-muted-foreground">{formatDate(partner.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Leads Tab */}
            <TabsContent value="leads" className="m-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Leads</CardTitle>
                    <CardDescription>Partner&apos;s lead management</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </CardHeader>
                <CardContent>
                  {leads.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No leads yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Clinic</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Registered</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leads.map((lead) => (
                          <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.clinic_name}</TableCell>
                            <TableCell>
                              <div>
                                <p>{lead.contact_name}</p>
                                <p className="text-sm text-muted-foreground">{lead.contact_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(leadStatusConfig[lead.status]?.color, 'border')}>
                                {leadStatusConfig[lead.status]?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(lead.registered_at || lead.created_at)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Demos Tab */}
            <TabsContent value="demos" className="m-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Demos</CardTitle>
                    <CardDescription>Partner&apos;s demo history</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Demo
                  </Button>
                </CardHeader>
                <CardContent>
                  {demos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No demos yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Lead</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {demos.map((demo) => (
                          <TableRow key={demo.id}>
                            <TableCell className="font-medium">{demo.lead_id}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {demo.scheduled_at ? formatDate(demo.scheduled_at) : '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {demo.completed_at ? formatDate(demo.completed_at) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(
                                demo.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                demo.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-yellow-50 text-yellow-700 border-yellow-200',
                                'border'
                              )}>
                                {demo.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="m-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Payments</CardTitle>
                    <CardDescription>Payment history</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No payments yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Amount</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Scheduled</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell className="capitalize">{payment.type}</TableCell>
                            <TableCell>
                              <Badge className={cn(paymentStatusConfig[payment.status]?.color, 'border')}>
                                {paymentStatusConfig[payment.status]?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {payment.scheduled_at ? formatDate(payment.scheduled_at) : '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {payment.paid_at ? formatDate(payment.paid_at) : '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commissions Tab */}
            <TabsContent value="commissions" className="m-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Commissions</CardTitle>
                    <CardDescription>Commission earnings</CardDescription>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent>
                  {commissions && commissions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Deal Value</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Paid</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {commissions.map((commission) => (
                          <TableRow key={commission.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{commission.client_name || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">{commission.client_email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(commission.amount)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {commission.deal_value ? formatCurrency(commission.deal_value) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(commissionStatusConfig[commission.status]?.color, 'border')}>
                                {commissionStatusConfig[commission.status]?.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(commission.created_at)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {commission.paid_at ? formatDate(commission.paid_at) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No commissions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* KPI Tab */}
            <TabsContent value="kpi" className="m-0">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Performance</CardTitle>
                    <CardDescription>Current month metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">New Leads</span>
                      </div>
                      <span className="text-2xl font-bold">0</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Demo Scheduled</span>
                      </div>
                      <span className="text-2xl font-bold">0</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Demo Completed</span>
                      </div>
                      <span className="text-2xl font-bold">0</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Trial Started</span>
                      </div>
                      <span className="text-2xl font-bold">0</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">Closed Deals</span>
                      </div>
                      <span className="text-2xl font-bold">0</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Quotas</CardTitle>
                    <CardDescription>Monthly targets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Lead Quota</span>
                        <span className="text-sm text-muted-foreground">0 / 10</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: '0%' }} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Demo Quota</span>
                        <span className="text-sm text-muted-foreground">0 / 5</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: '0%' }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="m-0">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Notes</CardTitle>
                  <CardDescription>Internal notes about this partner</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add Note Form */}
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-2">
                      <Label>Note Type</Label>
                      <select
                        className="w-full px-3 py-2 border rounded-lg bg-background"
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value as PartnerNote['note_type'])}
                      >
                        <option value="general">General</option>
                        <option value="warning">Warning</option>
                        <option value="kpi">KPI</option>
                        <option value="payment">Payment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Add a note</Label>
                      <Textarea
                        placeholder="Write a note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleAddNote} disabled={!newNote.trim() || createNote.isPending}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-4">
                    {notesLoading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
                    ) : notes && notes.length > 0 ? (
                      notes.map((note) => (
                        <div
                          key={note.id}
                          className={cn(
                            'p-4 rounded-lg border',
                            note.note_type === 'warning' ? 'bg-red-50 border-red-200' :
                            note.note_type === 'kpi' ? 'bg-blue-50 border-blue-200' :
                            note.note_type === 'payment' ? 'bg-green-50 border-green-200' :
                            'bg-muted/50'
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {note.note_type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {note.admin_name || 'Admin'}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(note.created_at)}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteNote(note.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="mt-2 text-sm">{note.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No notes yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="m-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Partner documents and files</CardDescription>
                  </div>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documents uploaded</p>
                    <p className="text-sm mt-1">Upload contracts, agreements, or other files</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
