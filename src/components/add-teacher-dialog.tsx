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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ── Types ──
interface ClassInfo {
  id: string;
  name: string;
  program: { id: string; name: string };
}

interface ProgramGroup {
  id: string;
  name: string;
  classes: { id: string; name: string; _count: { students: number } }[];
}

interface AddTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeacherCreated: () => void;
}

// ── Constants ──
const QUALIFICATIONS = ['B.Ed', 'D.Ed', 'M.Ed', 'B.El.Ed', 'Other'];
const SPECIALIZATIONS = ['Early Childhood', 'Montessori', 'Special Ed', 'Primary', 'Other'];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export function AddTeacherDialog({ open, onOpenChange, onTeacherCreated }: AddTeacherDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [programs, setPrograms] = useState<ProgramGroup[]>([]);

  // ── Form state ──
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: null as Date | null,
    gender: '',
    address: '',
    qualification: '',
    specialization: [] as string[],
    experience: 0,
    classId: '',
    joiningDate: new Date() as Date | null,
    salary: 0,
    photo: null as File | null,
    photoPreview: '',
  });

  // ── Fetch programs/classes ──
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
      setError('');
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dob: null,
        gender: '',
        address: '',
        qualification: '',
        specialization: [],
        experience: 0,
        classId: '',
        joiningDate: new Date(),
        salary: 0,
        photo: null,
        photoPreview: '',
      });
    }
  }, [open]);

  // ── Photo upload handler ──
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Photo must be less than 2MB');
        return;
      }
      setForm((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, photoPreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Toggle specialization ──
  const toggleSpecialization = (spec: string) => {
    setForm((prev) => ({
      ...prev,
      specialization: prev.specialization.includes(spec)
        ? prev.specialization.filter((s) => s !== spec)
        : [...prev.specialization, spec],
    }));
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!form.firstName || form.firstName.length < 2) {
      setError('First name is required (min 2 chars)');
      return;
    }
    if (!form.lastName || form.lastName.length < 2) {
      setError('Last name is required (min 2 chars)');
      return;
    }
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Valid email is required');
      return;
    }
    if (!form.phone || !/^\d{10}$/.test(form.phone)) {
      setError('Valid 10-digit phone number is required');
      return;
    }
    if (!form.dob) {
      setError('Date of birth is required');
      return;
    }
    // Must be 18+
    const age = (Date.now() - form.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) {
      setError('Teacher must be at least 18 years old');
      return;
    }
    if (!form.gender) {
      setError('Gender is required');
      return;
    }
    if (!form.address) {
      setError('Address is required');
      return;
    }
    if (!form.qualification) {
      setError('Qualification is required');
      return;
    }
    if (form.specialization.length === 0) {
      setError('At least one specialization is required');
      return;
    }
    if (!form.joiningDate) {
      setError('Joining date is required');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        dob: form.dob?.toISOString(),
        gender: form.gender,
        address: form.address,
        qualification: form.qualification,
        specialization: form.specialization.join(', '),
        experience: form.experience,
        classId: form.classId || undefined,
        joiningDate: form.joiningDate?.toISOString(),
        salary: form.salary || undefined,
        photo: form.photoPreview || undefined,
      };

      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create teacher');
      }

      onOpenChange(false);
      onTeacherCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Teacher</DialogTitle>
        </DialogHeader>

        {/* ── Error Message ── */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

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
              <Label htmlFor="photo" className="text-sm font-medium">Photo</Label>
              <p className="text-xs text-muted-foreground">Optional — JPG/PNG, max 2MB</p>
              <Input
                id="photo"
                type="file"
                accept="image/jpeg,image/png"
                className="mt-1 max-w-[200px] text-xs"
                onChange={handlePhotoChange}
              />
            </div>
          </div>

          {/* Name */}
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

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="teacher@school.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit phone"
                maxLength={10}
              />
            </div>
          </div>

          {/* DOB & Gender */}
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
                    disabled={(d) => {
                      const age = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                      return age < 18 || d > new Date();
                    }}
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
                  <RadioGroupItem value="Male" id="teacher-male" />
                  <Label htmlFor="teacher-male" className="cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Female" id="teacher-female" />
                  <Label htmlFor="teacher-female" className="cursor-pointer">Female</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label>Address *</Label>
            <Textarea
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Full address"
              rows={2}
            />
          </div>

          {/* Qualification & Specialization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Qualification *</Label>
              <Select value={form.qualification} onValueChange={(v) => updateField('qualification', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select qualification" />
                </SelectTrigger>
                <SelectContent>
                  {QUALIFICATIONS.map((q) => (
                    <SelectItem key={q} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Experience (years) *</Label>
              <Input
                type="number"
                min={0}
                value={form.experience}
                onChange={(e) => updateField('experience', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Specialization MultiSelect */}
          <div>
            <Label>Specialization *</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SPECIALIZATIONS.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => toggleSpecialization(spec)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                    form.specialization.includes(spec)
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Class & Joining Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Assigned Class</Label>
              <Select value={form.classId} onValueChange={(v) => updateField('classId', v === 'NONE' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No Assignment</SelectItem>
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
              <Label>Joining Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.joiningDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.joiningDate ? format(form.joiningDate, 'dd MMM yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.joiningDate || undefined}
                    onSelect={(d) => updateField('joiningDate', d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Monthly Salary */}
          <div>
            <Label>Monthly Salary (₹)</Label>
            <Input
              type="number"
              min={0}
              value={form.salary || ''}
              onChange={(e) => updateField('salary', parseFloat(e.target.value) || 0)}
              placeholder="Enter monthly salary"
            />
          </div>
        </div>

        {/* ── Submit Button ── */}
        <div className="flex items-center justify-end mt-6 pt-4 border-t gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            {submitting ? 'Creating...' : 'Create Teacher'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
