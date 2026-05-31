'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Upload,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// ── Types ──
interface ProgramGroup {
  id: string;
  name: string;
  classes: { id: string; name: string; _count: { students: number } }[];
}

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStudentCreated: () => void;
}

// ── Step definitions ──
const STEPS = [
  { id: 1, title: 'Basic Information' },
  { id: 2, title: 'Parent / Guardian' },
  { id: 3, title: 'Medical & Additional' },
];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export function AddStudentDialog({ open, onOpenChange, onStudentCreated }: AddStudentDialogProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [programs, setPrograms] = useState<ProgramGroup[]>([]);

  // ── Form state ──
  const [form, setForm] = useState({
    // Step 1
    firstName: '',
    lastName: '',
    dob: null as Date | null,
    gender: '',
    bloodGroup: '',
    aadhaarNumber: '',
    classId: '',
    admissionDate: new Date() as Date | null,
    photo: null as File | null,
    photoPreview: '',
    // Step 2
    fatherFirstName: '',
    fatherLastName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherOccupation: '',
    motherFirstName: '',
    motherLastName: '',
    motherPhone: '',
    motherEmail: '',
    motherOccupation: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: '',
    // Step 3
    allergies: '',
    conditions: '',
    medications: '',
    vaccinationStatus: '',
    doctorName: '',
    doctorPhone: '',
    medicalNotes: '',
  });

  // ── Fetch programs ──
  useEffect(() => {
    async function fetchClasses() {
      try {
        const token = getToken();
        const res = await fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPrograms(data.programs || []);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    }
    if (open) fetchClasses();
  }, [open]);

  // ── Reset form when dialog opens ──
  useEffect(() => {
    if (open) {
      setStep(1);
      setError('');
      setForm({
        firstName: '',
        lastName: '',
        dob: null,
        gender: '',
        bloodGroup: '',
        aadhaarNumber: '',
        classId: '',
        admissionDate: new Date(),
        photo: null,
        photoPreview: '',
        fatherFirstName: '',
        fatherLastName: '',
        fatherPhone: '',
        fatherEmail: '',
        fatherOccupation: '',
        motherFirstName: '',
        motherLastName: '',
        motherPhone: '',
        motherEmail: '',
        motherOccupation: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        address: '',
        allergies: '',
        conditions: '',
        medications: '',
        vaccinationStatus: '',
        doctorName: '',
        doctorPhone: '',
        medicalNotes: '',
      });
    }
  }, [open]);

  // ── Photo upload handler ──
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photoPreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Step validation ──
  const validateStep = (stepNum: number): boolean => {
    switch (stepNum) {
      case 1:
        if (!form.firstName || form.firstName.length < 2) {
          setError('First name is required (min 2 chars)');
          return false;
        }
        if (!form.lastName || form.lastName.length < 2) {
          setError('Last name is required (min 2 chars)');
          return false;
        }
        if (!form.dob) {
          setError('Date of birth is required');
          return false;
        }
        if (form.dob > new Date()) {
          setError('Date of birth must be in the past');
          return false;
        }
        if (!form.gender) {
          setError('Gender is required');
          return false;
        }
        if (!form.classId) {
          setError('Class is required');
          return false;
        }
        if (form.aadhaarNumber && !/^\d{12}$/.test(form.aadhaarNumber)) {
          setError('Aadhaar number must be 12 digits');
          return false;
        }
        return true;

      case 2:
        if (!form.fatherFirstName || !form.fatherLastName) {
          setError("Father's name is required");
          return false;
        }
        if (!form.fatherPhone) {
          setError("Father's phone is required");
          return false;
        }
        if (!form.emergencyContactName || !form.emergencyContactPhone) {
          setError('Emergency contact name and phone are required');
          return false;
        }
        if (!form.address) {
          setError('Address is required');
          return false;
        }
        return true;

      case 3:
        return true;

      default:
        return false;
    }
  };

  // ── Next / Back ──
  const handleNext = () => {
    setError('');
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setStep(step - 1);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      const token = getToken();
      // Convert photo to base64 if uploaded
      let photoBase64 = '';
      if (form.photo) {
        photoBase64 = form.photoPreview;
      }

      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        dob: form.dob?.toISOString(),
        gender: form.gender,
        bloodGroup: form.bloodGroup || undefined,
        aadhaarNumber: form.aadhaarNumber || undefined,
        classId: form.classId,
        admissionDate: form.admissionDate?.toISOString(),
        photo: photoBase64 || undefined,
        fatherFirstName: form.fatherFirstName,
        fatherLastName: form.fatherLastName,
        fatherPhone: form.fatherPhone,
        fatherEmail: form.fatherEmail || undefined,
        fatherOccupation: form.fatherOccupation || undefined,
        motherFirstName: form.motherFirstName || undefined,
        motherLastName: form.motherLastName || undefined,
        motherPhone: form.motherPhone || undefined,
        motherEmail: form.motherEmail || undefined,
        motherOccupation: form.motherOccupation || undefined,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        address: form.address,
        allergies: form.allergies || undefined,
        conditions: form.conditions || undefined,
        medications: form.medications || undefined,
        vaccinationStatus: form.vaccinationStatus || undefined,
        doctorName: form.doctorName || undefined,
        doctorPhone: form.doctorPhone || undefined,
        medicalNotes: form.medicalNotes || undefined,
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create student');
      }

      onOpenChange(false);
      onStudentCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Update form field ──
  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Student</DialogTitle>
        </DialogHeader>

        {/* ── Step Indicator ── */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div
                  className={cn(
                    'flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-colors',
                    step >= s.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {s.id}
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-1 rounded-full transition-colors',
                      step > s.id ? 'bg-purple-600' : 'bg-gray-100'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Step {step}: {STEPS[step - 1].title}
          </p>
        </div>

        {/* ── Error Message ── */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {/* ── Step 1: Basic Information ── */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Photo upload */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {form.photoPreview ? (
                  <img
                    src={form.photoPreview}
                    alt="Preview"
                    className="h-16 w-16 rounded-full object-cover border-2 border-purple-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-purple-50 border-2 border-dashed border-purple-200 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-purple-300" />
                  </div>
                )}
                {form.photoPreview && (
                  <button
                    onClick={() => updateField('photo', null) || updateField('photoPreview', '')}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div>
                <Label htmlFor="photo" className="text-sm font-medium">Student Photo</Label>
                <p className="text-xs text-muted-foreground">Optional — JPG, PNG</p>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  className="mt-1 max-w-[200px] text-xs"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !form.dob && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.dob ? format(form.dob, 'dd MMM yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.dob || undefined}
                      onSelect={(d) => updateField('dob', d)}
                      disabled={(d) => d > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Gender *</Label>
                <RadioGroup
                  value={form.gender}
                  onValueChange={(v) => updateField('gender', v)}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Male" id="male" />
                    <Label htmlFor="male" className="cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Female" id="female" />
                    <Label htmlFor="female" className="cursor-pointer">Female</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Blood Group</Label>
                <Select value={form.bloodGroup} onValueChange={(v) => updateField('bloodGroup', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                <Input
                  id="aadhaarNumber"
                  value={form.aadhaarNumber}
                  onChange={(e) => updateField('aadhaarNumber', e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="12-digit Aadhaar"
                  maxLength={12}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Class *</Label>
                <Select value={form.classId} onValueChange={(v) => updateField('classId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectGroup key={program.id}>
                        <SelectLabel>{program.name}</SelectLabel>
                        {program.classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Admission Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !form.admissionDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.admissionDate ? format(form.admissionDate, 'dd MMM yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.admissionDate || undefined}
                      onSelect={(d) => updateField('admissionDate', d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Parent / Guardian ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-purple-700">Father&apos;s Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Father&apos;s First Name *</Label>
                <Input
                  value={form.fatherFirstName}
                  onChange={(e) => updateField('fatherFirstName', e.target.value)}
                  placeholder="Father's first name"
                />
              </div>
              <div>
                <Label>Father&apos;s Last Name *</Label>
                <Input
                  value={form.fatherLastName}
                  onChange={(e) => updateField('fatherLastName', e.target.value)}
                  placeholder="Father's last name"
                />
              </div>
              <div>
                <Label>Father&apos;s Phone *</Label>
                <Input
                  value={form.fatherPhone}
                  onChange={(e) => updateField('fatherPhone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>Father&apos;s Email</Label>
                <Input
                  type="email"
                  value={form.fatherEmail}
                  onChange={(e) => updateField('fatherEmail', e.target.value)}
                  placeholder="Email address"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Father&apos;s Occupation</Label>
                <Input
                  value={form.fatherOccupation}
                  onChange={(e) => updateField('fatherOccupation', e.target.value)}
                  placeholder="Occupation"
                />
              </div>
            </div>

            <hr className="my-2" />

            <h3 className="font-semibold text-purple-700">Mother&apos;s Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Mother&apos;s First Name</Label>
                <Input
                  value={form.motherFirstName}
                  onChange={(e) => updateField('motherFirstName', e.target.value)}
                  placeholder="Mother's first name"
                />
              </div>
              <div>
                <Label>Mother&apos;s Last Name</Label>
                <Input
                  value={form.motherLastName}
                  onChange={(e) => updateField('motherLastName', e.target.value)}
                  placeholder="Mother's last name"
                />
              </div>
              <div>
                <Label>Mother&apos;s Phone</Label>
                <Input
                  value={form.motherPhone}
                  onChange={(e) => updateField('motherPhone', e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>Mother&apos;s Email</Label>
                <Input
                  type="email"
                  value={form.motherEmail}
                  onChange={(e) => updateField('motherEmail', e.target.value)}
                  placeholder="Email address"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Mother&apos;s Occupation</Label>
                <Input
                  value={form.motherOccupation}
                  onChange={(e) => updateField('motherOccupation', e.target.value)}
                  placeholder="Occupation"
                />
              </div>
            </div>

            <hr className="my-2" />

            <h3 className="font-semibold text-purple-700">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Emergency Contact Name *</Label>
                <Input
                  value={form.emergencyContactName}
                  onChange={(e) => updateField('emergencyContactName', e.target.value)}
                  placeholder="Contact name"
                />
              </div>
              <div>
                <Label>Emergency Contact Phone *</Label>
                <Input
                  value={form.emergencyContactPhone}
                  onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                  placeholder="Contact phone"
                />
              </div>
            </div>

            <div>
              <Label>Address *</Label>
              <Textarea
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Full address"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Medical & Additional ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Allergies</Label>
              <Textarea
                value={form.allergies}
                onChange={(e) => updateField('allergies', e.target.value)}
                placeholder="List any known allergies..."
                rows={2}
              />
            </div>
            <div>
              <Label>Medical Conditions</Label>
              <Textarea
                value={form.conditions}
                onChange={(e) => updateField('conditions', e.target.value)}
                placeholder="Any medical conditions..."
                rows={2}
              />
            </div>
            <div>
              <Label>Medications</Label>
              <Textarea
                value={form.medications}
                onChange={(e) => updateField('medications', e.target.value)}
                placeholder="Current medications..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Vaccination Status</Label>
                <Select value={form.vaccinationStatus} onValueChange={(v) => updateField('vaccinationStatus', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETE">Complete</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="UNKNOWN">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Doctor&apos;s Name</Label>
                <Input
                  value={form.doctorName}
                  onChange={(e) => updateField('doctorName', e.target.value)}
                  placeholder="Doctor's name"
                />
              </div>
              <div>
                <Label>Doctor&apos;s Phone</Label>
                <Input
                  value={form.doctorPhone}
                  onChange={(e) => updateField('doctorPhone', e.target.value)}
                  placeholder="Doctor's phone"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={form.medicalNotes}
                onChange={(e) => updateField('medicalNotes', e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* ── Navigation Buttons ── */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <Button
              onClick={handleNext}
              className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            >
              {submitting ? 'Creating...' : 'Create Student'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
