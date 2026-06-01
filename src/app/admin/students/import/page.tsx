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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
            else if (!['Male', 'Female'].includes(val)) errors.push('Gender must be Male/Female');
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
    <div className="space-y-6">
      {/* ── Back Button ── */}
      <Button
        variant="ghost"
        className="gap-1 text-muted-foreground"
        onClick={() => router.push('/admin/students')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Students
      </Button>

      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Import Students
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file to bulk import students
        </p>
      </div>

      {/* ── Upload Area ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-500" />
            Upload CSV File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Download Template
          </Button>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
              dragOver
                ? 'border-purple-400 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              Drag & drop your CSV file here
            </p>
            <p className="text-xs text-muted-foreground mb-4">
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
            >
              Browse Files
            </Button>
            {file && (
              <p className="mt-3 text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{file.name}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Preview Table ── */}
      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Preview
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>First Name</TableHead>
                    <TableHead>Last Name</TableHead>
                    <TableHead>DOB</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={row._errors.length > 0 ? 'bg-red-50' : ''}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>{row.firstName || '—'}</TableCell>
                      <TableCell>{row.lastName || '—'}</TableCell>
                      <TableCell>{row.dob || '—'}</TableCell>
                      <TableCell>{row.gender || '—'}</TableCell>
                      <TableCell>{row.bloodGroup || '—'}</TableCell>
                      <TableCell>{row.className || '—'}</TableCell>
                      <TableCell>
                        {row._errors.length > 0 ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span className="text-xs">{row._errors.join(', ')}</span>
                          </div>
                        ) : (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Import Button */}
            {!importResult && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleImport}
                  disabled={importing || validRows.length === 0}
                  className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                >
                  {importing ? (
                    'Importing...'
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import {validRows.length} Students
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Result Summary ── */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Import Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
                <CheckCircle className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-emerald-700">{importResult.created}</p>
                <p className="text-xs text-emerald-600">Created</p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
                <AlertCircle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-amber-700">{importResult.skipped}</p>
                <p className="text-xs text-amber-600">Skipped</p>
              </div>
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-center">
                <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-700">{importResult.errors.length}</p>
                <p className="text-xs text-red-600">Errors</p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Error Details:</p>
                {importResult.errors.map((err, idx) => (
                  <div key={idx} className="text-xs text-red-600 flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5" />
                    Row {err.row}: {err.message}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.push('/admin/students')}>
                View Students
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setParsedData([]);
                  setImportResult(null);
                }}
              >
                Import More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
