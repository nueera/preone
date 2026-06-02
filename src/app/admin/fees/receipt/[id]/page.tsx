'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface ReceiptData {
  id: string;
  receiptNo: string;
  amount: number;
  createdAt: string;
  invoice: {
    id: string;
    invoiceNo: string;
    amount: number;
    discount: number;
    netAmount: number;
    description: string | null;
    student: {
      id: string;
      firstName: string;
      lastName: string;
      rollNumber: string | null;
      class: { name: string } | null;
      parents: { isPrimary: boolean; parent: { firstName: string; lastName: string } }[];
    };
  };
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = params.id as string;

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReceipt = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/fees/invoices?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Find invoice with this receipt
        const invoice = (data.invoices || []).find((inv: { receipt: { id: string } | null }) => inv.receipt?.id === receiptId);
        if (invoice?.receipt) {
          setReceipt({ ...invoice.receipt, invoice });
        }
      }
    } catch (err) {
      console.error('Fetch receipt error:', err);
    } finally {
      setLoading(false);
    }
  }, [receiptId]);

  useEffect(() => {
    fetchReceipt();
  }, [fetchReceipt]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto mt-8 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Receipt not found</p>
        <Button variant="outline" onClick={() => router.push('/admin/fees')}>Back to Fees</Button>
      </div>
    );
  }

  const primaryParent = receipt.invoice.student.parents?.find(p => p.isPrimary)?.parent;

  return (
    <div className="max-w-lg mx-auto mt-4 space-y-4 print:mt-0">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" className="gap-1 text-muted-foreground" onClick={() => router.push('/admin/fees')}>
          <ArrowLeft className="h-4 w-4" /> Back to Fees
        </Button>
        <Button variant="outline" className="gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Print Receipt
        </Button>
      </div>

      <Card className="print:shadow-none print:border-gray-300">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-purple-700">PreOne Preschool</h1>
            <p className="text-sm text-muted-foreground">Fee Receipt</p>
          </div>

          <Separator />

          {/* Receipt Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Receipt No</p>
              <p className="font-medium">{receipt.receiptNo}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">{format(new Date(receipt.createdAt), 'dd MMM yyyy')}</p>
            </div>
          </div>

          <Separator />

          {/* Student Info */}
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Student Name</p>
                <p className="font-medium">{receipt.invoice.student.firstName} {receipt.invoice.student.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Class</p>
                <p className="font-medium">{receipt.invoice.student.class?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Parent Name</p>
                <p className="font-medium">{primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Invoice No</p>
                <p className="font-medium">{receipt.invoice.invoiceNo}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fee Details */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fee</span>
              <span>₹{receipt.invoice.amount.toLocaleString('en-IN')}</span>
            </div>
            {receipt.invoice.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>-₹{receipt.invoice.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Paid</span>
              <span className="text-purple-700">₹{receipt.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <Separator />

          {/* Signatory */}
          <div className="pt-8">
            <div className="border-t border-gray-400 pt-2 w-48 ml-auto text-center">
              <p className="text-xs text-muted-foreground">Authorized Signatory</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
