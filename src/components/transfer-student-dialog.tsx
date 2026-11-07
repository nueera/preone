'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  status: string;
}

interface TransferStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student;
  onTransferred: () => void;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export function TransferStudentDialog({
  open,
  onOpenChange,
  student,
  onTransferred,
}: TransferStudentDialogProps) {
  const [transferType, setTransferType] = useState('');
  const [transferDate, setTransferDate] = useState<Date | null>(new Date());
  const [reason, setReason] = useState('');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setTransferType('');
      setTransferDate(new Date());
      setReason('');
      setNewSchoolName('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!transferType) {
      setError('Please select a transfer type');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const token = getToken();
      const statusMap: Record<string, string> = {
        TRANSFER: 'TRANSFERRED',
        GRADUATE: 'GRADUATED',
        DEACTIVATE: 'INACTIVE',
      };

      const res = await fetch(`/api/students/${student.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: statusMap[transferType],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update student');
      }

      onOpenChange(false);
      onTransferred();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Transfer / Graduate Student
          </DialogTitle>
          <DialogDescription>
            Update status for {student.firstName} {student.lastName}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Transfer Type *</Label>
            <Select value={transferType} onValueChange={setTransferType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRANSFER">Transfer Out</SelectItem>
                <SelectItem value="GRADUATE">Graduate</SelectItem>
                <SelectItem value="DEACTIVATE">Deactivate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Transfer Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !transferDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {transferDate ? format(transferDate, 'dd MMM yyyy') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={transferDate || undefined}
                  onSelect={setTransferDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {transferType === 'TRANSFER' && (
            <div>
              <Label>New School Name</Label>
              <Input
                value={newSchoolName}
                onChange={(e) => setNewSchoolName(e.target.value)}
                placeholder="Enter new school name"
              />
            </div>
          )}

          <div>
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for transfer/graduation..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            {submitting ? 'Updating...' : 'Confirm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
