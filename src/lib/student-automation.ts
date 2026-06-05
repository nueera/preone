import { db } from '@/lib/db';
import { hashPasswordSync } from '@/lib/auth';

/**
 * Generate a unique roll number (seat number) for a student.
 * Format: {class-name-abbreviated}-{sequential-3-digit}
 * e.g., "NUR-001", "LKG-012", "PKG-003", "GR1-005"
 */
export async function generateRollNumber(classId: string | null, schoolId: string): Promise<string> {
  if (!classId) {
    // No class assigned — generate school-wide sequential number
    const count = await db.student.count({
      where: { branch: { schoolId } },
    });
    return `STU-${String(count + 1).padStart(3, '0')}`;
  }

  const cls = await db.class.findUnique({ where: { id: classId } });
  const className = cls?.name || 'CLS';

  // Abbreviate class name for roll number prefix
  const prefix = className
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase();

  // Count existing students in this class
  const existingCount = await db.student.count({
    where: { classId },
  });

  return `${prefix}-${String(existingCount + 1).padStart(3, '0')}`;
}

/**
 * Generate a unique username for a parent based on student name.
 * Format: {student-firstname}.{student-lastname}.parent
 * If taken, append a number: {student-firstname}.{student-lastname}.parent2
 *
 * All lowercase, spaces removed, special chars removed.
 */
export async function generateParentUsername(
  studentFirstName: string,
  studentLastName: string,
): Promise<string> {
  const sanitize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, '');

  const base = `${sanitize(studentFirstName)}.${sanitize(studentLastName)}.parent`;

  let username = base;
  let counter = 2;

  while (true) {
    const existing = await db.user.findUnique({ where: { username } });
    if (!existing) break;
    username = `${base}${counter}`;
    counter++;
  }

  return username;
}

/**
 * Auto-create a parent portal User account.
 * - Username: generated from student name
 * - Password: parent's phone number (plain text input, hashed for storage)
 * - Email: auto-generated if not provided
 * - Role: PARENT
 *
 * Returns the created credentials info.
 */
export async function autoCreateParentAccount(params: {
  studentFirstName: string;
  studentLastName: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string | null;
  schoolId: string;
  branchId?: string | null;
}): Promise<{ userId: string; username: string; password: string; email: string }> {
  const { studentFirstName, studentLastName, parentName, parentPhone, parentEmail, schoolId, branchId } = params;

  const username = await generateParentUsername(studentFirstName, studentLastName);

  // Password is the parent's phone number (digits only for clean login)
  const password = parentPhone.replace(/\D/g, '') || '1234567890';
  const hashedPassword = hashPasswordSync(password);

  // Auto-generate email if not provided
  const email = parentEmail?.trim()
    ? parentEmail.trim().toLowerCase()
    : `${username}@parent.preone.app`;

  // Check if a user with this email already exists
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    // User already exists — just return their info, don't create duplicate
    return {
      userId: existingUser.id,
      username: existingUser.username || username,
      password: '(existing account)',
      email: existingUser.email,
    };
  }

  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword,
      name: parentName,
      phone: parentPhone,
      username,
      role: 'PARENT',
      schoolId,
      branchId: branchId || null,
      isActive: true,
    },
  });

  return {
    userId: user.id,
    username,
    password,
    email,
  };
}
