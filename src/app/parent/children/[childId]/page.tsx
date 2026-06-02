'use client';

// ============================================================
// PreOne — Child Detail Page
// Full profile with comprehensive tabs:
// 1. Personal Info
// 2. Parent & Guardian Info
// 3. Medical Records
// 4. Siblings
// 5. Class Teacher
// ============================================================

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Baby, Calendar, Droplets, User, Phone, Mail,
  Briefcase, Home, ShieldCheck, MessageSquare, AlertTriangle,
  Heart, GraduationCap, Award, Clock, RefreshCw, AlertCircle,
  UserCheck, Stethoscope, Syringe, Pill, Siren,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParentAuth } from '@/lib/parent-auth';
import { useParentChild, type ChildDetail } from '@/hooks/use-parent';

// ============================================================
// HELPERS
// ============================================================

function calculateAge(dob: string): string {
  const birthDate = new Date(dob);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (today.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active ✅</Badge>;
    case 'INACTIVE':
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Inactive</Badge>;
    case 'GRADUATED':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Graduated 🎓</Badge>;
    case 'TRANSFERRED':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Transferred</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function maskAadhaar(aadhaar: string | null): string {
  if (!aadhaar) return 'Not available';
  if (aadhaar.length <= 4) return aadhaar;
  return `${aadhaar.slice(0, 4)}****${aadhaar.slice(-4)}`;
}

function getRelationIcon(relation: string): string {
  const r = relation.toLowerCase();
  if (r === 'father') return '👨';
  if (r === 'mother') return '👩';
  if (r === 'guardian') return '🛡️';
  return '👤';
}

// ============================================================
// TAB 1 — PERSONAL INFO
// ============================================================

function PersonalInfoTab({ child }: { child: ChildDetail }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="h-4 w-4 text-sky-600" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <InfoRow label="Full Name" value={`${child.firstName} ${child.lastName}`} />
            <InfoRow label="Date of Birth" value={formatDate(child.dob)} />
            <InfoRow label="Age" value={calculateAge(child.dob)} />
            <InfoRow label="Gender" value={child.gender} />
            <InfoRow label="Blood Group" value={child.bloodGroup || 'Not recorded'} />
            <InfoRow label="Aadhaar" value={maskAadhaar(child.aadhaarNumber)} />
            <InfoRow label="Roll Number" value={child.rollNumber || 'Not assigned'} />
            <InfoRow label="Admission Date" value={formatDate(child.admissionDate)} />
            <InfoRow label="Status" value={undefined} customValue={getStatusBadge(child.status)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  customValue,
}: {
  label: string;
  value?: string;
  customValue?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      {customValue || <p className="text-sm font-medium">{value}</p>}
    </div>
  );
}

// ============================================================
// TAB 2 — PARENT & GUARDIAN INFO
// ============================================================

function ParentGuardianTab({ child }: { child: ChildDetail }) {
  return (
    <div className="space-y-4">
      {child.parents.map((p) => (
        <Card key={p.id} className={`rounded-3xl ${p.isPrimary ? 'ring-2 ring-sky-200' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-2xl shrink-0">
                {getRelationIcon(p.relation)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-base">
                    {p.firstName} {p.lastName}
                  </h4>
                  {p.isPrimary && (
                    <Badge className="bg-sky-100 text-sky-700 text-[9px] border border-sky-200">
                      Primary Contact
                    </Badge>
                  )}
                  {p.isEmergencyContact && (
                    <Badge className="bg-red-50 text-red-700 text-[9px] border border-red-200">
                      🆘 Emergency Contact
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {p.relation}
                </p>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {p.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </div>
                  )}
                  {p.occupation && (
                    <div className="flex items-center gap-2 text-sm">
                      <Briefcase className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      <span>{p.occupation}</span>
                    </div>
                  )}
                  {p.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{p.address}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-3 flex items-center gap-2">
                  {p.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs h-8"
                      onClick={() => window.open(`tel:${p.phone}`, '_self')}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  )}
                  {p.phone && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs h-8 text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => window.open(`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      WhatsApp
                    </Button>
                  )}
                  {p.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs h-8"
                      onClick={() => window.open(`mailto:${p.email}`, '_self')}
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// TAB 3 — MEDICAL RECORDS
// ============================================================

function MedicalTab({ child }: { child: ChildDetail }) {
  const medical = child.latestMedical;
  const hasAllergies = medical?.allergies && medical.allergies.toLowerCase() !== 'none' && medical.allergies.trim() !== '';
  const hasConditions = medical?.conditions && medical.conditions.toLowerCase() !== 'none' && medical.conditions.trim() !== '';

  return (
    <div className="space-y-4">
      {/* Allergy Alert Banner */}
      {hasAllergies && (
        <Card className="rounded-3xl border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800">
                  Allergy Alert
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This child has reported allergies: <strong>{medical!.allergies}</strong>.
                  Please inform all caregivers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditions Alert Banner */}
      {hasConditions && (
        <Card className="rounded-3xl border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Medical Condition
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  This child has reported conditions: <strong>{medical!.conditions}</strong>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Medical Info Card */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-sky-600" />
            Medical Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {medical ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-start gap-3">
                  <Siren className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Allergies</p>
                    <p className={`text-sm font-medium ${hasAllergies ? 'text-red-600' : ''}`}>
                      {medical.allergies || 'None'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Conditions</p>
                    <p className={`text-sm font-medium ${hasConditions ? 'text-amber-600' : ''}`}>
                      {medical.conditions || 'None'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Pill className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Medications</p>
                    <p className="text-sm font-medium">
                      {medical.medications || 'None'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Syringe className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vaccination</p>
                    <p className="text-sm font-medium">
                      {medical.vaccinationStatus || 'Not recorded'}
                      {medical.vaccinationStatus?.toLowerCase().includes('up-to-date') && ' ✅'}
                    </p>
                  </div>
                </div>
                {medical.doctorName && (
                  <div className="flex items-start gap-3">
                    <User className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Doctor</p>
                      <p className="text-sm font-medium">{medical.doctorName}</p>
                    </div>
                  </div>
                )}
                {medical.doctorPhone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Doctor Phone</p>
                      <p className="text-sm font-medium">{medical.doctorPhone}</p>
                    </div>
                  </div>
                )}
              </div>

              {medical.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{medical.notes}</p>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <Stethoscope className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No medical records found</p>
              <p className="text-xs text-muted-foreground">
                Contact the school to add medical information
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Medical Records History */}
      {child.medicalRecords.length > 1 && (
        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-600" />
              Medical Record History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {child.medicalRecords.map((record, idx) => (
                <div
                  key={record.id}
                  className="p-3 rounded-xl bg-gray-50 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {idx === 0 ? 'Latest Record' : `Record #${child.medicalRecords.length - idx}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated: {formatDate(record.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {record.allergies && record.allergies.toLowerCase() !== 'none' && (
                      <Badge className="bg-red-50 text-red-700 text-[9px]">Allergies</Badge>
                    )}
                    {record.vaccinationStatus && (
                      <Badge className="bg-emerald-50 text-emerald-700 text-[9px]">
                        {record.vaccinationStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// TAB 4 — SIBLINGS
// ============================================================

function SiblingsTab({ child }: { child: ChildDetail }) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="h-4 w-4 text-sky-600" />
          Siblings in School
        </CardTitle>
      </CardHeader>
      <CardContent>
        {child.siblings.length > 0 ? (
          <div className="space-y-3">
            {child.siblings.map((sibling) => (
              <div
                key={sibling.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <Avatar className="h-12 w-12 border-2 border-sky-200">
                  <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white text-sm font-bold">
                    {sibling.firstName[0]}{sibling.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm">
                      {sibling.firstName} {sibling.lastName}
                    </h4>
                    <Badge variant="outline" className="text-[9px]">
                      {sibling.relation || 'Sibling'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Class: {sibling.className || 'Not assigned'}
                    {sibling.rollNumber && ` | Roll: ${sibling.rollNumber}`}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs shrink-0"
                  onClick={() => {
                    // Navigate to sibling's detail page
                    window.location.href = `/parent/children/${sibling.id}`;
                  }}
                >
                  Switch to View
                  <ArrowLeft className="h-3 w-3 ml-1 rotate-180" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <Baby className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No siblings in school</p>
            <p className="text-xs text-muted-foreground">
              This child does not have any siblings enrolled at this school
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// TAB 5 — CLASS TEACHER
// ============================================================

function ClassTeacherTab({ child }: { child: ChildDetail }) {
  const teacher = child.class?.teacher;
  const router = useRouter();

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-sky-600" />
          Class Teacher
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teacher ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-sky-200">
                <AvatarImage src={teacher.photo || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xl font-bold">
                  {teacher.firstName[0]}{teacher.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-bold text-lg">
                  {teacher.firstName} {teacher.lastName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {child.class?.name || 'Class Teacher'}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teacher.qualification && (
                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Qualification</p>
                    <p className="text-sm font-medium">{teacher.qualification}</p>
                  </div>
                </div>
              )}
              {teacher.specialization && (
                <div className="flex items-start gap-2">
                  <GraduationCap className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Specialization</p>
                    <p className="text-sm font-medium">{teacher.specialization}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-sm font-medium">
                    {teacher.experience} {teacher.experience === 1 ? 'year' : 'years'}
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl hover:from-sky-600 hover:to-blue-600"
              onClick={() => router.push(`/parent/communication?teacher=${teacher.id}`)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat with Teacher
            </Button>
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No class teacher assigned</p>
            <p className="text-xs text-muted-foreground">
              The school has not assigned a teacher to this class yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function DetailLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-3xl" />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function ChildDetailPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = use(params);
  const router = useRouter();
  const { selectChild, selectedChildId, children } = useParentAuth();
  const { data, isLoading, isError, error, refetch } = useParentChild(childId);

  const [activeTab, setActiveTab] = useState('personal');

  // Loading state
  if (isLoading) {
    return <DetailLoadingSkeleton />;
  }

  // Error state
  if (isError || !data?.child) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">
          {error?.message || 'Failed to load child details'}
        </p>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
          <Button onClick={() => router.push('/parent/children')} variant="outline" className="rounded-xl">
            Back to Children
          </Button>
        </div>
      </div>
    );
  }

  const child = data.child;
  const fullName = `${child.firstName} ${child.lastName}`;
  const initials = `${child.firstName[0]}${child.lastName[0]}`;
  const isActiveChild = childId === selectedChildId;

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={() => router.push('/parent/children')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Children
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar className="h-28 w-28 border-4 border-sky-200 shrink-0">
              <AvatarImage src={child.photo || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white text-3xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                <h1 className="text-2xl font-bold">{fullName}</h1>
                {isActiveChild && (
                  <Badge className="bg-sky-100 text-sky-700 text-[9px] border border-sky-200">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground justify-center sm:justify-start">
                <span>{child.class?.name || 'No class'}</span>
                {child.rollNumber && <span>Roll: {child.rollNumber}</span>}
                <span>DOB: {formatDateShort(child.dob)}</span>
                <span>Age: {calculateAge(child.dob)}</span>
                <span>Gender: {child.gender}</span>
                {child.bloodGroup && <span>B+: {child.bloodGroup}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground justify-center sm:justify-start">
                <span>Admission: {formatDateShort(child.admissionDate)}</span>
                {getStatusBadge(child.status)}
              </div>
              {child.class?.teacher && (
                <p className="text-sm text-muted-foreground mt-2">
                  Class Teacher: <span className="font-medium text-foreground">{child.class.teacher.firstName} {child.class.teacher.lastName}</span>
                </p>
              )}
            </div>
            <div className="shrink-0">
              {!isActiveChild && (
                <Button
                  className="bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl hover:from-sky-600 hover:to-blue-600"
                  onClick={() => selectChild(childId)}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Set as Active
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 rounded-2xl h-11">
          <TabsTrigger value="personal" className="rounded-xl text-xs sm:text-sm">
            <span className="hidden sm:inline">Personal Info</span>
            <span className="sm:hidden">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="parents" className="rounded-xl text-xs sm:text-sm">
            <span className="hidden sm:inline">Parents</span>
            <span className="sm:hidden">Parents</span>
          </TabsTrigger>
          <TabsTrigger value="medical" className="rounded-xl text-xs sm:text-sm">
            <span className="hidden sm:inline">Medical</span>
            <span className="sm:hidden">Medical</span>
          </TabsTrigger>
          <TabsTrigger value="siblings" className="rounded-xl text-xs sm:text-sm">
            <span className="hidden sm:inline">Siblings</span>
            <span className="sm:hidden">Siblings</span>
          </TabsTrigger>
          <TabsTrigger value="teacher" className="rounded-xl text-xs sm:text-sm">
            <span className="hidden sm:inline">Teacher</span>
            <span className="sm:hidden">Teacher</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="personal">
            <PersonalInfoTab child={child} />
          </TabsContent>

          <TabsContent value="parents">
            <ParentGuardianTab child={child} />
          </TabsContent>

          <TabsContent value="medical">
            <MedicalTab child={child} />
          </TabsContent>

          <TabsContent value="siblings">
            <SiblingsTab child={child} />
          </TabsContent>

          <TabsContent value="teacher">
            <ClassTeacherTab child={child} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
