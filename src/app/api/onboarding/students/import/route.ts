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
      errors.push({ row: i + 2, message: 'Missing required fields (firstName, lastName, dob, gender)' });
      continue;
    }

    const [firstName, lastName, dob, gender, classCode, bloodGroup, fatherName, fatherPhone, motherName, motherPhone, parentEmail] = row;

    if (!firstName || !lastName || !dob || !gender) {
      errors.push({ row: i + 2, message: 'Missing required fields (firstName, lastName, dob, gender)' });
      continue;
    }

    // Validate date
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      errors.push({ row: i + 2, message: `Invalid date format: "${dob}". Use YYYY-MM-DD` });
      continue;
    }

    try {
      // Find class by name/code
      let classId: string | null = null;
      let branchId: string | null = null;
      if (classCode) {
        const cls = await db.class.findFirst({
          where: { name: classCode },
          include: { branch: true },
        });
        if (cls) {
          classId = cls.id;
          branchId = cls.branchId;
        }
      }

      // Create Student
      const student = await db.student.create({
        data: {
          firstName,
          lastName,
          dob: dobDate,
          gender,
          bloodGroup: bloodGroup || null,
          classId,
          branchId,
        },
      });

      // Create Parent records if info provided
      if (fatherName && fatherPhone) {
        const father = await db.parent.create({
          data: {
            firstName: fatherName,
            lastName,
            phone: fatherPhone,
            email: parentEmail || null,
            relation: 'FATHER',
            isEmergencyContact: true,
          },
        });

        await db.studentParent.create({
          data: { studentId: student.id, parentId: father.id, isPrimary: true },
        });

        // Create User for parent if email exists
        if (parentEmail) {
          const existingUser = await db.user.findUnique({ where: { email: parentEmail } });
          if (!existingUser) {
            const password = generatePassword();
            const hashedPassword = hashPasswordSync(password);
            await db.user.create({
              data: {
                email: parentEmail,
                password: hashedPassword,
                name: `${fatherName} ${lastName}`,
                phone: fatherPhone,
                role: 'PARENT',
                schoolId,
              },
            });
          }
        }
      }

      if (motherName && motherPhone) {
        const motherEmail = fatherName ? null : parentEmail || null;
        const mother = await db.parent.create({
          data: {
            firstName: motherName,
            lastName,
            phone: motherPhone,
            email: motherEmail,
            relation: 'MOTHER',
            isEmergencyContact: !fatherName,
          },
        });

        await db.studentParent.create({
          data: { studentId: student.id, parentId: mother.id, isPrimary: !fatherName },
        });
      }

      imported++;
    } catch (err) {
      errors.push({ row: i + 2, message: `Failed to import: ${err instanceof Error ? err.message : 'Unknown error'}` });
    }
  }

  return NextResponse.json({ imported, errors });
}
