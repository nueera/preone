// ============================================================
// PreOne — Seed Script
// Populates the database with realistic Indian preschool demo data
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

const CURRENT_QUARTER = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

// ============================================================
// MAIN SEED
// ============================================================

async function main() {
  console.log('🌱 Starting PreOne seed...');

  // Clean existing data (order matters for foreign keys)
  console.log('  Cleaning existing data...');
  const models = [
    'auditLog', 'report', 'notification', 'notificationPreference', 'kycDocument', 'milestoneTimeline', 'milestone',
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
  // 1. SCHOOL & BRANCH
  // ============================================================
  console.log('  Creating School & Branch...');
  const school = await prisma.school.create({
    data: {
      name: 'Little Stars Preschool',
      address: '123 Main St, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      phone: '9876543210',
      email: 'info@littlestars.com',
      website: 'https://littlestars.com',
      academicYear: '2025-2026',
      board: 'CBSE',
      schoolCode: 'LSP-001',
    },
  });

  const branch = await prisma.branch.create({
    data: {
      schoolId: school.id,
      name: 'Main Campus',
      address: '123 Main St, Mumbai',
      phone: '9876543210',
      capacity: 200,
      inChargeName: 'Sunil Mehta',
      inChargePhone: '9876512345',
      isActive: true,
    },
  });
  console.log('  ✓ School & Branch created');

  // ============================================================
  // 2. ADMIN USER
  // ============================================================
  console.log('  Creating Admin User...');
  const adminPasswordHash = await hashPassword('admin123');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@preone.com',
      password: adminPasswordHash,
      name: 'Admin User',
      phone: '9876543210',
      role: 'ADMIN',
      isActive: true,
      schoolId: school.id,
      branchId: branch.id,
    },
  });
  console.log('  ✓ Admin user created (admin@preone.com / admin123)');

  // ============================================================
  // 2b. TASK_MASTER USER (CRM-only access within Admin portal)
  // ============================================================
  console.log('  Creating Task Master User...');
  const taskMasterUser = await prisma.user.create({
    data: {
      email: 'taskmaster@preone.com',
      password: adminPasswordHash,
      name: 'CRM Manager',
      phone: '9876543211',
      role: 'TASK_MASTER',
      isActive: true,
      schoolId: school.id,
      branchId: branch.id,
    },
  });
  console.log('  ✓ Task Master user created (taskmaster@preone.com / admin123)');

  // ============================================================
  // 3. PROGRAMS (Nursery, LKG, UKG)
  // ============================================================
  console.log('  Creating Programs...');
  const programNursery = await prisma.program.create({
    data: {
      name: 'Nursery',
      description: 'Foundation program for ages 2.5-3.5 years',
      ageMin: 2,
      ageMax: 3,
      branchId: branch.id,
    },
  });

  const programLKG = await prisma.program.create({
    data: {
      name: 'LKG',
      description: 'Lower Kindergarten for ages 3.5-4.5 years',
      ageMin: 3,
      ageMax: 4,
      branchId: branch.id,
    },
  });

  const programUKG = await prisma.program.create({
    data: {
      name: 'UKG',
      description: 'Upper Kindergarten for ages 4.5-5.5 years',
      ageMin: 4,
      ageMax: 5,
      branchId: branch.id,
    },
  });

  const programRecords = [
    { name: 'Nursery', id: programNursery.id },
    { name: 'LKG', id: programLKG.id },
    { name: 'UKG', id: programUKG.id },
  ];
  console.log('  ✓ 3 Programs created');

  // ============================================================
  // 4. CLASSES (6 total)
  // ============================================================
  console.log('  Creating Classes...');
  const classDefs = [
    { name: 'Nursery-A', programId: programNursery.id, capacity: 30, roomNo: '101' },
    { name: 'Nursery-B', programId: programNursery.id, capacity: 30, roomNo: '102' },
    { name: 'LKG-A', programId: programLKG.id, capacity: 30, roomNo: '201' },
    { name: 'LKG-B', programId: programLKG.id, capacity: 30, roomNo: '202' },
    { name: 'UKG-A', programId: programUKG.id, capacity: 30, roomNo: '301' },
    { name: 'UKG-B', programId: programUKG.id, capacity: 30, roomNo: '302' },
  ];

  const classRecords: { name: string; id: string; programId: string }[] = [];
  for (const cd of classDefs) {
    const cls = await prisma.class.create({
      data: {
        name: cd.name,
        programId: cd.programId,
        branchId: branch.id,
        capacity: cd.capacity,
        roomNo: cd.roomNo,
      },
    });
    classRecords.push({ name: cd.name, id: cls.id, programId: cd.programId });
  }
  console.log('  ✓ 6 Classes created');

  // ============================================================
  // 5. TEACHERS (5 with different qualifications)
  // ============================================================
  console.log('  Creating Teachers...');
  const teacherDefs = [
    { firstName: 'Kavitha', lastName: 'Raman', email: 'kavitha.raman@littlestars.com', phone: '9812345670', qualification: 'PhD Early Education', specialization: 'Montessori Method', experience: 12, gender: 'Female', salary: 45000 },
    { firstName: 'Priya', lastName: 'Nair', email: 'priya.nair@littlestars.com', phone: '8723456789', qualification: 'M.Ed', specialization: 'Child Psychology', experience: 8, gender: 'Female', salary: 38000 },
    { firstName: 'Meena', lastName: 'Sharma', email: 'meena.sharma@littlestars.com', phone: '9988776655', qualification: 'B.Ed + Diploma in ECCE', specialization: 'Early Childhood Care', experience: 6, gender: 'Female', salary: 32000 },
    { firstName: 'Rajesh', lastName: 'Iyer', email: 'rajesh.iyer@littlestars.com', phone: '8877665544', qualification: 'M.A. Education', specialization: 'Creative Arts', experience: 10, gender: 'Male', salary: 42000 },
    { firstName: 'Sunita', lastName: 'Patel', email: 'sunita.patel@littlestars.com', phone: '7766554433', qualification: 'NTT + B.Ed', specialization: 'Physical Education', experience: 4, gender: 'Female', salary: 28000 },
  ];

  const teacherRecords: { id: string; firstName: string; lastName: string; className?: string }[] = [];
  const classAssignments = ['Nursery-A', 'Nursery-B', 'LKG-A', 'LKG-B', 'UKG-A'];

  for (let i = 0; i < teacherDefs.length; i++) {
    const td = teacherDefs[i];
    const assignedClassName = classAssignments[i];

    // Create user for teacher
    const teacherPasswordHash = await hashPassword('password123');
    const teacherUser = await prisma.user.create({
      data: {
        email: td.email,
        password: teacherPasswordHash, // All teachers use password123 for demo
        name: `${td.firstName} ${td.lastName}`,
        phone: td.phone,
        role: 'TEACHER',
        isActive: true,
        schoolId: school.id,
        branchId: branch.id,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: teacherUser.id,
        branchId: branch.id,
        firstName: td.firstName,
        lastName: td.lastName,
        phone: td.phone,
        email: td.email,
        dob: new Date(1985 + randomInt(0, 8), randomInt(0, 11), randomInt(1, 28)),
        gender: td.gender,
        qualification: td.qualification,
        specialization: td.specialization,
        experience: td.experience,
        status: 'ACTIVE',
        salary: td.salary,
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
        institution: randomItem(['University of Mumbai', 'Pune University', 'Bharati Vidyapeeth', 'Tata Institute']),
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
  console.log('  ✓ 5 Teachers created with qualifications, schedules, class assignments');

  // ============================================================
  // 6. PARENTS (20 students × 2 parents each = 40 parents)
  // ============================================================
  console.log('  Creating Parents...');
  const fatherNames = [
    'Rajesh Sharma', 'Amit Patel', 'Venkat Reddy', 'Sanjay Joshi',
    'Deepak Chauhan', 'Manish Agarwal', 'Vikram Malhotra', 'Ramesh Iyer',
    'Suresh Kumar', 'Anil Gupta', 'Prakash Naik', 'Kiran Deshmukh',
    'Ravi Menon', 'Arun Kulkarni', 'Vivek Subramanian', 'Mahesh Bhatt',
    'Dinesh Nambiar', 'Ashok Pillai', 'Ganesh Iyer', 'Rahul Mehta',
  ];

  const motherNames = [
    'Anitha Kumar', 'Sunita Singh', 'Neha Gupta', 'Lakshmi Iyer',
    'Pooja Menon', 'Saritha Nambiar', 'Sneha Kulkarni', 'Kavitha Subramanian',
    'Priya Desai', 'Meera Joshi', 'Sujata Patil', 'Renuka Shinde',
    'Lata Menon', 'Usha Kulkarni', 'Deepa Subramanian', 'Rekha Bhatt',
    'Vijaya Nambiar', 'Padma Pillai', 'Savitha Iyer', 'Swati Mehta',
  ];

  const parentRecords: { id: string; firstName: string; lastName: string; relation: string; email: string }[] = [];
  const areas = ['Andheri', 'Bandra', 'Juhu', 'Powai', 'Thane', 'Borivali', 'Malad', 'Goregaon', 'Kandivali', 'Dadar'];

  // Create father + mother pairs for each of the 20 students
  for (let i = 0; i < 20; i++) {
    const area = randomItem(areas);
    const flatNo = randomInt(1, 500);

    // Father
    const [fFirst, ...fRest] = fatherNames[i].split(' ');
    const fLast = fRest.join(' ');
    const father = await prisma.parent.create({
      data: {
        firstName: fFirst,
        lastName: fLast,
        phone: `+91 ${98765 - i}${randomInt(1000, 9999)}`,
        email: `${fFirst.toLowerCase()}.${fLast.toLowerCase()}@email.com`,
        occupation: randomItem(['Software Engineer', 'Businessman', 'Doctor', 'Professor', 'Bank Manager', 'CA', 'Lawyer']),
        relation: 'Father',
        isEmergencyContact: i < 5, // First 5 fathers are emergency contacts
        address: `${flatNo}, ${area}, Mumbai 4000${randomInt(1, 99)}`,
      },
    });
    parentRecords.push({ id: father.id, firstName: fFirst, lastName: fLast, relation: 'Father', email: father.email });

    // Mother
    const [mFirst, ...mRest] = motherNames[i].split(' ');
    const mLast = mRest.join(' ');
    const mother = await prisma.parent.create({
      data: {
        firstName: mFirst,
        lastName: mLast,
        phone: `+91 ${87654 - i}${randomInt(1000, 9999)}`,
        email: `${mFirst.toLowerCase()}.${mLast.toLowerCase()}@email.com`,
        occupation: randomItem(['Teacher', 'Architect', 'Homemaker', 'Nurse', 'Designer', 'Manager']),
        relation: 'Mother',
        isEmergencyContact: i >= 5, // Remaining mothers are emergency contacts
        address: `${flatNo}, ${area}, Mumbai 4000${randomInt(1, 99)}`,
      },
    });
    parentRecords.push({ id: mother.id, firstName: mFirst, lastName: mLast, relation: 'Mother', email: mother.email });
  }
  console.log(`  ✓ ${parentRecords.length} Parents created (40 = 20 fathers + 20 mothers)`);

  // ============================================================
  // 7. STUDENTS (20 spread across classes)
  // ============================================================
  console.log('  Creating Students...');
  const studentDefs = [
    // Nursery-A (4 students)
    { firstName: 'Aarav', lastName: 'Sharma', className: 'Nursery-A', gender: 'Male', bloodGroup: 'B+', dob: new Date(2022, 4, 15) },
    { firstName: 'Kabir', lastName: 'Joshi', className: 'Nursery-A', gender: 'Male', bloodGroup: 'A-', dob: new Date(2022, 8, 12) },
    { firstName: 'Vihaan', lastName: 'Reddy', className: 'Nursery-A', gender: 'Male', bloodGroup: 'O+', dob: new Date(2022, 6, 8) },
    { firstName: 'Anaya', lastName: 'Patel', className: 'Nursery-A', gender: 'Female', bloodGroup: 'A+', dob: new Date(2022, 2, 20) },

    // Nursery-B (3 students)
    { firstName: 'Ananya', lastName: 'Kumar', className: 'Nursery-B', gender: 'Female', bloodGroup: 'O+', dob: new Date(2022, 7, 22) },
    { firstName: 'Meera', lastName: 'Iyer', className: 'Nursery-B', gender: 'Female', bloodGroup: 'B+', dob: new Date(2022, 0, 30) },
    { firstName: 'Arnav', lastName: 'Agarwal', className: 'Nursery-B', gender: 'Male', bloodGroup: 'B+', dob: new Date(2022, 2, 14) },

    // LKG-A (4 students)
    { firstName: 'Vivaan', lastName: 'Patel', className: 'LKG-A', gender: 'Male', bloodGroup: 'A+', dob: new Date(2021, 11, 3) },
    { firstName: 'Rohan', lastName: 'Sharma', className: 'LKG-A', gender: 'Male', bloodGroup: 'O+', dob: new Date(2021, 3, 14) },
    { firstName: 'Kiara', lastName: 'Gupta', className: 'LKG-A', gender: 'Female', bloodGroup: 'A+', dob: new Date(2021, 1, 25) },
    { firstName: 'Aditya', lastName: 'Naik', className: 'LKG-A', gender: 'Male', bloodGroup: 'B-', dob: new Date(2021, 5, 10) },

    // LKG-B (3 students)
    { firstName: 'Diya', lastName: 'Singh', className: 'LKG-B', gender: 'Female', bloodGroup: 'AB+', dob: new Date(2021, 10, 18) },
    { firstName: 'Sara', lastName: 'Kumar', className: 'LKG-B', gender: 'Female', bloodGroup: 'AB-', dob: new Date(2021, 5, 28) },
    { firstName: 'Prisha', lastName: 'Deshmukh', className: 'LKG-B', gender: 'Female', bloodGroup: 'B-', dob: new Date(2021, 8, 5) },

    // UKG-A (3 students)
    { firstName: 'Arjun', lastName: 'Reddy', className: 'UKG-A', gender: 'Male', bloodGroup: 'B-', dob: new Date(2020, 2, 7) },
    { firstName: 'Ayaan', lastName: 'Menon', className: 'UKG-A', gender: 'Male', bloodGroup: 'A-', dob: new Date(2020, 3, 22) },
    { firstName: 'Ishaan', lastName: 'Nambiar', className: 'UKG-A', gender: 'Male', bloodGroup: 'O+', dob: new Date(2020, 1, 15) },

    // UKG-B (3 students)
    { firstName: 'Isha', lastName: 'Gupta', className: 'UKG-B', gender: 'Female', bloodGroup: 'O-', dob: new Date(2020, 6, 25) },
    { firstName: 'Prisha', lastName: 'Pillai', className: 'UKG-B', gender: 'Female', bloodGroup: 'B+', dob: new Date(2020, 9, 8) },
    { firstName: 'Saavi', lastName: 'Mehta', className: 'UKG-B', gender: 'Female', bloodGroup: 'A+', dob: new Date(2020, 4, 3) },
  ];

  const studentRecords: { id: string; classId: string; parentId: string; firstName: string; className: string }[] = [];
  for (let i = 0; i < studentDefs.length; i++) {
    const sd = studentDefs[i];
    const cls = classRecords.find(c => c.name === sd.className)!;
    const student = await prisma.student.create({
      data: {
        firstName: sd.firstName,
        lastName: sd.lastName,
        dob: sd.dob,
        gender: sd.gender,
        bloodGroup: sd.bloodGroup,
        classId: cls.id,
        branchId: branch.id,
        status: 'ACTIVE',
        admissionDate: daysAgo(randomInt(30, 180)),
        rollNumber: `R${String(i + 1).padStart(3, '0')}`,
      },
    });

    // Link father (index i*2 in parentRecords) and mother (index i*2+1)
    const fatherRec = parentRecords[i * 2];
    const motherRec = parentRecords[i * 2 + 1];

    await prisma.studentParent.create({
      data: {
        studentId: student.id,
        parentId: fatherRec.id,
        isPrimary: true,
      },
    });

    await prisma.studentParent.create({
      data: {
        studentId: student.id,
        parentId: motherRec.id,
        isPrimary: false,
      },
    });

    studentRecords.push({ id: student.id, classId: cls.id, parentId: fatherRec.id, firstName: sd.firstName, className: sd.className });

    // Create medical record for each student
    await prisma.medicalRecord.create({
      data: {
        studentId: student.id,
        allergies: randomItem(['None', 'Peanuts', 'Dust', 'None', 'None', 'Milk']),
        conditions: randomItem(['None', 'None', 'None', 'Mild Asthma', 'None']),
        medications: randomItem(['None', 'None', 'Inhaler (as needed)', 'None']),
        vaccinationStatus: randomItem(['Up to date', 'Up to date', 'Up to date', 'Partial']),
      },
    });
  }
  console.log(`  ✓ ${studentRecords.length} Students created (spread across 6 classes)`);

  // ============================================================
  // 8. FEE STRUCTURES (5 as specified)
  // ============================================================
  console.log('  Creating Fee Structures...');
  const feeStructureDefs = [
    { name: 'Tuition Fee', type: 'TUITION' as const, amount: 15000, frequency: 'QUARTERLY' as const, programId: programNursery.id, description: 'Quarterly tuition fee' },
    { name: 'Transport Fee', type: 'TRANSPORT' as const, amount: 3000, frequency: 'MONTHLY' as const, programId: programNursery.id, description: 'Monthly transport fee' },
    { name: 'Activity Fee', type: 'ACTIVITY' as const, amount: 2000, frequency: 'QUARTERLY' as const, programId: programNursery.id, description: 'Quarterly activity and material fee' },
    { name: 'Exam Fee', type: 'EXAM' as const, amount: 500, frequency: 'ONE_TIME' as const, programId: programNursery.id, description: 'One-time exam and assessment fee' },
    { name: 'Development Fee', type: 'DEVELOPMENT' as const, amount: 1000, frequency: 'ANNUAL' as const, programId: programNursery.id, description: 'Annual school development fee' },
  ];

  const feeStructureRecords: { id: string; amount: number; type: string }[] = [];
  for (const fsd of feeStructureDefs) {
    const fs = await prisma.feeStructure.create({
      data: {
        name: fsd.name,
        type: fsd.type,
        amount: fsd.amount,
        frequency: fsd.frequency,
        programId: fsd.programId,
        description: fsd.description,
        isActive: true,
      },
    });
    feeStructureRecords.push({ id: fs.id, amount: fsd.amount, type: fsd.type });
  }
  console.log('  ✓ 5 Fee Structures created');

  // ============================================================
  // 9. INVOICES & PAYMENTS
  // ============================================================
  console.log('  Creating Invoices & Payments...');
  let invoiceCounter = 1;
  const paymentMethods = ['UPI', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'] as const;

  // Create invoices for current and last month for each student
  for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
    const now = new Date();
    const invYear = now.getMonth() - monthOffset >= 0 ? now.getFullYear() : now.getFullYear() - 1;
    const invMonth = (now.getMonth() - monthOffset + 12) % 12;
    const dueDate = utcDate(invYear, invMonth, 5);

    for (const student of studentRecords) {
      // Get tuition fee structure
      const tuitionFee = feeStructureRecords.find(f => f.type === 'TUITION');
      if (!tuitionFee) continue;

      const amount = tuitionFee.amount;
      const discount = Math.random() > 0.85 ? 500 : 0;
      const netAmount = amount - discount;

      let status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
      if (monthOffset > 0) {
        status = Math.random() < 0.85 ? 'PAID' : (Math.random() < 0.5 ? 'PENDING' : 'OVERDUE');
      } else {
        const rand = Math.random();
        status = rand < 0.40 ? 'PAID' : (rand < 0.75 ? 'PENDING' : 'OVERDUE');
      }

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNo: `INV-2025-${String(invoiceCounter++).padStart(4, '0')}`,
          studentId: student.id,
          feeStructureId: tuitionFee.id,
          amount,
          discount,
          netAmount,
          status,
          dueDate,
          description: `Tuition fee for ${invYear}-${String(invMonth + 1).padStart(2, '0')}`,
        },
      });

      // If Paid, create Payment + Receipt
      if (status === 'PAID') {
        const payDate = utcDate(invYear, invMonth, randomInt(5, 15));
        const method = randomItem([...paymentMethods]);
        await prisma.payment.create({
          data: {
            invoiceId: invoice.id,
            studentId: student.id,
            amount: netAmount,
            method,
            transactionRef: method === 'UPI' || method === 'ONLINE' ? `TXN${payDate.getTime()}${randomInt(100, 999)}` : null,
            paymentDate: payDate,
          },
        });

        await prisma.receipt.create({
          data: {
            invoiceId: invoice.id,
            receiptNo: `RCT-2025-${String(invoiceCounter).padStart(4, '0')}`,
            amount: netAmount,
          },
        });
      }
    }
  }
  console.log('  ✓ Invoices & Payments created');

  // ============================================================
  // 10. ATTENDANCE (today + past 30 days)
  // ============================================================
  console.log('  Creating Attendance...');
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
  console.log('  ✓ Attendance created (30 days)');

  // ============================================================
  // 11. GROWTH SCORES
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
  console.log('  ✓ Growth scores created (current quarter)');

  // Growth scores for previous quarters (Q1, Q2, Q3) for trend data
  console.log('  Creating Growth Scores for previous quarters...');
  const year = new Date().getFullYear();
  const currentQ = Math.ceil((new Date().getMonth() + 1) / 3);
  const previousQuarters: string[] = [];
  for (let q = 1; q < currentQ; q++) {
    previousQuarters.push(`${year}-Q${q}`);
  }

  for (const student of studentRecords) {
    const cls = classRecords.find(c => c.id === student.classId)!;
    let baseScore: number;
    if (cls.name.includes('Nursery')) baseScore = 45;
    else if (cls.name.includes('LKG')) baseScore = 55;
    else baseScore = 65;

    for (let qi = 0; qi < previousQuarters.length; qi++) {
      const period = previousQuarters[qi];
      // Progressive improvement: earlier quarters have lower base
      const qBase = baseScore + qi * 5;
      const creativity = Math.min(100, Math.max(10, qBase + randomInt(-10, 10)));
      const communication = Math.min(100, Math.max(10, qBase + randomInt(-10, 10)));
      const social = Math.min(100, Math.max(10, qBase + randomInt(-10, 10)));
      const confidence = Math.min(100, Math.max(10, qBase + randomInt(-10, 10)));
      const cognitive = Math.min(100, Math.max(10, qBase + randomInt(-10, 10)));
      const physical = Math.min(100, Math.max(10, qBase + randomInt(-5, 10)));
      const overall = parseFloat(((creativity + communication + social + confidence + cognitive + physical) / 6).toFixed(1));

      await prisma.growthScore.create({
        data: {
          studentId: student.id,
          period,
          creativity,
          communication,
          social,
          confidence,
          cognitive,
          physical,
          overall,
          assessedBy: teacherRecords[qi % teacherRecords.length]?.id,
          comments: `${student.firstName} is showing ${qi === 0 ? 'developing' : 'improving'} progress in ${randomItem(['creativity', 'communication', 'social skills', 'physical activities'])}.`,
        },
      });
    }
  }
  console.log(`  ✓ Growth scores created for ${previousQuarters.length} previous quarters`);

  // ============================================================
  // 11b. MILESTONES (developmental milestones by age group)
  // ============================================================
  console.log('  Creating Milestones...');
  const milestoneDefs = [
    // Age 2-3 (Nursery)
    { name: 'Walks steadily', ageGroup: '2-3', category: 'Physical', description: 'Can walk without support on different surfaces' },
    { name: 'Stacks 4+ blocks', ageGroup: '2-3', category: 'Cognitive', description: 'Can stack four or more blocks in a tower' },
    { name: 'Uses 2-word phrases', ageGroup: '2-3', category: 'Language', description: 'Combines two words like "more milk" or "big truck"' },
    { name: 'Plays alongside others', ageGroup: '2-3', category: 'Social', description: 'Engages in parallel play near other children' },
    { name: 'Identifies 3 colors', ageGroup: '2-3', category: 'Cognitive', description: 'Can point to and name at least 3 colors' },
    // Age 3-4 (LKG)
    { name: 'Hops on one foot', ageGroup: '3-4', category: 'Physical', description: 'Can hop on one foot for a few steps' },
    { name: 'Catches a bounced ball', ageGroup: '3-4', category: 'Physical', description: 'Can catch a large ball bounced to them' },
    { name: 'Counts to 10', ageGroup: '3-4', category: 'Cognitive', description: 'Can count objects up to 10' },
    { name: 'Tells a simple story', ageGroup: '3-4', category: 'Language', description: 'Can narrate a simple sequence of events' },
    { name: 'Plays cooperatively in group', ageGroup: '3-4', category: 'Social', description: 'Takes turns and shares with other children' },
    { name: 'Draws a person with 3+ body parts', ageGroup: '3-4', category: 'Cognitive', description: 'Can draw a figure with at least 3 body parts' },
    { name: 'Uses scissors', ageGroup: '3-4', category: 'Physical', description: 'Can cut along a straight line with safety scissors' },
    // Age 4-5 (UKG)
    { name: 'Balances on one foot for 10 sec', ageGroup: '4-5', category: 'Physical', description: 'Can maintain balance on one foot for 10 seconds' },
    { name: 'Identifies colors and shapes', ageGroup: '4-5', category: 'Cognitive', description: 'Can name all primary colors and basic shapes' },
    { name: 'Counts to 20', ageGroup: '4-5', category: 'Cognitive', description: 'Can count reliably up to 20 objects' },
    { name: 'Draws a person with 6+ body parts', ageGroup: '4-5', category: 'Cognitive', description: 'Can draw a detailed figure with 6 or more body parts' },
    { name: 'Takes turns in games', ageGroup: '4-5', category: 'Social', description: 'Understands and follows turn-taking rules' },
    { name: 'Uses future tense', ageGroup: '4-5', category: 'Language', description: 'Can talk about future events using correct tense' },
    { name: 'Writes some letters', ageGroup: '4-5', category: 'Cognitive', description: 'Can write some letters of the alphabet' },
    { name: 'Skips on both feet', ageGroup: '4-5', category: 'Physical', description: 'Can skip alternating feet' },
  ];

  const milestoneRecords: { id: string; ageGroup: string; category: string; name: string }[] = [];
  for (const md of milestoneDefs) {
    const milestone = await prisma.milestone.create({
      data: {
        name: md.name,
        ageGroup: md.ageGroup,
        category: md.category,
        description: md.description,
      },
    });
    milestoneRecords.push({ id: milestone.id, ageGroup: md.ageGroup, category: md.category, name: md.name });
  }
  console.log(`  ✓ ${milestoneRecords.length} Milestones created`);

  // Create MilestoneTimelines for first 5 students (mix of achieved and pending)
  console.log('  Creating Milestone Timelines...');
  for (let i = 0; i < Math.min(5, studentRecords.length); i++) {
    const student = studentRecords[i];
    const studentDef = studentDefs[i];
    // Calculate age group from DOB
    const age = (Date.now() - studentDef.dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    let ageGroup: string;
    if (age < 3) ageGroup = '2-3';
    else if (age < 4) ageGroup = '3-4';
    else ageGroup = '4-5';

    const relevantMilestones = milestoneRecords.filter(m => m.ageGroup === ageGroup);
    for (let j = 0; j < relevantMilestones.length; j++) {
      const isAchieved = j < Math.ceil(relevantMilestones.length * 0.55); // ~55% achieved
      await prisma.milestoneTimeline.create({
        data: {
          studentId: student.id,
          milestoneId: relevantMilestones[j].id,
          achievedDate: isAchieved ? daysAgo(randomInt(1, 30)) : null,
          status: isAchieved ? 'ACHIEVED' : 'PENDING',
          notes: isAchieved ? `Achieved during ${randomItem(['class activity', 'play time', 'guided session', 'home practice'])}` : null,
        },
      });
    }
  }
  console.log('  ✓ Milestone timelines created for first 5 students');

  // ============================================================
  // 11c. AI OBSERVATIONS (for first 5 students)
  // ============================================================
  console.log('  Creating AI Observations...');
  const aiInsightDefs = [
    { dimension: 'communication', insight: 'Communication score has improved 15% from Q1 to Q2', severity: 'INFO' },
    { dimension: 'social', insight: 'Social skills are a strong area — encourage group activities', severity: 'POSITIVE' },
    { dimension: 'communication', insight: 'Consider activities that boost communication: storytelling, show-and-tell', severity: 'SUGGESTION' },
    { dimension: 'physical', insight: 'Physical development is outstanding compared to class average', severity: 'POSITIVE' },
    { dimension: 'cognitive', insight: 'Cognitive growth trend shows consistent improvement over 3 quarters', severity: 'INFO' },
  ];

  for (let i = 0; i < Math.min(5, studentRecords.length); i++) {
    const insight = aiInsightDefs[i];
    await prisma.aIObservation.create({
      data: {
        studentId: studentRecords[i].id,
        insight: insight.insight,
        dimension: insight.dimension,
        severity: insight.severity,
        isActioned: false,
      },
    });
  }
  console.log('  ✓ AI Observations created');

  // ============================================================
  // 11d. PARENT USER & CHAT DATA
  // ============================================================
  console.log('  Creating Parent User & Chat Data...');

  // Create a User for the first parent (Rajesh Sharma) for login
  const parentPasswordHash = await hashPassword('password123');
  const parentUser = await prisma.user.create({
    data: {
      email: 'rajesh.sharma@email.com',
      password: parentPasswordHash,
      name: 'Rajesh Sharma',
      phone: parentRecords[0].phone,
      role: 'PARENT',
      isActive: true,
      schoolId: school.id,
      branchId: branch.id,
    },
  });

  // Create chat threads between parent and teacher of Nursery-A
  const nurseryACls = classRecords.find(c => c.name === 'Nursery-A')!;
  const nurseryATeacher = teacherRecords.find(t => t.className === 'Nursery-A');

  if (nurseryATeacher) {
    const teacherUser = await prisma.user.findFirst({
      where: { email: 'kavitha.raman@littlestars.com' },
    });

    if (teacherUser) {
      // Thread 1: Parent of Aarav (student 0) with Nursery-A teacher
      const thread1 = await prisma.chatThread.create({
        data: {
          type: 'DIRECT',
          name: 'Rajesh Sharma - Kavitha Raman',
          schoolId: school.id,
          branchId: branch.id,
        },
      });

      await prisma.chatParticipant.create({
        data: { threadId: thread1.id, userId: parentUser.id, role: 'member' },
      });
      await prisma.chatParticipant.create({
        data: { threadId: thread1.id, userId: teacherUser.id, role: 'admin' },
      });

      // Messages in thread 1
      const messages1 = [
        { senderId: teacherUser.id, content: 'Good morning! Raj had a great day today. He participated well in the art activity.', type: 'TEXT' as const },
        { senderId: parentUser.id, content: 'That\'s wonderful to hear! He was excited about painting this morning.', type: 'TEXT' as const },
        { senderId: teacherUser.id, content: 'Yes, he was very creative. I\'ll share some photos of his artwork soon.', type: 'TEXT' as const },
        { senderId: parentUser.id, content: 'Thank you for the update! Looking forward to seeing them.', type: 'TEXT' as const },
        { senderId: teacherUser.id, content: 'Raj is doing well today. He made a new friend during outdoor play.', type: 'TEXT' as const },
      ];

      for (let mi = 0; mi < messages1.length; mi++) {
        const msg = messages1[mi];
        await prisma.message.create({
          data: {
            threadId: thread1.id,
            senderId: msg.senderId,
            content: msg.content,
            type: msg.type,
            createdAt: daysAgo(messages1.length - 1 - mi),
          },
        });
      }
    }
  }

  // Thread 2: Create second thread for Nursery-B teacher (Priya Nair)
  const nurseryBTeacher = teacherRecords.find(t => t.className === 'Nursery-B');
  if (nurseryBTeacher) {
    const teacher2User = await prisma.user.findFirst({
      where: { email: 'priya.nair@littlestars.com' },
    });

    if (teacher2User) {
      const thread2 = await prisma.chatThread.create({
        data: {
          type: 'DIRECT',
          name: 'Rajesh Sharma - Priya Nair',
          schoolId: school.id,
          branchId: branch.id,
        },
      });

      await prisma.chatParticipant.create({
        data: { threadId: thread2.id, userId: parentUser.id, role: 'member' },
      });
      await prisma.chatParticipant.create({
        data: { threadId: thread2.id, userId: teacher2User.id, role: 'admin' },
      });

      const messages2 = [
        { senderId: teacher2User.id, content: 'Hello! Welcome to the new academic year. Looking forward to working with your child.', type: 'TEXT' as const },
        { senderId: parentUser.id, content: 'Thank you! We\'re excited about the year ahead.', type: 'TEXT' as const },
      ];

      for (let mi = 0; mi < messages2.length; mi++) {
        const msg = messages2[mi];
        await prisma.message.create({
          data: {
            threadId: thread2.id,
            senderId: msg.senderId,
            content: msg.content,
            type: msg.type,
            createdAt: daysAgo(3 - mi),
          },
        });
      }
    }
  }

  console.log('  ✓ Parent user, chat threads, and messages created');

  // ============================================================
  // 11e. KYC DOCUMENTS & NOTIFICATION PREFERENCES for first parent
  // ============================================================
  console.log('  Creating KYC & Notification Preferences for demo parent...');
  const firstParentId = parentRecords[0].id;

  // Create KYC document for first parent (Aadhaar - verified)
  await prisma.kycDocument.create({
    data: {
      parentId: firstParentId,
      documentType: 'AADHAAR',
      documentUrl: 'uploads/kyc/aadhaar_rajesh_sharma.pdf',
      status: 'VERIFIED',
      reviewedBy: adminUser.id,
      reviewedAt: daysAgo(10),
    },
  });

  // Create Address Proof (pending)
  await prisma.kycDocument.create({
    data: {
      parentId: firstParentId,
      documentType: 'ADDRESS_PROOF',
      documentUrl: 'uploads/kyc/address_rajesh_sharma.pdf',
      status: 'PENDING',
    },
  });

  // Update parent KYC status
  await prisma.parent.update({
    where: { id: firstParentId },
    data: {
      kycDoc: 'AADHAAR',
      kycStatus: 'PENDING', // Has one verified + one pending
      photo: null,
    },
  });

  // Create notification preferences for first parent
  await prisma.notificationPreference.create({
    data: {
      parentId: firstParentId,
      dailyUpdateApp: true,
      dailyUpdateSms: false,
      dailyUpdateEmail: false,
      observationApp: true,
      observationSms: true,
      observationEmail: false,
      feeReminderApp: true,
      feeReminderSms: true,
      feeReminderEmail: true,
      feeOverdueApp: true,
      feeOverdueSms: true,
      feeOverdueEmail: true,
      attendanceApp: false,
      attendanceSms: false,
      attendanceEmail: false,
      announcementApp: true,
      announcementSms: false,
      announcementEmail: true,
      teacherMessageApp: true,
      teacherMessageSms: false,
      teacherMessageEmail: false,
      leaveStatusApp: true,
      leaveStatusSms: false,
      leaveStatusEmail: false,
    },
  });

  // Also add KYC for second parent (rejected status demo)
  if (parentRecords.length > 1) {
    const secondParentId = parentRecords[1].id;
    await prisma.kycDocument.create({
      data: {
        parentId: secondParentId,
        documentType: 'AADHAAR',
        documentUrl: 'uploads/kyc/aadhaar_anitha_kumar.pdf',
        status: 'REJECTED',
        reviewedBy: adminUser.id,
        reviewedAt: daysAgo(5),
        rejectionReason: 'Document is blurry. Please upload a clear scan or photo.',
      },
    });
    await prisma.parent.update({
      where: { id: secondParentId },
      data: {
        kycDoc: 'AADHAAR',
        kycStatus: 'REJECTED',
        kycRejectionReason: 'Document is blurry. Please upload a clear scan or photo.',
      },
    });
  }

  console.log('  ✓ KYC documents and notification preferences created');

  // ============================================================
  // 12. DAILY UPDATES (today for first 5 students)
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
  // 13. ACTIVITIES
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
  // 14. OBSERVATIONS
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
  // 15. ANNOUNCEMENTS (5)
  // ============================================================
  console.log('  Creating Announcements...');
  const announcementDefs = [
    { title: 'Annual Day Celebration', type: 'EVENT' as const, priority: 'HIGH' as const, target: 'ALL', content: 'Annual day celebration on June 20th. All parents are cordially invited. Cultural performances by students from all classes. Please ensure your child attends the practice sessions.' },
    { title: 'Fee Payment Reminder', type: 'FEE_REMINDER' as const, priority: 'NORMAL' as const, target: 'PARENTS', content: 'June month fee is due by 5th. Late fee of Rs 50 per day applicable after 10th. Please pay on time to avoid penalties. Payment can be made via UPI, bank transfer, or at the school office.' },
    { title: 'Summer Camp Registration', type: 'GENERAL' as const, priority: 'NORMAL' as const, target: 'ALL', content: 'Summer camp registrations are now open! Limited seats available. Activities include art, dance, swimming, and nature exploration. Register before June 15th for early bird discount.' },
    { title: 'Health Check-up Drive', type: 'CONCERN' as const, priority: 'HIGH' as const, target: 'ALL', content: 'Annual health check-up for all students scheduled for next week. Pediatrician visit and dental check-up included. Please send your child in comfortable clothing.' },
    { title: 'Parent-Teacher Meeting', type: 'GENERAL' as const, priority: 'HIGH' as const, target: 'PARENTS', content: 'PTM scheduled for June 25th. Individual time slots will be shared via WhatsApp. Please ensure attendance to discuss your child progress and development.' },
  ];

  for (const ann of announcementDefs) {
    await prisma.announcement.create({
      data: {
        schoolId: school.id,
        title: ann.title,
        content: ann.content,
        type: ann.type,
        target: ann.target,
        priority: ann.priority,
        status: 'PUBLISHED',
        publishedAt: daysAgo(randomInt(1, 10)),
        createdBy: adminUser.id,
      },
    });
  }
  console.log('  ✓ 5 Announcements created');

  // ============================================================
  // 16. CRM LEADS (10 with different stages)
  // ============================================================
  console.log('  Creating CRM Leads...');
  const leadDefs = [
    { parentName: 'Vikram Malhotra', childName: 'Ayaan Malhotra', phone: '+91 9988776655', email: 'vikram.m@email.com', source: 'WEBSITE' as const, stage: 'NEW' as const, priority: 'HIGH' as const, program: 'Nursery', notes: 'Interested in full-day program' },
    { parentName: 'Sneha Kulkarni', childName: 'Riya Kulkarni', phone: '+91 8877665544', email: 'sneha.k@email.com', source: 'REFERRAL' as const, stage: 'CONTACTED' as const, priority: 'NORMAL' as const, program: 'LKG', notes: 'Referred by existing parent Rajesh Sharma' },
    { parentName: 'Deepak Chauhan', childName: 'Ayaan Chauhan', phone: '+91 7766554433', email: 'deepak.c@email.com', source: 'INSTAGRAM' as const, stage: 'VISITED' as const, priority: 'HIGH' as const, program: 'UKG', notes: 'Visited campus, impressed with facilities' },
    { parentName: 'Pooja Menon', childName: 'Aditi Menon', phone: '+91 6655443322', email: 'pooja.m@email.com', source: 'WALK_IN' as const, stage: 'APPLIED' as const, priority: 'NORMAL' as const, program: 'Nursery', notes: 'Filled application form, wants morning batch' },
    { parentName: 'Ramesh Iyer', childName: 'Karthik Iyer', phone: '+91 5544332211', source: 'FACEBOOK' as const, stage: 'ENROLLED' as const, priority: 'LOW' as const, program: 'LKG', notes: 'Admission confirmed, fee paid' },
    { parentName: 'Kavitha Subramanian', childName: 'Arjun Subramanian', phone: '+91 4433221100', source: 'GOOGLE' as const, stage: 'NEW' as const, priority: 'NORMAL' as const, program: 'Nursery', notes: 'Found via Google search, requested callback' },
    { parentName: 'Manish Agarwal', childName: 'Riya Agarwal', phone: '+91 3322110099', source: 'JUSTDIAL' as const, stage: 'LOST' as const, priority: 'LOW' as const, program: 'UKG', notes: 'Chose competitor school due to proximity' },
    { parentName: 'Saritha Nambiar', childName: 'Dev Nambiar', phone: '+91 2211009988', source: 'EVENT' as const, stage: 'CONTACTED' as const, priority: 'NORMAL' as const, program: 'LKG', notes: 'Met at education fair, showed interest' },
    { parentName: 'Harish Pillai', childName: 'Meera Pillai', phone: '+91 1100998877', source: 'NEWSPAPER' as const, stage: 'NEW' as const, priority: 'NORMAL' as const, program: 'Nursery', notes: 'Saw ad in Times of India, wants campus tour' },
    { parentName: 'Asha Desai', childName: 'Vivaan Desai', phone: '+91 9900887766', source: 'HOARDING' as const, stage: 'VISITED' as const, priority: 'HIGH' as const, program: 'LKG', notes: 'Saw billboard on highway, visited same day' },
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
        lostReason: ld.stage === 'LOST' ? 'Chose competitor school' : null,
      },
    });
    leadRecords.push({ id: lead.id, stage: ld.stage });

    // Create follow-ups for active leads
    if (['CONTACTED', 'VISITED', 'APPLIED'].includes(ld.stage)) {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          type: randomItem(['Call', 'Email', 'Visit', 'WhatsApp']),
          dateTime: daysAgo(randomInt(1, 5)),
          outcome: 'Interested',
          notes: `Discussed enrollment for ${ld.childName}. ${ld.stage === 'APPLIED' ? 'Application submitted.' : 'Parent interested, scheduling next step.'}`,
          createdBy: adminUser.id,
        },
      });
    }
  }
  console.log(`  ✓ ${leadRecords.length} CRM Leads with follow-ups created`);

  // ============================================================
  // 17. HOLIDAYS & EVENTS
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
  console.log('\n✅ PreOne seed completed successfully!');
  console.log(`  School: ${school.name}`);
  console.log(`  Branch: ${branch.name}`);
  console.log(`  Programs: ${programRecords.length} (Nursery, LKG, UKG)`);
  console.log(`  Classes: ${classRecords.length}`);
  console.log(`  Teachers: ${teacherRecords.length}`);
  console.log(`  Students: ${studentRecords.length}`);
  console.log(`  Parents: ${parentRecords.length}`);
  console.log(`  Leads: ${leadRecords.length}`);
  console.log(`  Announcements: ${announcementDefs.length}`);
  console.log('\n  🔑 Login credentials:');
  console.log('    Admin:    admin@preone.com / admin123');
  console.log('    Task Master: taskmaster@preone.com / admin123');
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
