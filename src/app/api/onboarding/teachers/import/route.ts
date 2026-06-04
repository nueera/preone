import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, hashPasswordSync } from '@/lib/auth';
import { db } from '@/lib/db';
import { generatePassword } from '../../_helpers';

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n');
  return lines.map((line) => line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')));
}

export async function POST(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const schoolId = user.schoolId;
  if (!schoolId) {
    return NextResponse.json({ error: 'No school associated with this account' }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text);

  if (rows.length < 2) {
    return NextResponse.json({ error: 'CSV file must contain a header row and at least one data row' }, { status: 400 });
  }

  const [_header, ...dataRows] = rows;
  const errors: { row: number; message: string }[] = [];
  let imported = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (row.length < 4 || !row[0]) {
      errors.push({ row: i + 2, message: 'Missing required fields (firstName, lastName, email, phone)' });
      continue;
    }

    const [firstName, lastName, email, phone, qualification, specialization, branchCode] = row;

    if (!firstName || !lastName || !email || !phone) {
      errors.push({ row: i + 2, message: 'Missing required fields' });
      continue;
    }

    try {
      // Find branch by code
      let branchId: string | null = null;
      if (branchCode) {
        const branch = await db.branch.findFirst({ where: { schoolId, code: branchCode } });
        if (!branch) {
          errors.push({ row: i + 2, message: `Branch code "${branchCode}" not found` });
          continue;
        }
        branchId = branch.id;
      }

      // Check for duplicate email
      const existing = await db.user.findUnique({ where: { email } });
      if (existing) {
        errors.push({ row: i + 2, message: `Email "${email}" already exists` });
        continue;
      }

      const password = generatePassword();
      const hashedPassword = hashPasswordSync(password);

      const teacherUser = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          phone,
          role: 'TEACHER',
          schoolId,
          branchId,
        },
      });

      await db.teacher.create({
        data: {
          userId: teacherUser.id,
          firstName,
          lastName,
          email,
          phone,
          qualification: qualification || null,
          specialization: specialization || null,
          branchId,
        },
      });

      imported++;
    } catch (err) {
      errors.push({ row: i + 2, message: `Failed to import: ${err instanceof Error ? err.message : 'Unknown error'}` });
    }
  }

  return NextResponse.json({ imported, errors });
}
