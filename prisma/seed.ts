// ============================================================
// PreOne — Seed Script (New 52-Model Schema)
// Populates the database with realistic Indian preschool demo data
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

// ============================================================
// HELPERS
// ============================================================

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function today(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function utcDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
}

const CURRENT_PERIOD = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
const CURRENT_QUARTER = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

// ============================================================
// MAIN SEED
// ============================================================

async function main() {
  console.log('🌱 Starting PreOne seed (new schema)...');

  // Clean existing data (order matters for foreign keys)
  console.log('  Cleaning existing data...');
  const models = [
    'auditLog', 'report', 'notification', 'milestoneTimeline', 'milestone',
    'certificate', 'achievement', 'memory', 'aIObservation', 'growthScore',
    'observation', 'dailyUpdate', 'feeReminder', 'refund', 'receipt',
    'payment', 'invoice', 'feeStructure', 'staffAttendance', 'studentAttendance',
    'followUp', 'lead', 'pickupDrop', 'vehicle', 'driver', 'route',
    'announcement', 'message', 'chatParticipant', 'chatThread', 'activity',
    'event', 'holiday', 'workSchedule', 'teacherQualification', 'performanceReview',
    'salaryRecord', 'leave', 'studentParent', 'sibling', 'medicalRecord',
    'student', 'section', 'class', 'program', 'teacher', 'parent',
    'otp', 'user', 'schoolSetting', 'branch', 'school',
  ] as const;

  for (const model of models) {
    try {
      await (prisma as any)[model].deleteMany();
    } catch {
      // skip if model doesn't exist
    }
  }
  console.log('  ✓ Cleaned existing data');

  // ============================================================
  // 1. SCHOOL & BRANCHES
  // ============================================================
  console.log('  Creating School & Branches...');
  const school = await prisma.school.create({
    data: {
      name: 'Little Stars Preschool',
      address: 'FC Road, Shivajinagar, Pune, Maharashtra 411005',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411005',
      phone: '+91 20 2613 4567',
      email: 'info@littlestars.com',
      website: 'https://littlestars.com',
      academicYear: '2024-2025',
      board: 'CBSE',
      schoolCode: 'LSP-001',
    },
  });

  const branchMain = await prisma.branch.create({
    data: {
      schoolId: school.id,
      name: 'Main Campus',
      address: '42, Koregaon Park Road, Near MGF Mall, Pune 411001',
      phone: '+91 20 2613 4567',
      capacity: 200,
      inChargeName: 'Sunil Mehta',
      inChargePhone: '+91 98200 12345',
      isActive: true,
    },
  });

  const branchCity = await prisma.branch.create({
    data: {
      schoolId: school.id,
      name: 'City Center',
      address: '15, M.G. Road, Camp, Pune 411001',
      phone: '+91 20 2643 8901',
      capacity: 150,
      inChargeName: 'Anita Deshmukh',
      inChargePhone: '+91 98200 67890',
      isActive: true,
    },
  });
  console.log('  ✓ School & 2 Branches created');

  // ============================================================
  // 2. USERS (Admin, Teachers, Parents)
  // ============================================================
  console.log('  Creating Users...');
  const passwordHash = await hashPassword('password123');

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@preone.com',
      password: passwordHash,
      name: 'Admin User',
      phone: '+91 99000 00001',
      role: 'ADMIN',
      isActive: true,
      schoolId: school.id,
      branchId: branchMain.id,
    },
  });

  // Teacher users
  const teacherUserData = [
    { name: 'Kavitha Raman', email: 'kavitha.raman@littlestars.com', phone: '+91 98123 45670' },
    { name: 'Priya Nair', email: 'priya.nair@littlestars.com', phone: '+91 87234 56789' },
  ];

  const teacherUsers: { name: string; email: string; phone: string; userId: string }[] = [];
  for (const td of teacherUserData) {
    const user = await prisma.user.create({
      data: {
        email: td.email,
        password: passwordHash,
        name: td.name,
        phone: td.phone,
        role: 'TEACHER',
        isActive: true,
        schoolId: school.id,
        branchId: branchMain.id,
      },
    });
    teacherUsers.push({ ...td, userId: user.id });
  }

  // Parent users
  const parentUserData = [
    { name: 'Rajesh Sharma', email: 'rajesh.sharma@email.com', phone: '+91 98765 43210' },
    { name: 'Anitha Kumar', email: 'anitha.kumar@email.com', phone: '+91 87654 32109' },
  ];

  const parentUsers: { name: string; email: string; phone: string; userId: string }[] = [];
  for (const pd of parentUserData) {
    const user = await prisma.user.create({
      data: {
        email: pd.email,
        password: passwordHash,
        name: pd.name,
        phone: pd.phone,
        role: 'PARENT',
        isActive: true,
        schoolId: school.id,
        branchId: branchMain.id,
      },
    });
    parentUsers.push({ ...pd, userId: user.id });
  }

  console.log(`  ✓ Created ${1 + teacherUsers.length + parentUsers.length} users`);

  // ============================================================
  // 3. PROGRAMS & CLASSES
  // ============================================================
  console.log('  Creating Programs & Classes...');
  const programDefs = [
    { name: 'PlayGroup', ageMin: 2, ageMax: 3, description: 'Foundation program for toddlers' },
    { name: 'Nursery', ageMin: 3, ageMax: 4, description: 'Pre-school readiness program' },
    { name: 'LKG', ageMin: 4, ageMax: 5, description: 'Lower Kindergarten' },
    { name: 'UKG', ageMin: 5, ageMax: 6, description: 'Upper Kindergarten' },
  ];

  const programRecords: { name: string; id: string }[] = [];
  for (const p of programDefs) {
    const prog = await prisma.program.create({
      data: {
        name: p.name,
        description: p.description,
        ageMin: p.ageMin,
        ageMax: p.ageMax,
        branchId: branchMain.id,
      },
    });
    programRecords.push({ name: p.name, id: prog.id });
  }

  // 6 classes: Nursery-A, Nursery-B, LKG-A, LKG-B, UKG-A, UKG-B
  const classDefs = [
    { name: 'Nursery-A', programName: 'Nursery', capacity: 30, roomNo: '201' },
    { name: 'Nursery-B', programName: 'Nursery', capacity: 30, roomNo: '202' },
    { name: 'LKG-A', programName: 'LKG', capacity: 35, roomNo: '301' },
    { name: 'LKG-B', programName: 'LKG', capacity: 35, roomNo: '302' },
    { name: 'UKG-A', programName: 'UKG', capacity: 40, roomNo: '401' },
    { name: 'UKG-B', programName: 'UKG', capacity: 40, roomNo: '402' },
  ];

  const classRecords: { name: string; id: string; programId: string }[] = [];
  for (const cd of classDefs) {
    const program = programRecords.find(p => p.name === cd.programName)!;
    const cls = await prisma.class.create({
      data: {
        name: cd.name,
        programId: program.id,
        branchId: branchMain.id,
        capacity: cd.capacity,
        roomNo: cd.roomNo,
      },
    });
    classRecords.push({ name: cd.name, id: cls.id, programId: program.id });
  }
  console.log('  ✓ 4 Programs & 6 Classes created');

  // ============================================================
  // 4. TEACHERS
  // ============================================================
  console.log('  Creating Teachers...');
  const teacherDetails = [
    { ...teacherUsers[0], firstName: 'Kavitha', lastName: 'Raman', qualification: 'PhD Early Education', specialization: 'Montessori Method', experience: 12, gender: 'Female' },
    { ...teacherUsers[1], firstName: 'Priya', lastName: 'Nair', qualification: 'M.Ed', specialization: 'Child Psychology', experience: 8, gender: 'Female' },
  ];

  const teacherRecords: { id: string; firstName: string; lastName: string; className?: string }[] = [];
  const classAssignments = ['Nursery-A', 'LKG-A']; // Assign teachers to classes

  for (let i = 0; i < teacherDetails.length; i++) {
    const td = teacherDetails[i];
    const assignedClassName = classAssignments[i];

    const teacher = await prisma.teacher.create({
      data: {
        userId: td.userId,
        branchId: branchMain.id,
        firstName: td.firstName,
        lastName: td.lastName,
        phone: td.phone,
        email: td.email,
        dob: new Date(1985 + randomInt(0, 10), randomInt(0, 11), randomInt(1, 28)),
        gender: td.gender,
        qualification: td.qualification,
        specialization: td.specialization,
        experience: td.experience,
        status: 'ACTIVE',
        salary: 35000 + i * 5000,
      },
    });

    teacherRecords.push({ id: teacher.id, firstName: td.firstName, lastName: td.lastName, className: assignedClassName });

    // Assign teacher to class
    if (assignedClassName) {
      const cls = classRecords.find(c => c.name === assignedClassName);
      if (cls) {
        await prisma.class.update({
          where: { id: cls.id },
          data: { teacherId: teacher.id },
        });
      }
    }

    // Teacher qualifications
    await prisma.teacherQualification.create({
      data: {
        teacherId: teacher.id,
        degree: td.qualification,
        institution: randomItem(['University of Pune', 'Mumbai University', 'Bharati Vidyapeeth']),
        year: 2010 + randomInt(0, 8),
      },
    });

    // Work schedule (Mon-Fri)
    for (let day = 1; day <= 5; day++) {
      await prisma.workSchedule.create({
        data: {
          teacherId: teacher.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '15:00',
        },
      });
    }
  }
  console.log('  ✓ 2 Teachers created with qualifications, schedules, class assignments');

  // ============================================================
  // 5. PARENTS
  // ============================================================
  console.log('  Creating Parents...');
  const parentDetails = [
    { firstName: 'Rajesh', lastName: 'Sharma', phone: '+91 98765 43210', email: 'rajesh.sharma@email.com', occupation: 'Software Engineer', relation: 'Father' },
    { firstName: 'Anitha', lastName: 'Kumar', phone: '+91 87654 32109', email: 'anitha.kumar@email.com', occupation: 'Doctor', relation: 'Mother' },
    { firstName: 'Amit', lastName: 'Patel', phone: '+91 76543 21098', email: 'amit.patel@email.com', occupation: 'Businessman', relation: 'Father' },
    { firstName: 'Sunita', lastName: 'Singh', phone: '+91 65432 10987', email: 'sunita.singh@email.com', occupation: 'Teacher', relation: 'Mother' },
    { firstName: 'Venkat', lastName: 'Reddy', phone: '+91 54321 09876', email: 'venkat.reddy@email.com', occupation: 'Bank Manager', relation: 'Father' },
    { firstName: 'Neha', lastName: 'Gupta', phone: '+91 43210 98765', email: 'neha.gupta@email.com', occupation: 'Architect', relation: 'Mother' },
    { firstName: 'Sanjay', lastName: 'Joshi', phone: '+91 32109 87654', email: 'sanjay.joshi@email.com', occupation: 'Professor', relation: 'Father' },
    { firstName: 'Lakshmi', lastName: 'Iyer', phone: '+91 21098 76543', email: 'lakshmi.iyer@email.com', occupation: 'CA', relation: 'Mother' },
  ];

  const parentRecords: { id: string; firstName: string; lastName: string; relation: string }[] = [];
  for (const pd of parentDetails) {
    const parent = await prisma.parent.create({
      data: {
        firstName: pd.firstName,
        lastName: pd.lastName,
        phone: pd.phone,
        email: pd.email,
        occupation: pd.occupation,
        relation: pd.relation,
        isEmergencyContact: true,
        address: `${randomInt(1, 500)}, ${randomItem(['Koregaon Park', 'Viman Nagar', 'Baner', 'Aundh', 'Kothrud'])}, Pune 41100${randomInt(1, 9)}`,
      },
    });
    parentRecords.push({ id: parent.id, firstName: pd.firstName, lastName: pd.lastName, relation: pd.relation });
  }
  console.log(`  ✓ ${parentRecords.length} Parents created`);

  // ============================================================
  // 6. STUDENTS (15)
  // ============================================================
  console.log('  Creating Students...');
  const studentDefs = [
    { firstName: 'Aarav', lastName: 'Sharma', className: 'Nursery-A', gender: 'Male', bloodGroup: 'B+', parentIdx: 0, dob: new Date(2021, 4, 15) },
    { firstName: 'Ananya', lastName: 'Kumar', className: 'Nursery-B', gender: 'Female', bloodGroup: 'O+', parentIdx: 1, dob: new Date(2021, 7, 22) },
    { firstName: 'Vivaan', lastName: 'Patel', className: 'LKG-A', gender: 'Male', bloodGroup: 'A+', parentIdx: 2, dob: new Date(2020, 11, 3) },
    { firstName: 'Diya', lastName: 'Singh', className: 'LKG-B', gender: 'Female', bloodGroup: 'AB+', parentIdx: 3, dob: new Date(2020, 10, 18) },
    { firstName: 'Arjun', lastName: 'Reddy', className: 'UKG-A', gender: 'Male', bloodGroup: 'B-', parentIdx: 4, dob: new Date(2019, 2, 7) },
    { firstName: 'Isha', lastName: 'Gupta', className: 'UKG-B', gender: 'Female', bloodGroup: 'O-', parentIdx: 5, dob: new Date(2019, 6, 25) },
    { firstName: 'Kabir', lastName: 'Joshi', className: 'Nursery-A', gender: 'Male', bloodGroup: 'A-', parentIdx: 6, dob: new Date(2021, 8, 12) },
    { firstName: 'Meera', lastName: 'Iyer', className: 'Nursery-B', gender: 'Female', bloodGroup: 'B+', parentIdx: 7, dob: new Date(2021, 0, 30) },
    { firstName: 'Rohan', lastName: 'Sharma', className: 'LKG-A', gender: 'Male', bloodGroup: 'O+', parentIdx: 0, dob: new Date(2020, 3, 14) },
    { firstName: 'Sara', lastName: 'Kumar', className: 'LKG-B', gender: 'Female', bloodGroup: 'AB-', parentIdx: 1, dob: new Date(2020, 5, 28) },
    { firstName: 'Ayaan', lastName: 'Patel', className: 'UKG-A', gender: 'Male', bloodGroup: 'A-', parentIdx: 2, dob: new Date(2019, 3, 22) },
    { firstName: 'Prisha', lastName: 'Singh', className: 'UKG-B', gender: 'Female', bloodGroup: 'B-', parentIdx: 3, dob: new Date(2019, 8, 5) },
    { firstName: 'Vihaan', lastName: 'Reddy', className: 'Nursery-A', gender: 'Male', bloodGroup: 'O+', parentIdx: 4, dob: new Date(2021, 6, 8) },
    { firstName: 'Kiara', lastName: 'Gupta', className: 'LKG-A', gender: 'Female', bloodGroup: 'A+', parentIdx: 5, dob: new Date(2020, 1, 25) },
    { firstName: 'Arnav', lastName: 'Joshi', className: 'Nursery-B', gender: 'Male', bloodGroup: 'B+', parentIdx: 6, dob: new Date(2021, 2, 14) },
  ];

  const studentRecords: { id: string; classId: string; parentId: string; firstName: string; className: string }[] = [];
  for (const sd of studentDefs) {
    const cls = classRecords.find(c => c.name === sd.className)!;
    const student = await prisma.student.create({
      data: {
        firstName: sd.firstName,
        lastName: sd.lastName,
        dob: sd.dob,
        gender: sd.gender,
        bloodGroup: sd.bloodGroup,
        classId: cls.id,
        branchId: branchMain.id,
        status: 'ACTIVE',
        admissionDate: daysAgo(randomInt(30, 180)),
        rollNumber: `R${String(studentRecords.length + 1).padStart(3, '0')}`,
      },
    });

    // Link parent
    const parentRec = parentRecords[sd.parentIdx % parentRecords.length];
    await prisma.studentParent.create({
      data: {
        studentId: student.id,
        parentId: parentRec.id,
        isPrimary: true,
      },
    });

    studentRecords.push({ id: student.id, classId: cls.id, parentId: parentRec.id, firstName: sd.firstName, className: sd.className });
  }
  console.log(`  ✓ Created ${studentRecords.length} students`);

  // ============================================================
  // 7. FEE STRUCTURES
  // ============================================================
  console.log('  Creating Fee Structures...');
  const feeStructureDefs = [
    { name: 'Tuition Fee - Nursery', type: 'TUITION', amount: 7500, frequency: 'MONTHLY', programName: 'Nursery' },
    { name: 'Activity Fee - Nursery', type: 'ACTIVITY', amount: 2000, frequency: 'MONTHLY', programName: 'Nursery' },
    { name: 'Tuition Fee - LKG', type: 'TUITION', amount: 8500, frequency: 'MONTHLY', programName: 'LKG' },
    { name: 'Activity Fee - LKG', type: 'ACTIVITY', amount: 2000, frequency: 'MONTHLY', programName: 'LKG' },
    { name: 'Tuition Fee - UKG', type: 'TUITION', amount: 9500, frequency: 'MONTHLY', programName: 'UKG' },
    { name: 'Activity Fee - UKG', type: 'ACTIVITY', amount: 2500, frequency: 'MONTHLY', programName: 'UKG' },
    { name: 'Transport Fee', type: 'TRANSPORT', amount: 3000, frequency: 'MONTHLY', programName: 'Nursery' },
  ];

  const feeStructureRecords: { id: string; amount: number; type: string; classId?: string }[] = [];
  for (const fsd of feeStructureDefs) {
    const program = programRecords.find(p => p.name === fsd.programName)!;
    // Create one fee structure per program (not per class)
    const fs = await prisma.feeStructure.create({
      data: {
        name: fsd.name,
        type: fsd.type as 'TUITION' | 'ACTIVITY' | 'TRANSPORT' | 'EXAM' | 'LABORATORY' | 'LIBRARY' | 'DEVELOPMENT' | 'OTHER',
        amount: fsd.amount,
        frequency: fsd.frequency as 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'ONE_TIME',
        programId: program.id,
        isActive: true,
      },
    });
    feeStructureRecords.push({ id: fs.id, amount: fsd.amount, type: fsd.type });
  }
  console.log('  ✓ Fee structures created');

  // ============================================================
  // 8. INVOICES & PAYMENTS
  // ============================================================
  console.log('  Creating Invoices & Payments...');
  let invoiceCounter = 1;
  const paymentMethods = ['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'] as const;

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const now = new Date();
    const invYear = now.getMonth() - monthOffset >= 0 ? now.getFullYear() : now.getFullYear() - 1;
    const invMonth = (now.getMonth() - monthOffset + 12) % 12;
    const dueDate = utcDate(invYear, invMonth, 5);

    for (const student of studentRecords) {
      // Get a tuition fee structure (simplified — just use first one)
      const tuitionFee = feeStructureRecords.find(f => f.type === 'TUITION');
      if (!tuitionFee) continue;

      const amount = tuitionFee.amount;
      const discount = monthOffset > 3 ? 0 : Math.random() > 0.8 ? 500 : 0;
      const netAmount = amount - discount;

      let status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
      if (monthOffset > 0) {
        status = Math.random() < 0.90 ? 'PAID' : (Math.random() < 0.5 ? 'PENDING' : 'OVERDUE');
      } else {
        const rand = Math.random();
        status = rand < 0.50 ? 'PAID' : (rand < 0.80 ? 'PENDING' : 'OVERDUE');
      }

      const currentDueDate = status === 'OVERDUE' ? new Date(dueDate.getTime() - 15 * 86400000) : dueDate;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNo: `INV-2024-${String(invoiceCounter++).padStart(4, '0')}`,
          studentId: student.id,
          feeStructureId: tuitionFee.id,
          amount,
          discount,
          netAmount,
          status,
          dueDate: currentDueDate,
          description: `Fee for ${invYear}-${String(invMonth + 1).padStart(2, '0')}`,
        },
      });

      // If Paid, create Payment
      if (status === 'PAID') {
        const payDate = utcDate(invYear, invMonth, randomInt(5, 15));
        const method = randomItem([...paymentMethods]);
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            studentId: student.id,
            amount: netAmount,
            method: method,
            transactionRef: method === 'UPI' || method === 'ONLINE' ? `TXN${payDate.getTime()}${randomInt(100, 999)}` : null,
            paymentDate: payDate,
          },
        });

        await prisma.receipt.create({
          data: {
            invoiceId: invoice.id,
            receiptNo: `RCT-2024-${String(invoiceCounter).padStart(4, '0')}`,
            amount: netAmount,
          },
        });
      }
    }
  }
  console.log('  ✓ Invoices & Payments created (6 months of data)');

  // ============================================================
  // 9. ATTENDANCE (past 30 days)
  // ============================================================
  console.log('  Creating Attendance (30 days)...');
  const attendanceStatuses: ('PRESENT' | 'ABSENT' | 'LATE')[] = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE'];

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = daysAgo(dayOffset);
    // Skip Sundays
    if (date.getDay() === 0) continue;

    // Student attendance
    for (const student of studentRecords) {
      const status = randomItem(attendanceStatuses);
      await prisma.studentAttendance.create({
        data: {
          studentId: student.id,
          date,
          status,
          method: randomItem(['Manual', 'QR', 'Face']),
          checkInTime: status !== 'ABSENT' ? `${String(randomInt(8, 9)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}` : null,
          checkOutTime: status !== 'ABSENT' ? `${String(randomInt(14, 15)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}` : null,
          markedBy: adminUser.id,
        },
      });
    }

    // Staff attendance
    for (const teacher of teacherRecords) {
      const status: 'PRESENT' | 'ABSENT' | 'LATE' = Math.random() < 0.95 ? 'PRESENT' : (Math.random() < 0.5 ? 'ABSENT' : 'LATE');
      await prisma.staffAttendance.create({
        data: {
          teacherId: teacher.id,
          date,
          status,
          method: 'Manual',
          checkInTime: status !== 'ABSENT' ? `${String(randomInt(7, 8)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}` : null,
          checkOutTime: status !== 'ABSENT' ? `${String(randomInt(14, 16)).padStart(2, '0')}:${String(randomInt(0, 59)).padStart(2, '0')}` : null,
        },
      });
    }
  }
  console.log('  ✓ Attendance created');

  // ============================================================
  // 10. GROWTH SCORES
  // ============================================================
  console.log('  Creating Growth Scores...');
  for (const student of studentRecords) {
    const cls = classRecords.find(c => c.id === student.classId)!;
    let baseScore: number;
    if (cls.name.includes('Nursery')) baseScore = 55;
    else if (cls.name.includes('LKG')) baseScore = 65;
    else baseScore = 75;

    const creativity = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const communication = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const social = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const confidence = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const cognitive = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const physical = Math.min(100, Math.max(10, baseScore + randomInt(-10, 15)));
    const overall = parseFloat(((creativity + communication + social + confidence + cognitive + physical) / 6).toFixed(1));

    await prisma.growthScore.create({
      data: {
        studentId: student.id,
        period: CURRENT_QUARTER,
        creativity,
        communication,
        social,
        confidence,
        cognitive,
        physical,
        overall,
        assessedBy: teacherRecords[0]?.id,
        comments: `${student.firstName} is showing good progress in ${randomItem(['creativity', 'communication', 'social skills', 'physical activities'])}.`,
      },
    });
  }
  console.log('  ✓ Growth scores created');

  // ============================================================
  // 11. DAILY UPDATES (today, first 5 students)
  // ============================================================
  console.log('  Creating Daily Updates...');
  const moods = ['Happy', 'Calm', 'Excited', 'Tired', 'Fussy'];
  const breakfastMenus = ['Idli with chutney', 'Poha', 'Upma', 'Paratha with curd', 'Dosa with sambar'];
  const lunchMenus = ['Rice with dal', 'Chapati with sabzi', 'Khichdi', 'Pulao with raita', 'Biryani'];
  const snacksMenus = ['Fruit bowl', 'Biscuits with milk', 'Sandwich', 'Sprouts chaat', 'Banana shake'];

  for (let i = 0; i < Math.min(5, studentRecords.length); i++) {
    const student = studentRecords[i];
    await prisma.dailyUpdate.create({
      data: {
        studentId: student.id,
        date: today(),
        breakfast: randomItem(['Eaten', 'Eaten', 'Partial']),
        breakfastMenu: randomItem(breakfastMenus),
        lunch: randomItem(['Eaten', 'Eaten', 'Partial']),
        lunchMenu: randomItem(lunchMenus),
        snacks: randomItem(['Eaten', 'Eaten', 'Partial']),
        snacksMenu: randomItem(snacksMenus),
        sleepStart: '12:30',
        sleepEnd: '13:30',
        sleepQuality: randomItem(['Good', 'Fair', 'Poor']),
        moodMorning: randomItem(moods),
        moodAfternoon: randomItem(moods),
        pottyCount: randomInt(1, 3),
        pottyType: randomItem(['Dry', 'Wet']),
        waterGlasses: randomInt(3, 8),
        highlights: `Had a fun day doing ${randomItem(['painting', 'coloring', 'story time', 'outdoor play', 'rhyme recitation'])}`,
        status: 'Published',
        publishedAt: new Date(),
        teacherId: teacherRecords[0]?.id,
      },
    });
  }
  console.log('  ✓ Daily updates created');

  // ============================================================
  // 12. ACTIVITIES
  // ============================================================
  console.log('  Creating Activities...');
  const activityDefs = [
    { title: 'Color Day Celebration', type: 'ART' as const, date: daysAgo(-3), startTime: '09:00', endTime: '11:00', status: 'UPCOMING' as const, desc: 'Children explore colors through painting, craft, and creative play' },
    { title: 'Rhyme Recitation', type: 'MUSIC' as const, date: daysAgo(5), startTime: '10:00', endTime: '11:00', status: 'COMPLETED' as const, desc: 'Nursery rhymes competition for all nursery sections', classIdx: 0 },
    { title: 'Sports Day Practice', type: 'SPORTS' as const, date: daysAgo(-2), startTime: '08:00', endTime: '10:00', status: 'UPCOMING' as const, desc: 'Practice session for upcoming annual sports day' },
    { title: 'Story Telling Session', type: 'ACADEMIC' as const, date: daysAgo(4), startTime: '11:00', endTime: '12:00', status: 'COMPLETED' as const, desc: 'Interactive story telling with puppets and props' },
    { title: 'Nature Walk', type: 'OUTDOOR' as const, date: daysAgo(-1), startTime: '08:30', endTime: '09:30', status: 'UPCOMING' as const, desc: 'Guided nature walk in school garden' },
    { title: 'Clay Modelling', type: 'CRAFT' as const, date: daysAgo(2), startTime: '09:00', endTime: '10:30', status: 'COMPLETED' as const, desc: 'Creative clay modelling session for all classes', classIdx: 2 },
  ];

  for (const ad of activityDefs) {
    await prisma.activity.create({
      data: {
        title: ad.title,
        type: ad.type,
        description: ad.desc,
        date: ad.date,
        startTime: ad.startTime,
        endTime: ad.endTime,
        status: ad.status,
        classId: ad.classIdx !== undefined ? classRecords[ad.classIdx]?.id : null,
        createdBy: adminUser.id,
        isPublished: ad.status === 'COMPLETED',
        publishedAt: ad.status === 'COMPLETED' ? new Date() : null,
      },
    });
  }
  console.log('  ✓ Activities created');

  // ============================================================
  // 13. OBSERVATIONS
  // ============================================================
  console.log('  Creating Observations...');
  for (let i = 0; i < 5; i++) {
    const student = studentRecords[i];
    await prisma.observation.create({
      data: {
        studentId: student.id,
        teacherId: teacherRecords[0]?.id,
        category: randomItem(['BEHAVIORAL', 'ACADEMIC', 'SOCIAL', 'EMOTIONAL', 'PHYSICAL', 'COGNITIVE'] as const),
        content: `${student.firstName} showed ${randomItem(['good participation', 'improved focus', 'enthusiasm', 'leadership skills'])} during today's ${randomItem(['art session', 'outdoor play', 'group activity', 'story time'])}.`,
        priority: randomItem(['LOW', 'NORMAL', 'NORMAL', 'HIGH'] as const),
        isShared: Math.random() > 0.3,
        parentAck: Math.random() > 0.5,
      },
    });
  }
  console.log('  ✓ Observations created');

  // ============================================================
  // 14. ANNOUNCEMENTS
  // ============================================================
  console.log('  Creating Announcements...');
  const announcementDefs = [
    { title: 'Annual Day Celebration', type: 'Event', priority: 'HIGH' as const, target: 'All', content: 'Annual day celebration on June 20th. All parents are cordially invited. Cultural performances by students from all classes.' },
    { title: 'Fee Payment Reminder', type: 'Fee', priority: 'NORMAL' as const, target: 'Parents', content: 'June month fee is due by 5th. Late fee of ₹50/day applicable after 10th. Please pay on time to avoid penalties.' },
    { title: 'Summer Camp Registration', type: 'Academic', priority: 'NORMAL' as const, target: 'All', content: 'Summer camp registrations are now open! Limited seats available. Activities include art, dance, swimming, and nature exploration.' },
    { title: 'Health Check-up Drive', type: 'Health', priority: 'HIGH' as const, target: 'All', content: 'Annual health check-up for all students scheduled. Pediatrician visit and dental check-up included.' },
    { title: 'Parent-Teacher Meeting', type: 'Academic', priority: 'HIGH' as const, target: 'Parents', content: 'PTM scheduled for June 25th. Individual time slots will be shared via WhatsApp. Please ensure attendance.' },
  ];

  for (const ann of announcementDefs) {
    await prisma.announcement.create({
      data: {
        title: ann.title,
        content: ann.content,
        type: ann.type,
        target: ann.target,
        priority: ann.priority,
        status: 'Published',
        publishedAt: daysAgo(randomInt(1, 10)),
        createdBy: adminUser.id,
      },
    });
  }
  console.log('  ✓ Announcements created');

  // ============================================================
  // 15. CRM LEADS & FOLLOW-UPS
  // ============================================================
  console.log('  Creating CRM Leads...');
  const leadDefs = [
    { parentName: 'Vikram Malhotra', childName: 'Ayaan Malhotra', phone: '+91 99887 76655', email: 'vikram.m@email.com', source: 'WEBSITE' as const, stage: 'NEW' as const, priority: 'HIGH' as const, program: 'Nursery', notes: 'Interested in full-day program' },
    { parentName: 'Sneha Kulkarni', childName: 'Riya Kulkarni', phone: '+91 88776 65544', email: 'sneha.k@email.com', source: 'REFERRAL' as const, stage: 'CONTACTED' as const, priority: 'NORMAL' as const, program: 'LKG', notes: 'Referred by existing parent Rajesh Sharma' },
    { parentName: 'Deepak Chauhan', childName: 'Ayaan Chauhan', phone: '+91 77665 54433', email: 'deepak.c@email.com', source: 'INSTAGRAM' as const, stage: 'VISITED' as const, priority: 'HIGH' as const, program: 'UKG', notes: 'Visited campus, impressed with facilities' },
    { parentName: 'Pooja Menon', childName: 'Aditi Menon', phone: '+91 66554 43322', email: 'pooja.m@email.com', source: 'WALK_IN' as const, stage: 'APPLIED' as const, priority: 'NORMAL' as const, program: 'Nursery', notes: 'Filled application form, wants morning batch' },
    { parentName: 'Ramesh Iyer', childName: 'Karthik Iyer', phone: '+91 55443 32211', source: 'FACEBOOK' as const, stage: 'ENROLLED' as const, priority: 'LOW' as const, program: 'LKG', notes: 'Admission confirmed, fee paid' },
    { parentName: 'Kavitha Subramanian', childName: 'Arjun Subramanian', phone: '+91 44332 21100', source: 'GOOGLE' as const, stage: 'NEW' as const, priority: 'NORMAL' as const, program: 'Nursery', notes: 'Found via Google search, requested callback' },
    { parentName: 'Manish Agarwal', childName: 'Riya Agarwal', phone: '+91 33221 10099', source: 'JUSTDIAL' as const, stage: 'LOST' as const, priority: 'LOW' as const, program: 'UKG', notes: 'Chose competitor school due to proximity' },
    { parentName: 'Saritha Nambiar', childName: 'Dev Nambiar', phone: '+91 22110 09988', source: 'EVENT' as const, stage: 'CONTACTED' as const, priority: 'NORMAL' as const, program: 'LKG', notes: 'Met at education fair, showed interest' },
  ];

  const leadRecords: { id: string; stage: string }[] = [];
  for (const ld of leadDefs) {
    const lead = await prisma.lead.create({
      data: {
        parentName: ld.parentName,
        parentPhone: ld.phone,
        parentEmail: ld.email,
        childName: ld.childName,
        source: ld.source,
        stage: ld.stage,
        priority: ld.priority,
        programInterest: ld.program,
        estimatedValue: ld.stage === 'ENROLLED' ? 25000 : randomInt(15000, 30000),
        notes: ld.notes,
        assignedTo: adminUser.id,
        nextFollowUp: ['NEW', 'CONTACTED', 'VISITED'].includes(ld.stage) ? daysAgo(-randomInt(1, 7)) : null,
        lostReason: ld.stage === 'LOST' ? 'Chose competitor' : null,
      },
    });
    leadRecords.push({ id: lead.id, stage: ld.stage });

    // Create follow-ups for active leads
    if (['CONTACTED', 'VISITED', 'APPLIED'].includes(ld.stage)) {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          type: randomItem(['Phone', 'Email', 'InPerson', 'WhatsApp']),
          dateTime: daysAgo(randomInt(1, 5)),
          outcome: 'Positive',
          notes: `Discussed enrollment for ${ld.childName}. ${ld.stage === 'APPLIED' ? 'Application submitted.' : 'Parent interested, scheduling next step.'}`,
          createdBy: adminUser.id,
        },
      });
    }
  }
  console.log(`  ✓ ${leadRecords.length} CRM Leads with follow-ups created`);

  // ============================================================
  // 16. HOLIDAYS & EVENTS
  // ============================================================
  console.log('  Creating Holidays & Events...');
  const holidayDefs = [
    { name: 'Republic Day', date: new Date(2025, 0, 26) },
    { name: 'Holi', date: new Date(2025, 2, 14) },
    { name: 'Independence Day', date: new Date(2025, 7, 15) },
    { name: 'Gandhi Jayanti', date: new Date(2025, 9, 2) },
    { name: 'Diwali', date: new Date(2025, 9, 20) },
    { name: 'Christmas', date: new Date(2025, 11, 25) },
  ];

  for (const hd of holidayDefs) {
    await prisma.holiday.create({ data: { name: hd.name, date: hd.date, type: 'Public' } });
  }

  await prisma.event.create({
    data: {
      title: 'Annual Day 2025',
      description: 'Annual cultural celebration with performances by all students',
      date: new Date(2025, 5, 20),
      startTime: '09:00',
      endTime: '13:00',
      venue: 'School Auditorium',
      type: 'Cultural',
    },
  });

  await prisma.event.create({
    data: {
      title: 'Sports Day 2025',
      description: 'Annual sports competition',
      date: new Date(2025, 2, 15),
      startTime: '08:00',
      endTime: '12:00',
      venue: 'School Playground',
      type: 'Sports',
    },
  });
  console.log('  ✓ Holidays & Events created');

  // ============================================================
  // DONE
  // ============================================================
  console.log('\n🎉 PreOne seed completed successfully!');
  console.log(`  School: ${school.name}`);
  console.log(`  Branches: Main Campus, City Center`);
  console.log(`  Users: ${1 + teacherUsers.length + parentUsers.length} (1 Admin, ${teacherUsers.length} Teachers, ${parentUsers.length} Parents)`);
  console.log(`  Students: ${studentRecords.length}`);
  console.log(`  Classes: ${classRecords.length}`);
  console.log(`  Programs: ${programRecords.length}`);
  console.log(`  Leads: ${leadRecords.length}`);
  console.log(`  Activities: ${activityDefs.length}`);
  console.log(`  Announcements: ${announcementDefs.length}`);
  console.log('\n  Login credentials:');
  console.log('    Admin:    admin@preone.com / password123');
  console.log('    Teacher:  kavitha.raman@littlestars.com / password123');
  console.log('    Parent:   rajesh.sharma@email.com / password123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
