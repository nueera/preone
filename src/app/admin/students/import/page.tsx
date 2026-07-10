'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileUp,
  FileCheck2,
  FileWarning,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PORTAL_THEMES } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface ParsedRow {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup?: string;
  aadhaarNumber?: string;
  className?: string;
  rollNumber?: string;
  _errors: string[];
}

interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// ── CSV Template ──
const CSV_HEADERS = [
  'firstName',
  'lastName',
  'dob',
  'gender',
  'bloodGroup',
  'aadhaarNumber',
  'className',
  'rollNumber',
];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── KPI Card for Import Summary ──
function ImportStatCard({
  label,
  value,
  icon: Icon,
  accent,
  bg,
  ring,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
  bg: string;
  ring: string;
  loading?: boolean;
}) {
  return (
    <PreOneCard variant="strip" className="p-4 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--admin-text-muted)' }}>
            {label}
          </p>
          {loading ? (
            <div className="mt-2 h-7 w-12 animate-pulse rounded-md" style={{ background: 'var(--admin-surface-2)' }} />
          ) : (
            <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: accent }}>
              {value}
            </p>
          )}
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: bg, boxShadow: `inset 0 0 0 1px ${ring}` }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 h-0.5 w-full opacity-60"
        style={{ background: `linear-gradient(to right, ${accent}, transparent)` }}
      />
    </PreOneCard>
  );
}

