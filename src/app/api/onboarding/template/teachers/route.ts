import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = requireAdmin(request);
  if (user instanceof NextResponse) return user;

  const csv = 'firstName,lastName,email,phone,qualification,specialization,branchCode\n';

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="teachers_template.csv"',
    },
  });
}
