'use client';

// ============================================================
// PreOne — Parent Settings Page
// Tabs: Profile | KYC | Notifications | Change Password
// Full CRUD with API integration, mobile-first design
// ============================================================

import React, { Suspense, useState, useCallback, useRef } from 'react';
import {
  Settings, User, FileCheck, Bell, Lock,
  Mail, Phone, Briefcase, MapPin, Camera,
  Upload, CheckCircle, Clock, XCircle, AlertTriangle,
  Eye, EyeOff, ArrowLeft, Shield,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParentAuth } from '@/lib/parent-auth';
import { toast } from '@/hooks/use-toast';
import {
  useParentProfile,
  useUpdateProfile,
  useUploadKyc,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useChangePassword,
  type NotificationPreferencesData,
} from '@/hooks/use-parent';

// ============================================================
// HELPERS
// ============================================================

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDocType(type: string): string {
  const map: Record<string, string> = {
    AADHAAR: 'Aadhaar Card',
    ADDRESS_PROOF: 'Address Proof',
    PAN: 'PAN Card',
    PASSPORT: 'Passport',
    VOTER_ID: 'Voter ID',
    BIRTH_CERTIFICATE: 'Birth Certificate',
    OTHER: 'Other Document',
  };
  return map[type] || type;
}

function getPasswordStrength(password: string): {
  label: string; color: string; width: string; score: number;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4', score };
  if (score <= 2) return { label: 'Fair', color: 'bg-yellow-500', width: 'w-2/4', score };
  if (score <= 3) return { label: 'Strong', color: 'bg-blue-500', width: 'w-3/4', score };
  return { label: 'Very Strong', color: 'bg-emerald-500', width: 'w-full', score };
}

// ============================================================
// LOADING SKELETON
// ============================================================

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-4 w-64 mt-2 rounded-lg" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-20 w-20 rounded-full mx-auto" />
          <Skeleton className="h-5 w-40 rounded-lg mx-auto" />
          <Skeleton className="h-4 w-28 rounded-lg mx-auto" />
          <div className="space-y-3 mt-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// PROFILE TAB
// ============================================================

