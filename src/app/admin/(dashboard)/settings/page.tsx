'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Save, Settings, TrendingUp, Users, Percent } from 'lucide-react';
import { useCountryPricing } from '@/hooks/use-queries';
import type { Country, Plan } from '@/types';

export default function AdminSettingsPage() {
  const { data: pricing } = useCountryPricing();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [pricingData, setPricingData] = useState({
    PH: {
      currency: 'PHP',
      fx_rate: 58.50,
      plans: {
        starter: { usd: 29, local: 1696.50 },
        professional: { usd: 79, local: 4621.50 },
        enterprise: { usd: 199, local: 11631.50 },
      },
    },
    VN: {
      currency: 'VND',
      fx_rate: 25400,
      plans: {
        starter: { usd: 29, local: 736600 },
        professional: { usd: 79, local: 2006600 },
        enterprise: { usd: 199, local: 5054600 },
      },
    },
    TH: {
      currency: 'THB',
      fx_rate: 35.20,
      plans: {
        starter: { usd: 29, local: 1020.80 },
        professional: { usd: 79, local: 2760.80 },
        enterprise: { usd: 199, local: 7004.80 },
      },
    },
  });

  const [commissionTiers, setCommissionTiers] = useState({
    silver: 20,
    gold: 25,
    platinum: 30,
    minGold: 5,
    minPlatinum: 15,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const flags: Record<string, string> = {
    PH: '🇵🇭',
    VN: '🇻🇳',
    TH: '🇹🇭',
  };

  const countryNames: Record<string, string> = {
    PH: 'Philippines',
    VN: 'Vietnam',
    TH: 'Thailand',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure system settings and parameters
        </p>
      </div>

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList className="bg-[#F5F7FA]">
          <TabsTrigger value="pricing" className="data-[state=active]:bg-[#003087] data-[state=active]:text-white">Pricing</TabsTrigger>
          <TabsTrigger value="commissions" className="data-[state=active]:bg-[#003087] data-[state=active]:text-white">Commission Tiers</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Country Pricing Configuration</CardTitle>
              <CardDescription>
                Set pricing for each market. FX rates are used to calculate local prices from USD.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(['PH', 'VN', 'TH'] as Country[]).map((country) => (
                <div key={country} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{flags[country]}</span>
                    <h3 className="font-semibold text-lg text-foreground">{countryNames[country]}</h3>
                    <Badge className="bg-[#003087]/10 text-[#003087] border-[#003087]/20">{pricingData[country].currency}</Badge>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">FX Rate (to USD)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={pricingData[country].fx_rate}
                        onChange={(e) =>
                          setPricingData((prev) => ({
                            ...prev,
                            [country]: {
                              ...prev[country],
                              fx_rate: parseFloat(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {(['starter', 'professional', 'enterprise'] as Plan[]).map((plan) => (
                      <Card key={plan} className="border border-border p-4">
                        <h4 className="font-medium capitalize mb-3 text-foreground">{plan}</h4>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">USD Price</Label>
                            <Input
                              type="number"
                              value={pricingData[country].plans[plan].usd}
                              onChange={(e) =>
                                setPricingData((prev) => ({
                                  ...prev,
                                  [country]: {
                                    ...prev[country],
                                    plans: {
                                      ...prev[country].plans,
                                      [plan]: {
                                        ...prev[country].plans[plan],
                                        usd: parseFloat(e.target.value),
                                      },
                                    },
                                  },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Local Price</Label>
                            <Input
                              type="number"
                              value={pricingData[country].plans[plan].local}
                              disabled
                              className="bg-[#F5F7FA]"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  
                  {country !== 'TH' && <Separator />}
                </div>
              ))}

              <div className="flex items-center gap-4 pt-4">
                <Button onClick={handleSave} disabled={saving} className="font-semibold bg-[#00A303] hover:bg-[#00A303]/90">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Pricing'}
                </Button>
                {saved && (
                  <span className="text-sm text-[#00A303]">Settings saved!</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card className="border border-border">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Commission Tier Configuration</CardTitle>
              <CardDescription>
                Set commission percentages for each tier. Partners are upgraded based on quarterly deal count.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border border-border">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#9CA3AF]/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#6B7280]">Ag</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Silver</h4>
                        <p className="text-xs text-muted-foreground">Default tier</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Commission Rate</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-20"
                          value={commissionTiers.silver}
                          onChange={(e) =>
                            setCommissionTiers((prev) => ({
                              ...prev,
                              silver: parseFloat(e.target.value),
                            }))
                          }
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-[#FFC439]/30">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#FFC439]/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#B8860B]">Au</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Gold</h4>
                        <p className="text-xs text-muted-foreground">Mid tier</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Commission Rate</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-20"
                          value={commissionTiers.gold}
                          onChange={(e) =>
                            setCommissionTiers((prev) => ({
                              ...prev,
                              gold: parseFloat(e.target.value),
                            }))
                          }
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Min deals/quarter</Label>
                        <Input
                          type="number"
                          value={commissionTiers.minGold}
                          onChange={(e) =>
                            setCommissionTiers((prev) => ({
                              ...prev,
                              minGold: parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-[#003087]/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[#003087]/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-[#003087]">Pt</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Platinum</h4>
                        <p className="text-xs text-muted-foreground">Top tier</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Commission Rate</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          className="w-20"
                          value={commissionTiers.platinum}
                          onChange={(e) =>
                            setCommissionTiers((prev) => ({
                              ...prev,
                              platinum: parseFloat(e.target.value),
                            }))
                          }
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Min deals/quarter</Label>
                        <Input
                          type="number"
                          value={commissionTiers.minPlatinum}
                          onChange={(e) =>
                            setCommissionTiers((prev) => ({
                              ...prev,
                              minPlatinum: parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button onClick={handleSave} disabled={saving} className="font-semibold bg-[#00A303] hover:bg-[#00A303]/90">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Tiers'}
                </Button>
                {saved && (
                  <span className="text-sm text-[#00A303]">Settings saved!</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
