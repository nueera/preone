import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// POST /api/students/bulk-import — Bulk import students from CSV data
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const body = await request.json();
    const { data } = body;

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No data provided for import' },
        { status: 400 }
      );
    }

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as { row: number; message: string }[],
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 for header row and 0-index

      try {
        // Validate required fields
        if (!row.firstName || !row.lastName || !row.dob || !row.gender) {
          results.errors.push({
            row: rowNum,
            message: 'Missing required fields (firstName, lastName, dob, gender)',
          });
          results.skipped++;
          continue;
        }

        // Check for duplicate by name + dob
        const existing = await db.student.findFirst({
          where: {
            firstName: row.firstName,
            lastName: row.lastName,
            dob: new Date(row.dob),
          },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Resolve classId from className if needed
        let classId = row.classId || null;
        if (!classId && row.className) {
          const cls = await db.class.findFirst({
            where: { name: { contains: row.className } },
          });
          classId = cls?.id || null;
        }

        // Create student
        await db.student.create({
          data: {
            firstName: row.firstName,
            lastName: row.lastName,
            dob: new Date(row.dob),
            gender: row.gender,
            bloodGroup: row.bloodGroup || null,
            aadhaarNumber: row.aadhaarNumber || null,
            classId,
            branchId: row.branchId || null,
            rollNumber: row.rollNumber || null,
            admissionDate: row.admissionDate ? new Date(row.admissionDate) : new Date(),
            status: 'ACTIVE',
          },
        });

        results.created++;
      } catch (err) {
        results.errors.push({
          row: rowNum,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
