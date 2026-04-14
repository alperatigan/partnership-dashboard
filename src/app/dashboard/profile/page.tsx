'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUpdatePartner } from '@/hooks/use-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, formatDate, getCountryName, getCountryFlag } from '@/lib/utils';
import { Camera, Link, Save, User, Mail, MapPin, Briefcase } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const updatePartner = useUpdatePartner();
  
  const [name, setName] = useState(user?.name || '');
  const [country, setCountry] = useState(user?.country || '');
  const [role, setRole] = useState(user?.role || '');
  const [network, setNetwork] = useState(user?.network || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [whyFit, setWhyFit] = useState(user?.why_fit || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    setSaved(false);
    
    try {
      await updatePartner.mutateAsync({
        id: user.id,
        name,
        country: country as 'PH' | 'VN' | 'TH',
        role,
        network,
        linkedin_url: linkedinUrl,
        why_fit: whyFit,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your partner profile information
        </p>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 text-xl">
                <AvatarFallback className="bg-[#003087] text-white">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#003087] text-white hover:bg-[#003087]/90">
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </CardDescription>
              <div className="flex gap-2 mt-2">
                {user.tier && (
                  <Badge
                    className={
                      user.tier === 'platinum'
                        ? 'bg-[#FFC439]/20 text-[#B8860B] border-[#FFC439]/30'
                        : user.tier === 'gold'
                        ? 'bg-[#FFC439]/20 text-[#B8860B] border-[#FFC439]/30'
                        : 'bg-[#9CA3AF]/20 text-[#6B7280] border-[#9CA3AF]/30'
                    }
                  >
                    {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                  </Badge>
                )}
                <Badge className={
                  user.status === 'approved'
                    ? 'bg-[#00A303]/10 text-[#00A303] border-[#00A303]/20'
                    : 'bg-[#FFC439]/20 text-[#B8860B] border-[#FFC439]/30'
                }>
                  {user.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
          <CardDescription>
            Update your profile details. Some fields require admin approval to change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  className="pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  className="pl-10"
                  value={user.email}
                  disabled
                  readOnly
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Contact support to change your email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-foreground">Country</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country" className="pl-10">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PH">🇵🇭 Philippines</SelectItem>
                    <SelectItem value="VN">🇻🇳 Vietnam</SelectItem>
                    <SelectItem value="TH">🇹🇭 Thailand</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-foreground">Role</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="role"
                  className="pl-10"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="linkedin" className="text-foreground">LinkedIn Profile</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="linkedin"
                className="pl-10"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="network" className="text-foreground">Industry Network</Label>
            <Textarea
              id="network"
              placeholder="Describe your network or connections in the healthcare industry..."
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whyFit" className="text-foreground">Why are you a good fit?</Label>
            <Textarea
              id="whyFit"
              placeholder="Tell us about your experience..."
              value={whyFit}
              onChange={(e) => setWhyFit(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={saving} className="font-semibold">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {saved && (
              <span className="text-sm text-[#00A303]">Changes saved successfully!</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Member since</span>
            <span className="text-foreground">{formatDate(user.created_at)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Approved at</span>
            <span className="text-foreground">{user.approved_at ? formatDate(user.approved_at) : 'Pending approval'}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Total earned</span>
            <span className="font-semibold text-[#003087]">${user.total_earned?.toFixed(2) || '0.00'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