function ProfileTab() {
  const { data: profileData, isLoading } = useParentProfile();
  const updateProfile = useUpdateProfile();
  const { parent: authParent, refresh } = useParentAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    occupation: '',
    address: '',
  });

  const parent = profileData?.parent;
  const children = profileData?.children || [];

  // Initialize form when data loads
  React.useEffect(() => {
    if (parent && !isEditing) {
      setFormData({
        phone: parent.phone || '',
        email: parent.email || '',
        occupation: parent.occupation || '',
        address: parent.address || '',
      });
    }
  }, [parent, isEditing]);

  const handleSave = useCallback(async () => {
    try {
      await updateProfile.mutateAsync(formData);
      setIsEditing(false);
      await refresh();
      toast({ title: 'Profile Updated', description: 'Your profile has been saved successfully.' });
    } catch (error: unknown) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not update profile.',
        variant: 'destructive',
      });
    }
  }, [formData, updateProfile, refresh]);

  const handlePhotoChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Photo must be under 5MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        await updateProfile.mutateAsync({ photo: base64 });
        await refresh();
        toast({ title: 'Photo Updated', description: 'Your profile photo has been updated.' });
      } catch {
        toast({ title: 'Upload Failed', description: 'Could not update photo.', variant: 'destructive' });
      }
    };
    reader.readAsDataURL(file);
  }, [updateProfile, refresh]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <User className="h-12 w-12 text-sky-400" />
        <p className="text-muted-foreground">Unable to load profile data.</p>
      </div>
    );
  }

  const parentFullName = `${parent.firstName} ${parent.lastName}`;
  const parentInitials = getInitials(parent.firstName, parent.lastName);
  const isPrimaryRelation = authParent?.relation === 'Father' || authParent?.relation === 'Mother';

  return (
    <div className="space-y-6">
      {/* Photo + Name Header */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-sky-200 shadow-lg">
            <AvatarImage src={parent.photo || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white text-2xl font-bold">
              {parentInitials}
            </AvatarFallback>
          </Avatar>
          {isEditing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="h-6 w-6 text-white" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        <div className="text-center">
          <h3 className="font-bold text-xl">{parentFullName}</h3>
          <div className="flex items-center gap-2 justify-center mt-1">
            <Badge variant="outline" className="border-sky-200 text-sky-700 bg-sky-50">
              {parent.relation}
            </Badge>
            {isPrimaryRelation && (
              <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50">
                Primary Contact
              </Badge>
            )}
            {parent.isEmergencyContact && (
              <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
                Emergency Contact
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Profile Fields */}
      <div className="space-y-4">
        {/* Name — Read Only */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Full Name</Label>
          <div className="flex items-center gap-2">
            <Input
              value={parentFullName}
              disabled
              className="rounded-xl bg-gray-50"
            />
            <Badge variant="secondary" className="text-[9px] shrink-0">Read Only</Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">Contact admin to change your name.</p>
        </div>

        {/* Relation — Read Only */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Relation</Label>
          <Input
            value={parent.relation}
            disabled
            className="rounded-xl bg-gray-50"
          />
        </div>

        {/* Phone — Editable */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> Phone
          </Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
            disabled={!isEditing}
            className={`rounded-xl ${isEditing ? 'border-sky-300 focus:border-sky-500' : 'bg-gray-50'}`}
            placeholder="Enter phone number"
          />
        </div>

        {/* Email — Editable */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> Email
          </Label>
          <Input
            value={formData.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            disabled={!isEditing}
            type="email"
            className={`rounded-xl ${isEditing ? 'border-sky-300 focus:border-sky-500' : 'bg-gray-50'}`}
            placeholder="Enter email address"
          />
        </div>

        {/* Occupation — Editable */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" /> Occupation
          </Label>
          <Input
            value={formData.occupation}
            onChange={(e) => setFormData((p) => ({ ...p, occupation: e.target.value }))}
            disabled={!isEditing}
            className={`rounded-xl ${isEditing ? 'border-sky-300 focus:border-sky-500' : 'bg-gray-50'}`}
            placeholder="Enter occupation"
          />
        </div>

        {/* Address — Editable */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Address
          </Label>
          <Textarea
            value={formData.address}
            onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
            disabled={!isEditing}
            className={`rounded-xl min-h-[80px] ${isEditing ? 'border-sky-300 focus:border-sky-500' : 'bg-gray-50'}`}
            placeholder="Enter address"
          />
        </div>
      </div>

      <Separator />

      {/* Linked Children */}
      <div className="space-y-3">
        <Label className="text-sm text-muted-foreground">Linked Children</Label>
        {children.length > 0 ? (
          <div className="space-y-2">
            {children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <Avatar className="h-8 w-8 border border-sky-100">
                  <AvatarImage src={child.photo || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white text-[10px] font-bold">
                    {getInitials(child.firstName, child.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {child.firstName} {child.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {child.className || 'No class assigned'}
                  </p>
                </div>
                {child.isPrimary && (
                  <Badge className="bg-amber-100 text-amber-700 text-[9px]">Primary</Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No children linked yet.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              className="rounded-xl flex-1 min-h-[44px]"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl flex-1 min-h-[44px] bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
              onClick={handleSave}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <Button
            className="rounded-xl w-full min-h-[44px] bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================
// KYC TAB
// ============================================================

function KycTab() {
  const { data: profileData, isLoading } = useParentProfile();
  const uploadKyc = useUploadKyc();

  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const parent = profileData?.parent;
  const kycDocuments = profileData?.kycDocuments || [];
  const kycStatus = parent?.kycStatus || null;

  const DOC_TYPES = ['AADHAAR', 'ADDRESS_PROOF', 'PAN', 'PASSPORT', 'VOTER_ID', 'BIRTH_CERTIFICATE'];

  const handleFileSelect = useCallback((docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File Too Large', description: 'Document must be under 5MB.', variant: 'destructive' });
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Invalid Format', description: 'Accepted: JPG, PNG, PDF.', variant: 'destructive' });
      return;
    }

    setSelectedFiles((prev) => ({ ...prev, [docType]: file }));
  }, []);

  const handleUpload = useCallback(async (docType: string) => {
    const file = selectedFiles[docType];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await uploadKyc.mutateAsync({ documentType: docType, document: base64 });
        setSelectedFiles((prev) => ({ ...prev, [docType]: null }));
        toast({ title: 'Document Uploaded', description: `${formatDocType(docType)} submitted for verification.` });
      };
      reader.readAsDataURL(file);
    } catch (error: unknown) {
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Could not upload document.',
        variant: 'destructive',
      });
    }
  }, [selectedFiles, uploadKyc]);

  const handleUploadAll = useCallback(async () => {
    const pendingTypes = Object.entries(selectedFiles)
      .filter(([, file]) => file !== null)
      .map(([type]) => type);

    if (pendingTypes.length === 0) {
      toast({ title: 'No Documents', description: 'Please select at least one document to upload.' });
      return;
    }

    for (const docType of pendingTypes) {
      await handleUpload(docType);
    }
  }, [selectedFiles, handleUpload]);

  const getExistingDoc = (docType: string) => kycDocuments.find((d) => d.documentType === docType);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  // KYC Status Badge
  const statusBadge = (() => {
    if (kycStatus === 'VERIFIED') {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 gap-1 text-sm px-3 py-1">
          <CheckCircle className="h-4 w-4" /> Verified
        </Badge>
      );
    }
    if (kycStatus === 'PENDING') {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 gap-1 text-sm px-3 py-1">
          <Clock className="h-4 w-4" /> Pending Verification
        </Badge>
      );
    }
    if (kycStatus === 'REJECTED') {
      return (
        <Badge className="bg-red-100 text-red-700 gap-1 text-sm px-3 py-1">
          <XCircle className="h-4 w-4" /> Rejected
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-600 gap-1 text-sm px-3 py-1">
        <AlertTriangle className="h-4 w-4" /> Not Submitted
      </Badge>
    );
  })();

  const isLocked = kycStatus === 'VERIFIED';

  return (
    <div className="space-y-6">
      {/* KYC Status Header */}
      <Card className="rounded-2xl border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm">
              <FileCheck className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold">KYC Verification</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLocked
                  ? 'Your documents have been verified.'
                  : kycStatus === 'REJECTED'
                  ? 'Please re-upload the required documents.'
                  : 'Upload documents for identity verification.'}
              </p>
            </div>
          </div>
          {statusBadge}
        </CardContent>
      </Card>

      {/* Rejection Reason */}
      {kycStatus === 'REJECTED' && parent?.kycRejectionReason && (
        <Card className="rounded-2xl border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Rejection Reason</p>
                <p className="text-xs text-red-600 mt-1">{parent.kycRejectionReason}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Upload Sections */}
      <div className="space-y-3">
        {DOC_TYPES.map((docType) => {
          const existingDoc = getExistingDoc(docType);
          const hasFile = selectedFiles[docType] !== null && selectedFiles[docType] !== undefined;

          return (
            <Card key={docType} className="rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-100">
                      <FileCheck className="h-3.5 w-3.5 text-sky-600" />
                    </div>
                    <span className="text-sm font-medium">{formatDocType(docType)}</span>
                  </div>
                  {existingDoc && (
                    <Badge
                      className={`text-[10px] ${
                        existingDoc.status === 'VERIFIED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : existingDoc.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {existingDoc.status === 'VERIFIED' ? (
                        <><CheckCircle className="h-3 w-3 mr-0.5" /> Verified</>
                      ) : existingDoc.status === 'REJECTED' ? (
                        <><XCircle className="h-3 w-3 mr-0.5" /> Rejected</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-0.5" /> Pending</>
                      )}
                    </Badge>
                  )}
                </div>

                {!isLocked ? (
                  <div className="space-y-2">
                    <div
                      className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-sky-300 transition-colors cursor-pointer"
                      onClick={() => fileInputRefs.current[docType]?.click()}
                    >
                      <Upload className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">
                        {hasFile ? selectedFiles[docType]?.name : 'Choose File or Drag & Drop'}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        JPG, PNG, PDF up to 5MB
                      </p>
                      <input
                        ref={(el) => { fileInputRefs.current[docType] = el; }}
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileSelect(docType, e)}
                      />
                    </div>
                    {hasFile && (
                      <Button
                        size="sm"
                        className="rounded-xl w-full min-h-[44px] bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
                        onClick={() => handleUpload(docType)}
                        disabled={uploadKyc.isPending}
                      >
                        {uploadKyc.isPending ? 'Uploading...' : `Upload ${formatDocType(docType)}`}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 border border-emerald-100">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs text-emerald-700">Document verified and locked</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload All Button */}
      {!isLocked && Object.values(selectedFiles).some((f) => f !== null) && (
        <Button
          className="rounded-xl w-full min-h-[44px] bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
          onClick={handleUploadAll}
          disabled={uploadKyc.isPending}
        >
          {uploadKyc.isPending ? 'Uploading...' : 'Upload All Documents'}
        </Button>
      )}
    </div>
  );
}

// ============================================================
// NOTIFICATIONS TAB
// ============================================================

function NotificationsTab() {
  const { data: prefsData, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdateNotificationPreferences();

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferencesData | null>(null);

  const prefs = prefsData?.preferences || null;

  // Sync local state with fetched data
  React.useEffect(() => {
    if (prefs && !localPrefs) {
      setLocalPrefs(prefs);
    }
  }, [prefs, localPrefs]);

  const handleToggle = useCallback((field: keyof NotificationPreferencesData, value: boolean) => {
    if (!localPrefs) return;
    setLocalPrefs((prev) => prev ? { ...prev, [field]: value } : null);

    // Debounced API update
    updatePrefs.mutate({ [field]: value });
  }, [localPrefs, updatePrefs]);

  const NOTIFICATION_ROWS = [
    {
      label: 'Daily Update Published',
      icon: '☀️',
      appField: 'dailyUpdateApp' as const,
      smsField: 'dailyUpdateSms' as const,
      emailField: 'dailyUpdateEmail' as const,
    },
    {
      label: 'New Observation Shared',
      icon: '👁️',
      appField: 'observationApp' as const,
      smsField: 'observationSms' as const,
      emailField: 'observationEmail' as const,
    },
    {
      label: 'Fee Reminder',
      icon: '💰',
      appField: 'feeReminderApp' as const,
      smsField: 'feeReminderSms' as const,
      emailField: 'feeReminderEmail' as const,
    },
    {
      label: 'Fee Overdue',
      icon: '⚠️',
      appField: 'feeOverdueApp' as const,
      smsField: 'feeOverdueSms' as const,
      emailField: 'feeOverdueEmail' as const,
    },
    {
      label: 'Attendance Marked',
      icon: '📋',
      appField: 'attendanceApp' as const,
      smsField: 'attendanceSms' as const,
      emailField: 'attendanceEmail' as const,
    },
    {
      label: 'New Announcement',
      icon: '📢',
      appField: 'announcementApp' as const,
      smsField: 'announcementSms' as const,
      emailField: 'announcementEmail' as const,
    },
    {
      label: 'Teacher Message',
      icon: '💬',
      appField: 'teacherMessageApp' as const,
      smsField: 'teacherMessageSms' as const,
      emailField: 'teacherMessageEmail' as const,
    },
    {
      label: 'Leave Status Update',
      icon: '📝',
      appField: 'leaveStatusApp' as const,
      smsField: 'leaveStatusSms' as const,
      emailField: 'leaveStatusEmail' as const,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose how you want to be notified for each event. Changes are saved automatically.
      </p>

      {/* Column Headers */}
      <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center px-4">
        <span className="text-xs font-medium text-muted-foreground">Notification</span>
        <span className="text-xs font-medium text-muted-foreground text-center">App Push</span>
        <span className="text-xs font-medium text-muted-foreground text-center">SMS</span>
        <span className="text-xs font-medium text-muted-foreground text-center">Email</span>
      </div>

      {/* Notification Rows */}
      <div className="space-y-2">
        {NOTIFICATION_ROWS.map((row) => (
          <div
            key={row.appField}
            className="bg-gray-50 rounded-xl p-3 sm:p-4 hover:bg-gray-100/80 transition-colors"
          >
            {/* Mobile Layout */}
            <div className="sm:hidden space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-base">{row.icon}</span>
                <span className="text-sm font-medium">{row.label}</span>
              </div>
              <div className="flex items-center gap-4 justify-around">
                <div className="flex flex-col items-center gap-1">
                  <Switch
                    checked={localPrefs?.[row.appField] ?? true}
                    onCheckedChange={(v) => handleToggle(row.appField, v)}
                    className="data-[state=checked]:bg-sky-500"
                  />
                  <span className="text-[10px] text-muted-foreground">App</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Switch
                    checked={localPrefs?.[row.smsField] ?? false}
                    onCheckedChange={(v) => handleToggle(row.smsField, v)}
                    className="data-[state=checked]:bg-sky-500"
                  />
                  <span className="text-[10px] text-muted-foreground">SMS</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Switch
                    checked={localPrefs?.[row.emailField] ?? false}
                    onCheckedChange={(v) => handleToggle(row.emailField, v)}
                    className="data-[state=checked]:bg-sky-500"
                  />
                  <span className="text-[10px] text-muted-foreground">Email</span>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center">
              <div className="flex items-center gap-2">
                <span className="text-base">{row.icon}</span>
                <span className="text-sm font-medium">{row.label}</span>
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={localPrefs?.[row.appField] ?? true}
                  onCheckedChange={(v) => handleToggle(row.appField, v)}
                  className="data-[state=checked]:bg-sky-500"
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={localPrefs?.[row.smsField] ?? false}
                  onCheckedChange={(v) => handleToggle(row.smsField, v)}
                  className="data-[state=checked]:bg-sky-500"
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={localPrefs?.[row.emailField] ?? false}
                  onCheckedChange={(v) => handleToggle(row.emailField, v)}
                  className="data-[state=checked]:bg-sky-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        Notification preferences are saved instantly. SMS and Email delivery requires school to have the service configured.
      </p>
    </div>
  );
}

// ============================================================
// CHANGE PASSWORD TAB
// ============================================================

function ChangePasswordTab() {
  const changePassword = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const strength = getPasswordStrength(form.newPassword);

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};

    if (!form.currentPassword) errs.currentPassword = 'Current password is required';
    if (!form.newPassword) {
      errs.newPassword = 'New password is required';
    } else {
      if (form.newPassword.length < 8) errs.newPassword = 'Minimum 8 characters';
      if (!/[A-Z]/.test(form.newPassword)) errs.newPassword = 'At least 1 uppercase letter required';
      if (!/[0-9]/.test(form.newPassword)) errs.newPassword = 'At least 1 number required';
    }
    if (form.newPassword !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      await changePassword.mutateAsync({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast({ title: 'Password Changed', description: 'Please log in with your new password.' });
      // Redirect to login after a short delay
      setTimeout(() => {
        localStorage.removeItem('preone_token');
        localStorage.removeItem('preone_user');
        window.location.href = '/login';
      }, 1500);
    } catch (error: unknown) {
      toast({
        title: 'Password Change Failed',
        description: error instanceof Error ? error.message : 'Could not change password.',
        variant: 'destructive',
      });
    }
  }, [form, validate, changePassword]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100">
        <div className="p-2.5 rounded-xl bg-white shadow-sm">
          <Shield className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h3 className="font-semibold">Change Password</h3>
          <p className="text-xs text-muted-foreground">Min 8 chars, 1 uppercase, 1 number</p>
        </div>
      </div>

      {/* Current Password */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Current Password</Label>
        <div className="relative">
          <Input
            type={showCurrent ? 'text' : 'password'}
            value={form.currentPassword}
            onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
            className="rounded-xl pr-10"
            placeholder="Enter current password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
            onClick={() => setShowCurrent(!showCurrent)}
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-xs text-red-500">{errors.currentPassword}</p>
        )}
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">New Password</Label>
        <div className="relative">
          <Input
            type={showNew ? 'text' : 'password'}
            value={form.newPassword}
            onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
            className="rounded-xl pr-10"
            placeholder="Enter new password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
            onClick={() => setShowNew(!showNew)}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-xs text-red-500">{errors.newPassword}</p>
        )}

        {/* Password Strength Indicator */}
        {form.newPassword && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Strength</span>
              <span className={`text-[10px] font-medium ${
                strength.label === 'Weak' ? 'text-red-500' :
                strength.label === 'Fair' ? 'text-yellow-600' :
                strength.label === 'Strong' ? 'text-blue-600' :
                'text-emerald-600'
              }`}>
                {strength.label}
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full ${strength.color} rounded-full transition-all duration-300 ${strength.width}`} />
            </div>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Confirm New Password</Label>
        <div className="relative">
          <Input
            type={showConfirm ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            className="rounded-xl pr-10"
            placeholder="Confirm new password"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        className="rounded-xl w-full min-h-[44px] bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
        onClick={handleSubmit}
        disabled={changePassword.isPending}
      >
        {changePassword.isPending ? 'Changing Password...' : 'Change Password'}
      </Button>
    </div>
  );
}

// ============================================================
// MAIN SETTINGS CONTENT (inside Suspense)
// ============================================================

function SettingsContent() {
  const { parent, isLoading } = useParentAuth();
  const [activeTab, setActiveTab] = useState('profile');

  if (isLoading) {
    return <SettingsLoadingSkeleton />;
  }

  if (!parent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <User className="h-12 w-12 text-sky-400" />
        <p className="text-muted-foreground">Unable to load profile data.</p>
        <p className="text-xs text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500">
            <Settings className="h-5 w-5 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full grid grid-cols-4 h-12 rounded-2xl bg-gray-100 p-1">
          <TabsTrigger
            value="profile"
            className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-sky-700 min-h-[40px]"
          >
            <User className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger
            value="kyc"
            className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-sky-700 min-h-[40px]"
          >
            <FileCheck className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">KYC</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-sky-700 min-h-[40px]"
          >
            <Bell className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className="rounded-xl text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-sky-700 min-h-[40px]"
          >
            <Lock className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Password</span>
          </TabsTrigger>
        </TabsList>

        <Card className="rounded-3xl">
          <CardContent className="p-4 sm:p-6">
            <TabsContent value="profile" className="mt-0">
              <ProfileTab />
            </TabsContent>
            <TabsContent value="kyc" className="mt-0">
              <KycTab />
            </TabsContent>
            <TabsContent value="notifications" className="mt-0">
              <NotificationsTab />
            </TabsContent>
            <TabsContent value="password" className="mt-0">
              <ChangePasswordTab />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}

// ============================================================
// EXPORTED PAGE (with Suspense boundary)
// ============================================================

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
