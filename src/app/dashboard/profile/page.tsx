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
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif">Profile</h1>
        <p className="text-muted-foreground mt-1">
          Manage your partner profile information
        </p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 text-xl">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Camera className="h-3 w-3" />
              </button>
            </div>
            <div>
              <CardTitle className="text-xl">{user.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </CardDescription>
              <div className="flex gap-2 mt-2">
                {user.tier && (
                  <Badge
                    variant={
                      user.tier === 'platinum'
                        ? 'platinum'
                        : user.tier === 'gold'
                        ? 'gold'
                        : 'silver'
                    }
                  >
                    {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
                  </Badge>
                )}
                <Badge variant={user.status === 'approved' ? 'success' : 'warning'}>
                  {user.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your profile details. Some fields require admin approval to change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="country">Country</Label>
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
              <Label htmlFor="role">Role</Label>
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
            <Label htmlFor="linkedin">LinkedIn Profile</Label>
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
            <Label htmlFor="network">Industry Network</Label>
            <Textarea
              id="network"
              placeholder="Describe your network or connections in the healthcare industry..."
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whyFit">Why are you a good fit?</Label>
            <Textarea
              id="whyFit"
              placeholder="Tell us about your experience..."
              value={whyFit}
              onChange={(e) => setWhyFit(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            {saved && (
              <span className="text-sm text-green-600">Changes saved successfully!</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Member since</span>
            <span>{formatDate(user.created_at)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Approved at</span>
            <span>{user.approved_at ? formatDate(user.approved_at) : 'Pending approval'}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Total earned</span>
            <span className="font-semibold text-primary">${user.total_earned?.toFixed(2) || '0.00'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