export default function ImportStudentsPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Download Template ──
  const downloadTemplate = () => {
    const csv = CSV_HEADERS.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Parse CSV ──
  const parseCSV = useCallback((text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const errors: string[] = [];

      const row: ParsedRow = {
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        _errors: errors,
      };

      headers.forEach((header, idx) => {
        const val = values[idx] || '';
        switch (header) {
          case 'firstName':
            row.firstName = val;
            if (!val) errors.push('First name required');
            break;
          case 'lastName':
            row.lastName = val;
            if (!val) errors.push('Last name required');
            break;
          case 'dob':
            row.dob = val;
            if (!val) errors.push('DOB required');
            else if (isNaN(Date.parse(val))) errors.push('Invalid DOB format');
            break;
          case 'gender':
            row.gender = val;
            if (!val) errors.push('Gender required');
            else if (!['Male', 'Female', 'Other'].includes(val)) errors.push('Gender must be Male/Female/Other');
            break;
          case 'bloodGroup':
            row.bloodGroup = val;
            break;
          case 'aadhaarNumber':
            row.aadhaarNumber = val;
            break;
          case 'className':
            row.className = val;
            break;
          case 'rollNumber':
            row.rollNumber = val;
            break;
        }
      });

      rows.push(row);
    }

    return rows;
  }, []);

  // ── Handle File ──
  const handleFile = useCallback(
    async (f: File) => {
      setFile(f);
      setParsing(true);
      setImportResult(null);

      try {
        const text = await f.text();
        const rows = parseCSV(text);
        setParsedData(rows);
      } catch (err) {
        console.error('Parse error:', err);
      } finally {
        setParsing(false);
      }
    },
    [parseCSV]
  );

  // ── Drop handler ──
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      handleFile(f);
    }
  };

  // ── Import ──
  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      const token = getToken();
      // Filter out rows with errors
      const validData = parsedData
        .filter((row) => row._errors.length === 0)
        .map(({ _errors, ...rest }) => rest);

      const res = await fetch('/api/students/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: validData }),
      });

      if (res.ok) {
        const result = await res.json();
        setImportResult(result);
      } else {
        const data = await res.json();
        console.error('Import failed:', data.error);
      }
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  const validRows = parsedData.filter((r) => r._errors.length === 0);
  const errorRows = parsedData.filter((r) => r._errors.length > 0);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6 max-w-[1440px] mx-auto">
        {/* ── Back Button ── */}
        <StaggerItem>
          <Button
            variant="ghost"
            className="gap-1.5"
            style={{ color: 'var(--admin-text-muted)' }}
            onClick={() => router.push('/admin/students')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Students
          </Button>
        </StaggerItem>

        {/* ── Header ── */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'var(--admin-primary-soft)' }}
              >
                <Upload className="h-5 w-5" style={{ color: 'var(--admin-primary)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>
                  Import Students
                </h1>
                <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                  Upload a CSV file to bulk import students
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </StaggerItem>

        {/* ── KPI Summary (only after parsing) ── */}
        {parsedData.length > 0 && !importResult && (
          <StaggerItem>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ImportStatCard
                label="Total Rows"
                value={parsedData.length}
                icon={FileUp}
                accent="var(--admin-primary)"
                bg="var(--admin-primary-soft)"
                ring="var(--admin-primary)"
              />
              <ImportStatCard
                label="Valid"
                value={validRows.length}
                icon={FileCheck2}
                accent="var(--admin-success)"
                bg="var(--admin-success-soft)"
                ring="var(--admin-success)"
              />
              <ImportStatCard
                label="Errors"
                value={errorRows.length}
                icon={FileWarning}
                accent="var(--admin-error)"
                bg="var(--admin-error-soft)"
                ring="var(--admin-error)"
              />
            </div>
          </StaggerItem>
        )}

        {/* ── Upload Area ── */}
        {!importResult && (
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" style={{ color: theme.primary }} />
                  <h3 className="font-semibold" style={{ color: 'var(--admin-text)' }}>
                    {parsedData.length > 0 ? 'Replace File' : 'Upload CSV File'}
                  </h3>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className="rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center transition-all"
                  style={{
                    borderColor: dragOver ? 'var(--admin-primary)' : 'var(--admin-border)',
                    background: dragOver ? 'var(--admin-primary-soft)' : 'var(--admin-surface-2)',
                  }}
                >
                  <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--admin-surface)' }}
                  >
                    {parsing ? (
                      <Loader2 className="h-6 w-6 animate-spin" style={{ color: theme.primary }} />
                    ) : (
                      <Upload className="h-6 w-6" style={{ color: 'var(--admin-text-muted)' }} />
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--admin-text)' }}>
                    {parsing ? 'Parsing file…' : 'Drag & drop your CSV file here'}
                  </p>
                  <p className="text-xs mb-4" style={{ color: 'var(--admin-text-subtle)' }}>
                    or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="csv-upload"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Browse Files
                  </Button>
                  {file && (
                    <p className="mt-3 text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                      Selected: <span className="font-medium" style={{ color: 'var(--admin-text)' }}>{file.name}</span>
                    </p>
                  )}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        )}

        {/* ── Preview Table ── */}
        {parsedData.length > 0 && !importResult && (
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--admin-text)' }}>
                    <FileSpreadsheet className="h-4 w-4" style={{ color: theme.primary }} />
                    Preview
                  </h3>
                  <div className="flex gap-1.5">
                    <Badge variant="secondary">{parsedData.length} rows</Badge>
                    {validRows.length > 0 && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {validRows.length} valid
                      </Badge>
                    )}
                    {errorRows.length > 0 && (
                      <Badge className="bg-red-50 text-red-700 border-red-200">
                        {errorRows.length} errors
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--admin-border)' }}>
                  <Table>
                    <TableHeader>
                      <TableRow style={{ background: 'var(--admin-surface-2)' }}>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>First Name</TableHead>
                        <TableHead>Last Name</TableHead>
                        <TableHead>DOB</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Blood Group</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, idx) => (
                        <TableRow
                          key={idx}
                          className={row._errors.length > 0 ? 'bg-red-50/50 dark:bg-red-950/20' : ''}
                        >
                          <TableCell className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                            {idx + 1}
                          </TableCell>
                          <TableCell className="text-sm" style={{ color: 'var(--admin-text)' }}>{row.firstName || '—'}</TableCell>
                          <TableCell className="text-sm" style={{ color: 'var(--admin-text)' }}>{row.lastName || '—'}</TableCell>
                          <TableCell className="text-sm" style={{ color: 'var(--admin-text)' }}>{row.dob || '—'}</TableCell>
                          <TableCell className="text-sm" style={{ color: 'var(--admin-text)' }}>{row.gender || '—'}</TableCell>
                          <TableCell className="text-sm" style={{ color: 'var(--admin-text)' }}>{row.bloodGroup || '—'}</TableCell>
                          <TableCell className="text-sm" style={{ color: 'var(--admin-text)' }}>{row.className || '—'}</TableCell>
                          <TableCell>
                            {row._errors.length > 0 ? (
                              <div className="flex items-center gap-1.5" style={{ color: 'var(--admin-error)' }}>
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-xs">{row._errors.join(', ')}</span>
                              </div>
                            ) : (
                              <CheckCircle className="h-4 w-4" style={{ color: 'var(--admin-success)' }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleImport}
                    disabled={importing || validRows.length === 0}
                    className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                  >
                    {importing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Importing…
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Import {validRows.length} Students
                      </>
                    )}
                  </Button>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        )}

        {/* ── Result Summary ── */}
        {importResult && (
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--admin-success)' }} />
                  <h3 className="font-semibold" style={{ color: 'var(--admin-text)' }}>Import Results</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <ImportStatCard
                    label="Created"
                    value={importResult.created}
                    icon={CheckCircle}
                    accent="var(--admin-success)"
                    bg="var(--admin-success-soft)"
                    ring="var(--admin-success)"
                  />
                  <ImportStatCard
                    label="Skipped"
                    value={importResult.skipped}
                    icon={AlertCircle}
                    accent="var(--admin-orange)"
                    bg="var(--admin-orange-soft)"
                    ring="var(--admin-orange)"
                  />
                  <ImportStatCard
                    label="Errors"
                    value={importResult.errors.length}
                    icon={XCircle}
                    accent="var(--admin-error)"
                    bg="var(--admin-error-soft)"
                    ring="var(--admin-error)"
                  />
                </div>

                {importResult.errors.length > 0 && (
                  <div
                    className="space-y-2 rounded-xl p-3"
                    style={{ background: 'var(--admin-error-soft)' }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--admin-error)' }}>
                      Error Details
                    </p>
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs" style={{ color: 'var(--admin-error)' }}>
                        <XCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Row {err.row}: {err.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setParsedData([]);
                      setImportResult(null);
                    }}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Import More
                  </Button>
                  <Button
                    onClick={() => router.push('/admin/students')}
                    className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                  >
                    View Students
                  </Button>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        )}
      </StaggerContainer>
    </PageTransition>
  );
}
