'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/lib/company-context';
import { usePartners } from '@/hooks/use-queries';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2, ArrowUpRight, ArrowDownRight, Users, User } from 'lucide-react';
import type { TransactionType, TransactionDirection, Lead } from '@/types';

interface TransactionDialogProps {
  onSuccess?: () => void;
}

export function TransactionDialog({ onSuccess }: TransactionDialogProps) {
  const { selectedCompany } = useCompany();
  const { data: partners } = usePartners();
  const supabase = createClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Lead[]>([]);
  
  // Toggle states
  const [transactionParty, setTransactionParty] = useState<'partner' | 'customer'>('partner');
  const [direction, setDirection] = useState<'income' | 'expense'>('income');
  
  // Form state
  const [formData, setFormData] = useState({
    partner_id: '',
    customer_id: '',
    type: 'commission' as TransactionType,
    amount: '',
    currency: 'USD',
    description: '',
    reference: '',
  });

  // Fetch customers (leads) for dropdown
  useEffect(() => {
    async function fetchCustomers() {
      const { data } = await supabase
        .from('leads')
        .select('id, clinic_name, contact_name, country')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (data) {
        setCustomers(data as Lead[]);
      }
    }
    
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen, supabase]);

  // Update type when party or direction changes
  useEffect(() => {
    if (transactionParty === 'customer') {
      setFormData(prev => ({ ...prev, type: 'customer_payment' }));
    } else if (direction === 'expense') {
      setFormData(prev => ({ ...prev, type: 'commission' }));
    } else {
      setFormData(prev => ({ ...prev, type: 'commission' }));
    }
  }, [transactionParty, direction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const recorded_by = userData.user?.id;

      const { error } = await supabase.from('transactions').insert({
        company_id: selectedCompany?.id || null,
        partner_id: transactionParty === 'partner' ? formData.partner_id || null : null,
        type: formData.type,
        direction,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description || null,
        reference: formData.reference || null,
        recorded_by,
        metadata: transactionParty === 'customer' ? { customer_id: formData.customer_id } : {},
      });

      if (error) throw error;

      // Reset form
      setFormData({
        partner_id: '',
        customer_id: '',
        type: 'commission',
        amount: '',
        currency: 'USD',
        description: '',
        reference: '',
      });
      setTransactionParty('partner');
      setDirection('income');
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePartyChange = (party: 'partner' | 'customer') => {
    setTransactionParty(party);
    if (party === 'customer') {
      setFormData(prev => ({ ...prev, partner_id: '' }));
    } else {
      setFormData(prev => ({ ...prev, customer_id: '' }));
    }
  };

  const handleDirectionChange = (dir: 'income' | 'expense') => {
    setDirection(dir);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Record a payment or money movement in the system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Party Toggle - Partner vs Customer */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transaction Party</Label>
            <div className="flex bg-[#F5F7FA] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handlePartyChange('partner')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  transactionParty === 'partner'
                    ? 'bg-white text-[#003087] shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Partner
              </button>
              <button
                type="button"
                onClick={() => handlePartyChange('customer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  transactionParty === 'customer'
                    ? 'bg-white text-[#003087] shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="h-4 w-4" />
                Customer
              </button>
            </div>
          </div>

          {/* Direction Toggle - Income vs Expense */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Direction</Label>
            <div className="flex bg-[#F5F7FA] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => handleDirectionChange('income')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  direction === 'income'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Income
              </button>
              <button
                type="button"
                onClick={() => handleDirectionChange('expense')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                  direction === 'expense'
                    ? 'bg-white text-red-600 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowDownRight className="h-4 w-4" />
                Expense
              </button>
            </div>
          </div>

          {/* Dynamic Dropdown based on Party */}
          {transactionParty === 'partner' ? (
            <div className="space-y-2">
              <Label htmlFor="partner" className="text-sm font-medium">Select Partner</Label>
              <Select
                value={formData.partner_id}
                onValueChange={(value) => setFormData({ ...formData, partner_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a partner..." />
                </SelectTrigger>
                <SelectContent>
                  {partners?.map(partner => (
                    <SelectItem key={partner.id} value={partner.id}>
                      {partner.name} ({partner.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="customer" className="text-sm font-medium">Select Customer</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.clinic_name} ({customer.contact_name || 'No contact'}) - {customer.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Type Dropdown - only for Partner */}
          {transactionParty === 'partner' && (
            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">Transaction Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: TransactionType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commission">Commission</SelectItem>
                  <SelectItem value="demo_bonus">Demo Bonus</SelectItem>
                  <SelectItem value="setup_fee">Setup Fee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Customer Payment info */}
          {transactionParty === 'customer' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Transaction type is automatically set to <strong>Customer Payment</strong>
            </div>
          )}

          {/* Amount & Currency */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="flex-1"
                required
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="PHP">PHP</SelectItem>
                  <SelectItem value="VND">VND</SelectItem>
                  <SelectItem value="THB">THB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Input
              id="description"
              placeholder="Payment for client X..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference" className="text-sm font-medium">Reference</Label>
            <Input
              id="reference"
              placeholder="Invoice #, Transaction ID..."
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || (!formData.partner_id && transactionParty === 'partner') || (!formData.customer_id && transactionParty === 'customer')}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Transaction'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}