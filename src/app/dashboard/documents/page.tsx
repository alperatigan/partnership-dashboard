'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePartnerChecklist, useUpdatePartnerChecklist } from '@/hooks/use-crm-queries';
import type { PartnerChecklist } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, CheckCircle, Clock, ExternalLink, BookOpen, Video, FileImage } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const materials = [
  {
    id: 'partner-guide',
    name: 'Partner Guide',
    description: 'Complete guide to being a successful ClinixGlow partner',
    type: 'pdf',
    icon: BookOpen,
    url: '/documents/partner-guide.pdf',
  },
  {
    id: 'demo-script',
    name: 'Demo Script',
    description: 'Step-by-step demo presentation script',
    type: 'pdf',
    icon: FileText,
    url: '/documents/demo-script.pdf',
  },
  {
    id: 'product-overview',
    name: 'Product Overview Video',
    description: 'Video walkthrough of ClinixGlow features',
    type: 'video',
    icon: Video,
    url: '/documents/product-overview.mp4',
  },
  {
    id: 'sales-deck',
    name: 'Sales Deck',
    description: 'Professional sales presentation slides',
    type: 'presentation',
    icon: FileImage,
    url: '/documents/sales-deck.pdf',
  },
];

const checklistItems = [
  {
    id: 'contract_signed',
    label: 'Sign Partnership Agreement',
    description: 'Review and sign the official partnership contract',
  },
  {
    id: 'profile_completed',
    label: 'Complete Partner Profile',
    description: 'Fill in your bio, photo, and social links',
  },
  {
    id: 'tax_form_submitted',
    label: 'Submit Tax Form',
    description: 'W-9 or W-8BEN form for tax purposes',
  },
  {
    id: 'payment_method_selected',
    label: 'Select Payment Method',
    description: 'Choose Wise, Payoneer, GCash, or Bank Transfer',
  },
  {
    id: 'orientation_completed',
    label: 'Complete Orientation',
    description: 'Watch the partner onboarding video series',
  },
];

export default function DocumentsPage() {
  const { user } = useAuth();
  const partnerId = user?.id || '';

  const { data: checklist, isLoading } = usePartnerChecklist(partnerId);
  const updateChecklist = useUpdatePartnerChecklist();

  const [contractUrl] = useState('https://drive.google.com/file/d/1your-contract-id/view');

  const handleChecklistToggle = async (itemId: string, currentValue: boolean) => {
    const updateField = itemId as keyof typeof checklist;
    const newValue = !currentValue;

    await updateChecklist.mutateAsync({
      partnerId,
      [updateField]: newValue,
      [`${updateField}_at`]: newValue ? new Date().toISOString() : null,
    });
  };

  const completedCount = checklistItems.filter(item => (checklist as PartnerChecklist)?.[item.id as keyof PartnerChecklist]).length;
  const progressPercent = (completedCount / checklistItems.length) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif">Documents</h1>
        <p className="text-muted-foreground mt-1">
          Access contracts, checklists, and marketing materials
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Onboarding Checklist</CardTitle>
          <CardDescription>
            Complete these steps to become an active partner
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedCount} of {checklistItems.length} completed
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {checklistItems.map((item, index) => {
              const isComplete = checklist?.[item.id as keyof typeof checklist];
              const Icon = isComplete ? CheckCircle : Clock;

              return (
                <div key={item.id}>
                  <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={!!isComplete}
                      onCheckedChange={() => handleChecklistToggle(item.id, !!isComplete)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${isComplete ? 'line-through text-muted-foreground' : ''}`}>
                          {item.label}
                        </p>
                        {isComplete && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      {checklist?.[`${item.id}_at` as keyof typeof checklist] && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Completed on {formatDate(checklist[`${item.id}_at` as keyof typeof checklist] as string)}
                        </p>
                      )}
                    </div>
                    <Icon className={`h-5 w-5 ${isComplete ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  {index < checklistItems.length - 1 && <Separator className="my-4" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partnership Agreement</CardTitle>
          <CardDescription>
            Review and sign your official partnership contract
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 p-6 border-2 border-dashed rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Partnership Agreement</p>
                  <p className="text-sm text-muted-foreground">PDF Document</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                This is the official partnership agreement between you and ClinixGlow. 
                Please review carefully and sign to activate your partner account.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <a href={contractUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Document
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={contractUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              </div>
            </div>

            <div className="w-full md:w-64 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium mb-2">Document Status</p>
              {checklist?.contract_signed ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm">Signed</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm">Pending Signature</span>
                </div>
              )}
              {checklist?.contract_signed_at && (
                <p className="text-xs text-muted-foreground mt-2">
                  Signed on {formatDate(checklist.contract_signed_at)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Materials</CardTitle>
          <CardDescription>
            Download resources to help you promote ClinixGlow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {materials.map((material) => {
              const Icon = material.icon;

              return (
                <div
                  key={material.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{material.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {material.description}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="text-xs">
                          {material.type.toUpperCase()}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={material.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}