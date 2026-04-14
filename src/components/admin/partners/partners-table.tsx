'use client';

import { useState } from 'react';
import { usePartners } from '@/hooks/use-queries';
import { useCompany } from '@/lib/company-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  UserX,
  Mail,
  Download,
  ArrowUpDown,
} from 'lucide-react';
import { formatCurrency, formatDate, getCountryFlag, getCountryName } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Partner } from '@/types';

interface PartnersTableProps {
  onPartnerClick: (partner: Partner) => void;
  onEditPartner: (partner: Partner) => void;
  onBulkAction?: (action: string, selectedIds: string[]) => void;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  approved: { label: 'Active', color: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
  suspended: { label: 'Suspended', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

const tierConfig = {
  silver: { label: 'Silver', color: 'bg-gray-100 text-gray-700' },
  gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-700' },
  platinum: { label: 'Platinum', color: 'bg-purple-100 text-purple-700' },
};

export function PartnersTable({ onPartnerClick, onEditPartner, onBulkAction }: PartnersTableProps) {
  const { selectedCompany, isAllCompanies } = useCompany();
  const { data: partners, isLoading } = usePartners();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof Partner>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter partners by company
  const filteredPartners = partners?.filter(partner => {
    if (!isAllCompanies && selectedCompany?.id) {
      return partner.company_id === selectedCompany.id;
    }
    return true;
  }).filter(partner => {
    const matchesSearch = 
      partner.name.toLowerCase().includes(search.toLowerCase()) ||
      partner.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || partner.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) || [];

  const handleSort = (field: keyof Partner) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPartners(filteredPartners.map(p => p.id));
    } else {
      setSelectedPartners([]);
    }
  };

  const handleSelectPartner = (partnerId: string, checked: boolean) => {
    if (checked) {
      setSelectedPartners([...selectedPartners, partnerId]);
    } else {
      setSelectedPartners(selectedPartners.filter(id => id !== partnerId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Partners</CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredPartners.length} partners
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search partners..."
                  className="pl-9 w-[200px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                className="px-3 py-2 border rounded-lg text-sm bg-background"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Active</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>

              {/* Export Button */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const csv = [
                    ['Name', 'Email', 'Country', 'Status', 'Tier', 'Revenue', 'Joined'].join(','),
                    ...filteredPartners.map(p => [
                      p.name,
                      p.email,
                      p.country,
                      p.status,
                      p.tier || '',
                      p.total_earned || 0,
                      p.created_at
                    ].join(','))
                  ].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `partners-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedPartners.length === filteredPartners.length && filteredPartners.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Partner
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80 text-right"
                    onClick={() => handleSort('total_earned')}
                  >
                    <div className="flex items-center gap-1 justify-end">
                      Revenue
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Joined
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                      No partners found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner, index) => (
                    <TableRow 
                      key={partner.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedPartners.includes(partner.id)}
                          onCheckedChange={(checked) => handleSelectPartner(partner.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell onClick={() => onPartnerClick(partner)}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-medium">
                            {partner.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{partner.name}</p>
                            <p className="text-sm text-muted-foreground">{partner.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{getCountryFlag(partner.country)}</span>
                          <span className="text-sm">{getCountryName(partner.country)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {partner.company_name || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => onPartnerClick(partner)}>
                        <Badge className={cn(statusConfig[partner.status]?.color, 'border')}>
                          {statusConfig[partner.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell onClick={() => onPartnerClick(partner)}>
                        {partner.tier ? (
                          <Badge className={cn(tierConfig[partner.tier]?.color)}>
                            {tierConfig[partner.tier]?.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium" onClick={() => onPartnerClick(partner)}>
                        {formatCurrency(partner.total_earned)}
                      </TableCell>
                      <TableCell className="text-muted-foreground" onClick={() => onPartnerClick(partner)}>
                        {formatDate(partner.created_at)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onPartnerClick(partner)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditPartner(partner)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Partner
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
