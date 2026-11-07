import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { generatePDF } from '@/lib/pdf-generator';
import { generateExcel } from '@/lib/excel-generator';

// POST /api/reports/export — Generate PDF or Excel export
export async function POST(request: NextRequest) {
  try {
    const auth = getAuthUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, format, dateRange, data } = body;

    // type: 'attendance' | 'fee' | 'growth' | 'crm' | 'students' | 'daily-updates'
    // format: 'pdf' | 'excel'
    // data: { headers: string[], rows: any[][], title?: string, schoolName?: string }

    if (!type || !format || !data) {
      return NextResponse.json({ error: 'type, format, and data are required' }, { status: 400 });
    }

    if (!['pdf', 'excel'].includes(format)) {
      return NextResponse.json({ error: 'format must be pdf or excel' }, { status: 400 });
    }

    // Get school name
    let schoolName = 'PreOne School';
    if (auth.schoolId) {
      const school = await db.school.findUnique({ where: { id: auth.schoolId }, select: { name: true } });
      if (school) schoolName = school.name;
    }

    const config = {
      title: data.title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      schoolName,
      dateRange: {
        from: dateRange?.from || 'N/A',
        to: dateRange?.to || 'N/A',
      },
      generatedBy: auth.name || auth.email,
      type,
    };

    const table = {
      headers: data.headers || [],
      rows: data.rows || [],
      columnWidths: data.columnWidths,
      sheetName: type.charAt(0).toUpperCase() + type.slice(1),
    };

    let buffer: Buffer;
    let contentType: string;
    let extension: string;

    if (format === 'pdf') {
      buffer = await generatePDF(config, table);
      contentType = 'application/pdf';
      extension = 'pdf';
    } else {
      buffer = await generateExcel(config, table);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    }

    // Return as downloadable file
    const filename = `PreOne_${type}_report_${new Date().toISOString().split('T')[0]}.${extension}`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Report export error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
