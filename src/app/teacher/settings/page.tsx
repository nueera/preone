'use client';

// ============================================================
// PreOne — Teacher Settings Page
// Two tabs: Profile + Notifications
// Profile: view/edit profile card, change password
// Notifications: toggle switches for each notification type
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import {
  User,
  Bell,
  Phone,
  MapPin,
  Camera,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  RefreshCw,
  GraduationCap,
  Briefcase,
  Calendar,
  Building2,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle2,
  X,
  Upload,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { teacherFetch } from '@/lib/teacher-api';

// ============================================================
// TYPES
// ============================================================

interface TeacherProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string | null;
  gender: string | null;
  address: string | null;
  qualification: string | null;
  specialization: string | null;
  experience: number;
  photo: string | null;
  joiningDate: string | null;
  status: string;
  assignedClass: {
    id: string;
    name: string;
    program: { id: string; name: string };
  } | null;
  branch: { id: string; name: string } | null;
  school: { id: string; name: string } | null;
}

interface NotificationPref {
  push: boolean;
  email: boolean;
}

type NotificationPrefs = Record<string, NotificationPref>;

// ============================================================
// NOTIFICATION TYPE CONFIG
// ============================================================

const NOTIFICATION_TYPES: Array<{
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    key: 'NEW_ANNOUNCEMENT',
    label: 'New Announcement',
    description: 'When a new announcement is published by admin',
    icon: Bell,
  },
  {
    key: 'PARENT_MESSAGE',
    label: 'Parent Message',
    description: 'When a parent sends you a message',
    icon: Mail,
  },
  {
    key: 'LEAVE_STATUS',
    label: 'Leave Status Update',
    description: 'When your leave request status changes',
    icon: Shield,
  },
  {
    key: 'ATTENDANCE_REMINDER',
    label: 'Attendance Reminder',
    description: 'Daily reminder to mark attendance',
    icon: Calendar,
  },
  {
    key: 'FEE_PAYMENT',
    label: 'Fee Payment',
    description: 'Fee payment notifications for reference',
    icon: Building2,
  },
  {
    key: 'DAILY_UPDATE_REMINDER',
    label: 'Daily Update Reminder',
    description: 'Reminder to fill daily updates for students',
    icon: Bell,
  },
];

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function TeacherSettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await teacherFetch('/api/teacher/profile');
      if (!res) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to load' }));
        throw new Error(err.error || 'Failed to load profile');
      }
      const data = await res.json();
      setProfile(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ── Loading state ──
  if (loading && !profile) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">{error}</p>
        <Button onClick={fetchProfile} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your profile and notification preferences
        </p>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 rounded-xl p-1">
          <TabsTrigger
            value="profile"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <ProfileTab
            profile={profile}
            onProfileUpdate={(updated) => setProfile(updated)}
          />
          <ChangePasswordCard />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// PROFILE TAB
// ============================================================

function ProfileTab({
  profile,
  onProfileUpdate,
}: {
  profile: TeacherProfile;
  onProfileUpdate: (profile: TeacherProfile) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editAddress, setEditAddress] = useState(profile.address || '');
  const [editPhoto, setEditPhoto] = useState<string | null>(profile.photo);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format date for display
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  // Handle photo upload
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Photo must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Save profile changes
  async function handleSaveProfile() {
    setSaving(true);
    try {
      const updateData: Record<string, unknown> = {};
      if (editPhone !== profile.phone) updateData.phone = editPhone;
      if (editAddress !== (profile.address || '')) updateData.address = editAddress;
      if (editPhoto !== profile.photo) updateData.photo = editPhoto;

      if (Object.keys(updateData).length === 0) {
        setEditOpen(false);
        return;
      }

      const res = await teacherFetch('/api/teacher/profile', {
        method: 'PATCH',
        body: JSON.stringify(updateData),
      });

      if (!res) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update' }));
        throw new Error(err.error || 'Failed to update profile');
      }

      const data = await res.json();
      onProfileUpdate(data.profile);
      setEditOpen(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (err: unknown) {
      toast({
        title: 'Update failed',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  // Open edit dialog
  function openEdit() {
    setEditPhone(profile.phone);
    setEditAddress(profile.address || '');
    setEditPhoto(profile.photo);
    setEditOpen(true);
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Profile Card ── */}
        <Card className="rounded-3xl lg:col-span-1">
          <CardContent className="p-6">
            {/* Photo */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-emerald-100 shadow-lg">
                  <AvatarImage src={profile.photo || undefined} alt={fullName} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-3xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {profile.photo && (
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </div>
              <h2 className="text-lg font-bold mt-3">{fullName}</h2>
              <p className="text-sm text-muted-foreground">
                {profile.specialization || 'Teacher'}
              </p>
              <Badge
                variant="outline"
                className="mt-2 border-emerald-200 text-emerald-700 bg-emerald-50 text-xs"
              >
                {profile.status}
              </Badge>
            </div>

            <Separator className="my-4" />

            {/* Quick Info */}
            <div className="space-y-3">
              <InfoRow icon={Mail} label="Email" value={profile.email} />
              <InfoRow icon={Phone} label="Phone" value={profile.phone} />
              <InfoRow icon={Calendar} label="DOB" value={formatDate(profile.dob)} />
              <InfoRow icon={User} label="Gender" value={profile.gender || 'Not set'} />
              <InfoRow icon={MapPin} label="Address" value={profile.address || 'Not set'} />
            </div>

            <Separator className="my-4" />

            {/* Professional Info */}
            <div className="space-y-3">
              <InfoRow icon={GraduationCap} label="Qualification" value={profile.qualification || 'Not set'} />
              <InfoRow icon={Briefcase} label="Specialization" value={profile.specialization || 'Not set'} />
              <InfoRow icon={Building2} label="Experience" value={`${profile.experience} years`} />
              <InfoRow icon={Calendar} label="Joining Date" value={formatDate(profile.joiningDate)} />
              <InfoRow icon={GraduationCap} label="Assigned Class" value={profile.assignedClass?.name || 'Not assigned'} />
            </div>

            <Separator className="my-4" />

            {/* School/Branch */}
            <div className="space-y-3">
              {profile.school && (
                <InfoRow icon={Building2} label="School" value={profile.school.name} />
              )}
              {profile.branch && (
                <InfoRow icon={MapPin} label="Branch" value={profile.branch.name} />
              )}
            </div>

            <Button
              onClick={openEdit}
              className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600"
            >
              <User className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* ── Detailed Profile ── */}
        <Card className="rounded-3xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-emerald-600" />
              Profile Details
            </CardTitle>
            <CardDescription>
              Your personal and professional information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-emerald-700 uppercase tracking-wider">
                  Personal Information
                </h3>
                <DetailField label="Full Name" value={fullName} readonly />
                <DetailField label="Email" value={profile.email} readonly />
                <DetailField label="Phone" value={profile.phone} />
                <DetailField label="Date of Birth" value={formatDate(profile.dob)} readonly />
                <DetailField label="Gender" value={profile.gender || 'Not set'} readonly />
                <DetailField label="Address" value={profile.address || 'Not set'} />
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-emerald-700 uppercase tracking-wider">
                  Professional Information
                </h3>
                <DetailField label="Qualification" value={profile.qualification || 'Not set'} readonly />
                <DetailField label="Specialization" value={profile.specialization || 'Not set'} readonly />
                <DetailField label="Experience" value={`${profile.experience} years`} readonly />
                <DetailField label="Joining Date" value={formatDate(profile.joiningDate)} readonly />
                <DetailField
                  label="Assigned Class"
                  value={profile.assignedClass ? `${profile.assignedClass.name} (${profile.assignedClass.program.name})` : 'Not assigned'}
                  readonly
                />
                <DetailField label="Branch" value={profile.branch?.name || 'Not assigned'} readonly />
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Read-only fields
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Name, email, qualification, specialization, and class assignment are managed by your school admin.
                    Contact them to update these fields.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your phone number, address, and profile photo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>Profile Photo</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-emerald-100">
                  <AvatarImage src={editPhoto || undefined} alt="Preview" />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Change Photo
                  </Button>
                  {editPhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setEditPhoto(null)}
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Max 2MB. JPG, PNG, or GIF.
              </p>
            </div>

            <Separator />

            {/* Read-only fields display */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium">{fullName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{profile.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-phone"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="pl-10 rounded-xl"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="edit-address"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="pl-10 rounded-xl min-h-[80px]"
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="rounded-xl"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================
// CHANGE PASSWORD CARD
// ============================================================

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changing, setChanging] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleChangePassword() {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'New password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords don\'t match',
        description: 'New password and confirm password must be the same',
        variant: 'destructive',
      });
      return;
    }

    if (currentPassword === newPassword) {
      toast({
        title: 'Same password',
        description: 'New password must be different from current password',
        variant: 'destructive',
      });
      return;
    }

    setChanging(true);
    setSuccess(false);

    try {
      const res = await teacherFetch('/api/teacher/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res) return;

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to change password' }));
        throw new Error(err.error || 'Failed to change password');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: 'Password changed',
        description: 'Your password has been updated successfully',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      toast({
        title: 'Change failed',
        description: err instanceof Error ? err.message : 'Failed to change password',
        variant: 'destructive',
      });
    } finally {
      setChanging(false);
    }
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-5 w-5 text-emerald-600" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your account password for security
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-w-md space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-10 pr-10 rounded-xl"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-10 pr-10 rounded-xl"
                placeholder="Enter new password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10 pr-10 rounded-xl"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Passwords don&apos;t match
              </p>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <p className="text-sm text-emerald-700">Password changed successfully!</p>
            </div>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={changing || !currentPassword || !newPassword || !confirmPassword}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600"
          >
            {changing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing Password...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// NOTIFICATIONS TAB
// ============================================================

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPrefs, setOriginalPrefs] = useState<NotificationPrefs | null>(null);

  // Fetch preferences
  const fetchPrefs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await teacherFetch('/api/teacher/notification-preferences');
      if (!res) return;
      if (!res.ok) {
        throw new Error('Failed to load preferences');
      }
      const data = await res.json();
      setPrefs(data.preferences);
      setOriginalPrefs(data.preferences);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load notification prefs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  // Toggle handler
  function handleToggle(key: string, channel: 'push' | 'email') {
    if (!prefs) return;
    const updated = {
      ...prefs,
      [key]: { ...prefs[key], [channel]: !prefs[key][channel] },
    };
    setPrefs(updated);
    setHasChanges(JSON.stringify(updated) !== JSON.stringify(originalPrefs));
  }

  // Save preferences
  async function handleSave() {
    if (!prefs) return;
    setSaving(true);
    try {
      const res = await teacherFetch('/api/teacher/notification-preferences', {
        method: 'PATCH',
        body: JSON.stringify({ preferences: prefs }),
      });

      if (!res) return;
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save' }));
        throw new Error(err.error || 'Failed to save preferences');
      }

      setOriginalPrefs(prefs);
      setHasChanges(false);
      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated',
      });
    } catch (err: unknown) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!prefs) return null;

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-emerald-600" />
              Notification Preferences
            </CardTitle>
            <CardDescription className="mt-1">
              Choose how you want to be notified for different events
            </CardDescription>
          </div>
          {hasChanges && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
              Unsaved changes
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_80px] items-center px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <span>Notification Type</span>
            <span className="text-center">App Push</span>
            <span className="text-center">Email</span>
          </div>
          <Separator />

          {/* Preference Rows */}
          {NOTIFICATION_TYPES.map((type) => {
            const current = prefs[type.key] || { push: false, email: false };
            const Icon = type.icon;

            return (
              <div
                key={type.key}
                className="grid grid-cols-[1fr_80px_80px] items-center px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <Icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={current.push}
                    onCheckedChange={() => handleToggle(type.key, 'push')}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={current.email}
                    onCheckedChange={() => handleToggle(type.key, 'email')}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-4" />

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Changes will apply to future notifications only
          </p>
          <div className="flex gap-2">
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrefs(originalPrefs);
                  setHasChanges(false);
                }}
                className="rounded-xl text-xs"
              >
                Reset
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
  readonly,
}: {
  label: string;
  value: string;
  readonly?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {readonly && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-gray-400 border-gray-200">
            Read only
          </Badge>
        )}
      </div>
      <p className="text-sm font-medium bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
        {value}
      </p>
    </div>
  );
}
