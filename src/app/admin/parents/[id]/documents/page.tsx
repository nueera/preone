'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  FileText,
  ShieldCheck,
  Clock,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  ImageIcon,
  File,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PORTAL_THEMES } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface Document {
  id: string;
  name: string;
  type: 'ID Proof' | 'Address Proof' | 'Health' | 'Academic' | 'Financial' | 'Other';
  fileType: 'PDF' | 'Image' | 'DOC';
  uploadedDate: string;
  uploadedBy: string;
  status: 'Verified' | 'Pending' | 'Rejected' | 'Not Submitted';
  size: string;
  verifiedBy?: string;
  verifiedDate?: string;
  rejectionReason?: string;
}

// ── Placeholder data ──
const PLACEHOLDER_DOCUMENTS: Document[] = [
  { id: 'd1', name: 'Aadhaar Card — Father', type: 'ID Proof', fileType: 'PDF', uploadedDate: '15 Jan 2026', uploadedBy: 'Rajesh Kumar', status: 'Verified', size: '1.2 MB', verifiedBy: 'Admin', verifiedDate: '16 Jan 2026' },
  { id: 'd2', name: 'Aadhaar Card — Mother', type: 'ID Proof', fileType: 'PDF', uploadedDate: '15 Jan 2026', uploadedBy: 'Rajesh Kumar', status: 'Verified', size: '980 KB', verifiedBy: 'Admin', verifiedDate: '16 Jan 2026' },
  { id: 'd3', name: 'Address Proof (Utility Bill)', type: 'Address Proof', fileType: 'Image', uploadedDate: '15 Jan 2026', uploadedBy: 'Rajesh Kumar', status: 'Verified', size: '2.1 MB', verifiedBy: 'Admin', verifiedDate: '17 Jan 2026' },
  { id: 'd4', name: 'PAN Card', type: 'ID Proof', fileType: 'PDF', uploadedDate: '18 Jan 2026', uploadedBy: 'Rajesh Kumar', status: 'Pending', size: '450 KB' },
  { id: 'd5', name: 'Child Birth Certificate — Aarav', type: 'Academic', fileType: 'PDF', uploadedDate: '20 Jan 2026', uploadedBy: 'Admin', status: 'Verified', size: '670 KB', verifiedBy: 'Admin', verifiedDate: '21 Jan 2026' },
  { id: 'd6', name: 'Medical Certificate', type: 'Health', fileType: 'Image', uploadedDate: '20 Feb 2026', uploadedBy: 'Rajesh Kumar', status: 'Pending', size: '3.4 MB' },
  { id: 'd7', name: 'Passport Size Photo — Father', type: 'Other', fileType: 'Image', uploadedDate: '22 Jan 2026', uploadedBy: 'Rajesh Kumar', status: 'Rejected', size: '520 KB', rejectionReason: 'Photo is blurry. Please upload a clearer image.' },
];

const STATUS_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  Verified: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  Pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3.5 w-3.5" /> },
  Rejected: { bg: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="h-3.5 w-3.5" /> },
  'Not Submitted': { bg: 'bg-gray-50 text-gray-600 border-gray-200', icon: <AlertCircle className="h-3.5 w-3.5" /> },
};

const FILETYPE_COLORS: Record<string, string> = {
  PDF: 'bg-red-50 text-red-600',
  Image: 'bg-sky-50 text-sky-600',
  DOC: 'bg-violet-50 text-violet-600',
};

const FILETYPE_ICONS: Record<string, React.ReactNode> = {
  PDF: <FileText className="h-5 w-5" />,
  Image: <ImageIcon className="h-5 w-5" />,
  DOC: <File className="h-5 w-5" />,
};

export default function ParentDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const parentId = params.id as string;

  const parentName = 'Rajesh Kumar';
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const verifiedCount = PLACEHOLDER_DOCUMENTS.filter((d) => d.status === 'Verified').length;
  const pendingCount = PLACEHOLDER_DOCUMENTS.filter((d) => d.status === 'Pending').length;
  const rejectedCount = PLACEHOLDER_DOCUMENTS.filter((d) => d.status === 'Rejected').length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Back Button ── */}
        <Button
          variant="ghost"
          className="gap-1 text-muted-foreground"
          onClick={() => router.push(`/admin/parents/${parentId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {parentName}
        </Button>

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Documents
            </h1>
            <p className="text-sm text-muted-foreground">
              Uploaded documents for {parentName}
            </p>
          </div>
          <Button
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Total Documents"
            value={PLACEHOLDER_DOCUMENTS.length}
            icon={<FileText className="h-5 w-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Verified"
            value={verifiedCount}
            icon={<ShieldCheck className="h-5 w-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Pending Review"
            value={pendingCount}
            icon={<Clock className="h-5 w-5" />}
            color="bg-amber-500"
          />
          <CosmicStatCard
            label="Rejected"
            value={rejectedCount}
            icon={<XCircle className="h-5 w-5" />}
            color="bg-red-500"
          />
        </div>

        {/* ── Documents Table ── */}
        <PreOneCard variant="default">
          <PreOneCardContent>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-portal-500" />
              All Documents
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Type</TableHead>
                    <TableHead>Document</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PLACEHOLDER_DOCUMENTS.map((doc) => (
                    <TableRow key={doc.id} className="table-row-preone">
                      <TableCell>
                        <div className={`flex items-center justify-center h-9 w-9 rounded-lg ${FILETYPE_COLORS[doc.fileType]}`}>
                          {FILETYPE_ICONS[doc.fileType]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.fileType} · By {doc.uploadedBy}
                          </p>
                          {doc.status === 'Rejected' && doc.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">
                              Reason: {doc.rejectionReason}
                            </p>
                          )}
                          {doc.status === 'Verified' && doc.verifiedBy && (
                            <p className="text-xs text-emerald-600 mt-0.5">
                              Verified by {doc.verifiedBy} on {doc.verifiedDate}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{doc.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{doc.uploadedDate}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{doc.size}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_STYLES[doc.status].bg}`}>
                          {STATUS_STYLES[doc.status].icon}
                          {doc.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          {doc.status === 'Pending' && (
                            <>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700">
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PreOneCardContent>
        </PreOneCard>

        {/* ── Required Documents Checklist ── */}
        <PreOneCard variant="default">
          <PreOneCardContent>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-portal-500" />
              Required Documents Checklist
            </h3>
            <div className="space-y-2">
              {[
                { name: 'Aadhaar Card (Parent)', required: true, status: 'Verified' },
                { name: 'Address Proof', required: true, status: 'Verified' },
                { name: 'PAN Card', required: false, status: 'Pending' },
                { name: 'Child Birth Certificate', required: true, status: 'Verified' },
                { name: 'Medical Certificate', required: true, status: 'Pending' },
                { name: 'Passport Size Photo', required: true, status: 'Rejected' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    {item.status === 'Verified' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : item.status === 'Rejected' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                    <span className="text-sm">{item.name}</span>
                    {item.required && (
                      <Badge variant="secondary" className="text-[10px]">Required</Badge>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_STYLES[item.status as keyof typeof STATUS_STYLES]?.bg || ''}`}>
                    {STATUS_STYLES[item.status as keyof typeof STATUS_STYLES]?.icon}
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </PreOneCardContent>
        </PreOneCard>

        {/* ── Upload Dialog ── */}
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-portal-400 transition-colors cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, Image, DOC up to 10MB</p>
              </div>
              <Button className="w-full bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
                Upload Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
