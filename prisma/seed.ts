// ============================================================
// PreOne — Seed Script
// Populates the database with realistic Indian preschool demo data
// ============================================================

import { PrismaClient } from '@prisma/client';
import { createHmac, randomBytes } from 'crypto';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

// ============================================================
// HELPERS
// ============================================================

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHmac('sha256', salt).update(password).digest('hex');
  return `${salt}:${hash}`;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
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

// Create a Date in UTC from year, month (0-indexed), day, hour, minute
function utcDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
}

const ACADEMIC_YEAR = '2024-2025';
const CURRENT_PERIOD = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
const CURRENT_QUARTER = `${new Date().getFullYear()}-Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;

// ============================================================
// MAIN SEED
// ============================================================

async function main() {
  console.log('🌱 Starting PreOne seed...');

  // Clean existing data (order matters for foreign keys)
  console.log('  Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.milestoneTimeline.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.aIObservation.deleteMany();
  await prisma.growthScore.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.dailyUpdate.deleteMany();
  await prisma.feeReminder.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.feeStructure.deleteMany();
  await prisma.staffAttendance.deleteMany();
  await prisma.studentAttendance.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.pickupDrop.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.route.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatParticipant.deleteMany();
  await prisma.chatThread.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.event.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.workSchedule.deleteMany();
  await prisma.teacherQualification.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.studentParent.deleteMany();
  await prisma.sibling.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.section.deleteMany();
  await prisma.class.deleteMany();
  await prisma.program.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.otp.deleteMany();
  await prisma.user.deleteMany();
  await prisma.schoolSetting.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.school.deleteMany();
  console.log('  ✓ Cleaned existing data');

  // ============================================================
  // 1. SCHOOL & BRANCH
  // ============================================================
  console.log('  Creating School & Branch...');
  const school = await prisma.school.create({
    data: {
      name: 'Little Stars Preschool',
      tagline: 'Where Every Child Shines Bright',
      description: 'A leading preschool chain in Maharashtra providing world-class early education with Indian values',
      ownerName: 'Sunil Mehta',
      ownerEmail: 'sunil@littlestars.com',
      ownerPhone: '+91 98200 12345',
      address: 'FC Road, Shivajinagar, Pune, Maharashtra 411005',
      isActive: true,
    },
  });

  const branch = await prisma.branch.create({
    data: {
      schoolId: school.id,
      name: 'Little Stars - Pune',
      code: 'LS-PUNE',
      address: '42, Koregaon Park Road, Near MGF Mall, Pune 411001',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      pincode: '411001',
      phone: '+91 20 2613 4567',
      email: 'pune@littlestars.com',
      latitude: 18.5364,
      longitude: 73.8938,
      isActive: true,
    },
  });
  console.log('  ✓ School & Branch created');

  // ============================================================
  // 2. USERS (SuperAdmin, Owner, Teachers, Parents)
  // ============================================================
  console.log('  Creating Users...');
  const passwordHash = hashPassword('password123');

  const superAdminUser = await prisma.user.create({
    data: { email: 'admin@preone.com', phone: '+91 99000 00001', passwordHash, role: 'SuperAdmin', isActive: true, isVerified: true, branchId: branch.id },
  });

  const ownerUser = await prisma.user.create({
    data: { email: 'owner@littlestars.com', phone: '+91 98200 12345', passwordHash, role: 'Owner', isActive: true, isVerified: true, branchId: branch.id },
  });

  // Teacher users
  const teacherData = [
    { firstName: 'Kavitha', lastName: 'Raman', email: 'kavitha.raman@littlestars.com', phone: '+91 98123 45670', gender: 'Female', qualification: 'PhD Early Education', specialization: 'Montessori Method', experience: 12, employeeId: 'TCH001', rating: 4.9, className: 'Nursery-A' },
    { firstName: 'Priya', lastName: 'Menon', email: 'priya.menon@littlestars.com', phone: '+91 87234 56789', gender: 'Female', qualification: 'M.Ed', specialization: 'Child Psychology', experience: 8, employeeId: 'TCH002', rating: 4.7, className: 'LKG-A' },
    { firstName: 'Sunita', lastName: 'Verma', email: 'sunita.verma@littlestars.com', phone: '+91 76345 67890', gender: 'Female', qualification: 'B.Ed + ECE Diploma', specialization: 'Language Development', experience: 10, employeeId: 'TCH003', rating: 4.8, className: 'UKG-A' },
    { firstName: 'Rashmi', lastName: 'Iyer', email: 'rashmi.iyer@littlestars.com', phone: '+91 65456 78901', gender: 'Female', qualification: 'M.Ed Special Needs', specialization: 'Inclusive Education', experience: 6, employeeId: 'TCH004', rating: 4.6, className: 'Nursery-B' },
    { firstName: 'Anita', lastName: 'Desai', email: 'anita.desai@littlestars.com', phone: '+91 54567 89012', gender: 'Female', qualification: 'B.Ed + Art Therapy', specialization: 'Creative Arts', experience: 5, employeeId: 'TCH005', rating: 4.5, className: 'LKG-B' },
    { firstName: 'Meera', lastName: 'Krishnan', email: 'meera.krishnan@littlestars.com', phone: '+91 43678 90123', gender: 'Female', qualification: 'M.Sc + B.Ed', specialization: 'STEM for Kids', experience: 9, employeeId: 'TCH006', rating: 4.8, className: null }, // float
  ];

  const teacherUsers = [];
  for (const td of teacherData) {
    const user = await prisma.user.create({
      data: { email: td.email, phone: td.phone, passwordHash, role: 'Teacher', isActive: true, isVerified: true, branchId: branch.id },
    });
    teacherUsers.push({ ...td, userId: user.id });
  }

  // Parent users (10)
  const parentInfos = [
    { firstName: 'Rajesh', lastName: 'Sharma', email: 'rajesh.sharma@email.com', phone: '+91 98765 43210', relation: 'Father', occupation: 'Software Engineer', company: 'Infosys' },
    { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@email.com', phone: '+91 87654 32109', relation: 'Mother', occupation: 'Doctor', company: 'Sahyadri Hospital' },
    { firstName: 'Amit', lastName: 'Kumar', email: 'amit.kumar@email.com', phone: '+91 76543 21098', relation: 'Father', occupation: 'Businessman', company: 'Kumar Enterprises' },
    { firstName: 'Sunita', lastName: 'Singh', email: 'sunita.singh@email.com', phone: '+91 65432 10987', relation: 'Mother', occupation: 'Teacher', company: 'DPS Pune' },
    { firstName: 'Venkat', lastName: 'Reddy', email: 'venkat.reddy@email.com', phone: '+91 54321 09876', relation: 'Father', occupation: 'Bank Manager', company: 'SBI' },
    { firstName: 'Neha', lastName: 'Gupta', email: 'neha.gupta@email.com', phone: '+91 43210 98765', relation: 'Mother', occupation: 'Architect', company: 'Design Studio' },
    { firstName: 'Sanjay', lastName: 'Joshi', email: 'sanjay.joshi@email.com', phone: '+91 32109 87654', relation: 'Father', occupation: 'Professor', company: 'Pune University' },
    { firstName: 'Lakshmi', lastName: 'Nair', email: 'lakshmi.nair@email.com', phone: '+91 21098 76543', relation: 'Mother', occupation: 'CA', company: 'Nair & Associates' },
    { firstName: 'Rahul', lastName: 'Das', email: 'rahul.das@email.com', phone: '+91 10987 65432', relation: 'Father', occupation: 'Marketing Director', company: 'Tata Motors' },
    { firstName: 'Imran', lastName: 'Khan', email: 'imran.khan@email.com', phone: '+91 09876 54321', relation: 'Father', occupation: 'Restaurant Owner', company: 'Spice Garden' },
  ];

  const parentUsers = [];
  for (const pi of parentInfos) {
    const user = await prisma.user.create({
      data: { email: pi.email, phone: pi.phone, passwordHash, role: 'Parent', isActive: true, isVerified: true, branchId: branch.id },
    });
    parentUsers.push({ ...pi, userId: user.id });
  }
  console.log(`  ✓ Created ${2 + teacherUsers.length + parentUsers.length} users`);

  // ============================================================
  // 3. PROGRAMS & CLASSES
  // ============================================================
  console.log('  Creating Programs & Classes...');
  const programs = [
    { name: 'PlayGroup', code: 'PG', minAge: 30, maxAge: 42, sortOrder: 1, color: '#f59e0b', icon: '🍼', desc: 'Foundation program for toddlers' },
    { name: 'Nursery', code: 'NUR', minAge: 36, maxAge: 48, sortOrder: 2, color: '#10b981', icon: '🌱', desc: 'Pre-school readiness program' },
    { name: 'LKG', code: 'LKG', minAge: 48, maxAge: 60, sortOrder: 3, color: '#3b82f6', icon: '📚', desc: 'Lower Kindergarten' },
    { name: 'UKG', code: 'UKG', minAge: 60, maxAge: 72, sortOrder: 4, color: '#8b5cf6', icon: '🎓', desc: 'Upper Kindergarten' },
  ];

  const programRecords = [];
  for (const p of programs) {
    const prog = await prisma.program.create({
      data: { branchId: branch.id, name: p.name, code: p.code, description: p.desc, minAge: p.minAge, maxAge: p.maxAge, sortOrder: p.sortOrder, color: p.color, icon: p.icon, isActive: true },
    });
    programRecords.push({ ...p, id: prog.id });
  }

  const classDefs = [
    { name: 'PG-A', capacity: 25, roomNo: '101', floor: 'Ground', programName: 'PlayGroup', teacherEmpId: null },
    { name: 'Nursery-A', capacity: 30, roomNo: '201', floor: 'First', programName: 'Nursery', teacherEmpId: 'TCH001' },
    { name: 'Nursery-B', capacity: 30, roomNo: '202', floor: 'First', programName: 'Nursery', teacherEmpId: 'TCH004' },
    { name: 'LKG-A', capacity: 35, roomNo: '301', floor: 'Second', programName: 'LKG', teacherEmpId: 'TCH002' },
    { name: 'LKG-B', capacity: 35, roomNo: '302', floor: 'Second', programName: 'LKG', teacherEmpId: 'TCH005' },
    { name: 'UKG-A', capacity: 40, roomNo: '401', floor: 'Third', programName: 'UKG', teacherEmpId: 'TCH003' },
  ];
  console.log('  ✓ Programs created');

  // ============================================================
  // 4. TEACHERS
  // ============================================================
  console.log('  Creating Teachers...');
  const teacherRecords = [];
  for (const td of teacherUsers) {
    const teacher = await prisma.teacher.create({
      data: {
        userId: td.userId,
        branchId: branch.id,
        employeeId: td.employeeId,
        firstName: td.firstName,
        lastName: td.lastName,
        phone: td.phone,
        email: td.email,
        dob: new Date(1985 + randomInt(0, 10), randomInt(0, 11), randomInt(1, 28)),
        gender: td.gender,
        qualification: td.qualification,
        specialization: td.specialization,
        experience: td.experience,
        status: 'Active',
        staffType: 'Teaching',
        address: `${randomInt(1, 200)}, Koregaon Park, Pune 411001`,
      },
    });
    teacherRecords.push({ ...td, id: teacher.id });

    // Teacher qualifications
    await prisma.teacherQualification.create({
      data: {
        teacherId: teacher.id,
        degree: td.qualification,
        institution: randomItem(['University of Pune', 'Mumbai University', 'Bharati Vidyapeeth', 'Savitribai Phule Pune University']),
        year: 2010 + randomInt(0, 8),
        grade: randomItem(['First Class', 'Distinction', 'First Class with Distinction']),
      },
    });

    // Performance review
    await prisma.performanceReview.create({
      data: {
        teacherId: teacher.id,
        reviewerId: ownerUser.id,
        period: CURRENT_QUARTER,
        rating: td.rating,
        teachingQuality: parseFloat((td.rating - 0.1).toFixed(1)),
        studentEngagement: parseFloat((td.rating - 0.2).toFixed(1)),
        communication: parseFloat((td.rating + 0.05 > 5 ? 5 : td.rating + 0.05).toFixed(1)),
        professionalism: parseFloat((td.rating - 0.05).toFixed(1)),
        comments: `Excellent performance by ${td.firstName}. Keeps students engaged and maintains a positive learning environment.`,
        strengths: `${td.specialization} expertise, classroom management`,
        areasOfImprovement: 'Integration of technology in teaching',
        status: 'Acknowledged',
        reviewedAt: daysAgo(15),
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
          isOff: false,
        },
      });
    }
    // Saturday - half day
    await prisma.workSchedule.create({
      data: { teacherId: teacher.id, dayOfWeek: 6, startTime: '08:00', endTime: '12:00', isOff: false },
    });
    // Sunday - off
    await prisma.workSchedule.create({
      data: { teacherId: teacher.id, dayOfWeek: 0, startTime: '00:00', endTime: '00:00', isOff: true },
    });
  }
  console.log('  ✓ Teachers created with qualifications, reviews, schedules');

  // ============================================================
  // 5. CLASSES (need teacher IDs now)
  // ============================================================
  console.log('  Creating Classes...');
  const classRecords = [];
  for (const cd of classDefs) {
    const program = programRecords.find(p => p.name === cd.programName)!;
    const teacher = teacherRecords.find(t => t.employeeId === cd.teacherEmpId);
    const cls = await prisma.class.create({
      data: {
        branchId: branch.id,
        programId: program.id,
        name: cd.name,
        capacity: cd.capacity,
        roomNo: cd.roomNo,
        floor: cd.floor,
        teacherId: teacher?.id || null,
        academicYear: ACADEMIC_YEAR,
        isActive: true,
      },
    });
    classRecords.push({ ...cd, id: cls.id, programId: program.id });
  }
  console.log('  ✓ Classes created');

  // ============================================================
  // 6. PARENTS
  // ============================================================
  console.log('  Creating Parents...');
  const parentRecords = [];
  for (const pi of parentUsers) {
    const parent = await prisma.parent.create({
      data: {
        userId: pi.userId,
        firstName: pi.firstName,
        lastName: pi.lastName,
        phone: pi.phone,
        email: pi.email,
        relation: pi.relation,
        occupation: pi.occupation,
        company: pi.company,
        address: `${randomInt(1, 500)}, ${randomItem(['Koregaon Park', 'Viman Nagar', 'Baner', 'Aundh', 'Kothrud', 'Hadapsar'])}, Pune 41100${randomInt(1, 9)}`,
        isPrimary: true,
        kycStatus: randomItem(['Verified', 'Verified', 'Verified', 'Pending']),
        kycDocType: 'Aadhaar',
        kycDocNumber: `${randomInt(1000, 9999)} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`,
        kycVerifiedAt: randomItem([daysAgo(30), daysAgo(60), daysAgo(90)]),
      },
    });
    parentRecords.push({ ...pi, id: parent.id });
  }
  console.log('  ✓ Parents created');

  // ============================================================
  // 7. STUDENTS (20+)
  // ============================================================
  console.log('  Creating Students...');
  const studentDefs = [
    { firstName: 'Aarav', lastName: 'Sharma', className: 'Nursery-A', gender: 'Male', bloodGroup: 'B+', parentIdx: 0, dob: new Date(2021, 4, 15), admissionNo: 'LS2024-001' },
    { firstName: 'Ananya', lastName: 'Patel', className: 'LKG-B', gender: 'Female', bloodGroup: 'O+', parentIdx: 1, dob: new Date(2020, 7, 22), admissionNo: 'LS2024-002' },
    { firstName: 'Vivaan', lastName: 'Kumar', className: 'UKG-A', gender: 'Male', bloodGroup: 'A+', parentIdx: 2, dob: new Date(2019, 11, 3), admissionNo: 'LS2024-003' },
    { firstName: 'Diya', lastName: 'Singh', className: 'Nursery-B', gender: 'Female', bloodGroup: 'AB+', parentIdx: 3, dob: new Date(2021, 10, 18), admissionNo: 'LS2024-004' },
    { firstName: 'Arjun', lastName: 'Reddy', className: 'LKG-A', gender: 'Male', bloodGroup: 'B-', parentIdx: 4, dob: new Date(2020, 2, 7), admissionNo: 'LS2024-005' },
    { firstName: 'Isha', lastName: 'Gupta', className: 'UKG-A', gender: 'Female', bloodGroup: 'O-', parentIdx: 5, dob: new Date(2019, 6, 25), admissionNo: 'LS2024-006' },
    { firstName: 'Kabir', lastName: 'Joshi', className: 'Nursery-A', gender: 'Male', bloodGroup: 'A-', parentIdx: 6, dob: new Date(2021, 8, 12), admissionNo: 'LS2024-007' },
    { firstName: 'Meera', lastName: 'Nair', className: 'LKG-B', gender: 'Female', bloodGroup: 'B+', parentIdx: 7, dob: new Date(2020, 0, 30), admissionNo: 'LS2024-008' },
    { firstName: 'Rohan', lastName: 'Das', className: 'UKG-A', gender: 'Male', bloodGroup: 'O+', parentIdx: 8, dob: new Date(2019, 5, 14), admissionNo: 'LS2024-009' },
    { firstName: 'Sara', lastName: 'Khan', className: 'Nursery-B', gender: 'Female', bloodGroup: 'AB-', parentIdx: 9, dob: new Date(2021, 3, 28), admissionNo: 'LS2024-010' },
    // 10+ more students
    { firstName: 'Advait', lastName: 'Pillai', className: 'PG-A', gender: 'Male', bloodGroup: 'A+', parentIdx: 0, dob: new Date(2022, 1, 10), admissionNo: 'LS2024-011' },
    { firstName: 'Saisha', lastName: 'Sharma', className: 'PG-A', gender: 'Female', bloodGroup: 'B+', parentIdx: 1, dob: new Date(2022, 5, 20), admissionNo: 'LS2024-012' },
    { firstName: 'Vihaan', lastName: 'Patel', className: 'Nursery-A', gender: 'Male', bloodGroup: 'O+', parentIdx: 2, dob: new Date(2021, 6, 8), admissionNo: 'LS2024-013' },
    { firstName: 'Anika', lastName: 'Reddy', className: 'Nursery-B', gender: 'Female', bloodGroup: 'AB+', parentIdx: 3, dob: new Date(2021, 9, 15), admissionNo: 'LS2024-014' },
    { firstName: 'Ayaan', lastName: 'Kumar', className: 'LKG-A', gender: 'Male', bloodGroup: 'A-', parentIdx: 4, dob: new Date(2020, 3, 22), admissionNo: 'LS2024-015' },
    { firstName: 'Prisha', lastName: 'Gupta', className: 'LKG-B', gender: 'Female', bloodGroup: 'B-', parentIdx: 5, dob: new Date(2020, 8, 5), admissionNo: 'LS2024-016' },
    { firstName: 'Reyansh', lastName: 'Singh', className: 'LKG-A', gender: 'Male', bloodGroup: 'O-', parentIdx: 6, dob: new Date(2020, 4, 18), admissionNo: 'LS2024-017' },
    { firstName: 'Kiara', lastName: 'Iyer', className: 'UKG-A', gender: 'Female', bloodGroup: 'A+', parentIdx: 7, dob: new Date(2019, 1, 25), admissionNo: 'LS2024-018' },
    { firstName: 'Arnav', lastName: 'Joshi', className: 'Nursery-A', gender: 'Male', bloodGroup: 'B+', parentIdx: 8, dob: new Date(2021, 2, 14), admissionNo: 'LS2024-019' },
    { firstName: 'Myra', lastName: 'Nair', className: 'LKG-B', gender: 'Female', bloodGroup: 'O+', parentIdx: 9, dob: new Date(2020, 10, 30), admissionNo: 'LS2024-020' },
    { firstName: 'Aadhya', lastName: 'Das', className: 'PG-A', gender: 'Female', bloodGroup: 'AB+', parentIdx: 0, dob: new Date(2022, 3, 5), admissionNo: 'LS2024-021' },
    { firstName: 'Ishaan', lastName: 'Khan', className: 'Nursery-B', gender: 'Male', bloodGroup: 'A-', parentIdx: 1, dob: new Date(2021, 7, 19), admissionNo: 'LS2024-022' },
  ];

  const studentRecords = [];
  for (const sd of studentDefs) {
    const cls = classRecords.find(c => c.name === sd.className)!;
    const student = await prisma.student.create({
      data: {
        branchId: branch.id,
        admissionNo: sd.admissionNo,
        firstName: sd.firstName,
        lastName: sd.lastName,
        dob: sd.dob,
        gender: sd.gender,
        bloodGroup: sd.bloodGroup,
        address: `${randomInt(1, 500)}, ${randomItem(['Koregaon Park', 'Viman Nagar', 'Baner', 'Aundh', 'Kothrud', 'Hadapsar'])}, Pune 41100${randomInt(1, 9)}`,
        emergencyContact: `+91 9${randomInt(100000000, 999999999)}`,
        classId: cls.id,
        status: 'Active',
        enrollmentDate: daysAgo(randomInt(30, 180)),
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

    studentRecords.push({ ...sd, id: student.id, classId: cls.id, parentId: parentRec.id });
  }
  console.log(`  ✓ Created ${studentRecords.length} students`);

  // ============================================================
  // 8. FEE STRUCTURES
  // ============================================================
  console.log('  Creating Fee Structures...');
  const feeStructureDefs = [
    { programName: 'PlayGroup', feeType: 'Tuition', name: 'Tuition Fee', amount: 6000, frequency: 'Monthly' },
    { programName: 'PlayGroup', feeType: 'Activity', name: 'Activity Fee', amount: 1500, frequency: 'Monthly' },
    { programName: 'PlayGroup', feeType: 'Transport', name: 'Transport Fee', amount: 3000, frequency: 'Monthly' },
    { programName: 'Nursery', feeType: 'Tuition', name: 'Tuition Fee', amount: 7500, frequency: 'Monthly' },
    { programName: 'Nursery', feeType: 'Activity', name: 'Activity Fee', amount: 2000, frequency: 'Monthly' },
    { programName: 'Nursery', feeType: 'Transport', name: 'Transport Fee', amount: 3000, frequency: 'Monthly' },
    { programName: 'LKG', feeType: 'Tuition', name: 'Tuition Fee', amount: 8500, frequency: 'Monthly' },
    { programName: 'LKG', feeType: 'Activity', name: 'Activity Fee', amount: 2000, frequency: 'Monthly' },
    { programName: 'LKG', feeType: 'Transport', name: 'Transport Fee', amount: 3000, frequency: 'Monthly' },
    { programName: 'UKG', feeType: 'Tuition', name: 'Tuition Fee', amount: 9500, frequency: 'Monthly' },
    { programName: 'UKG', feeType: 'Activity', name: 'Activity Fee', amount: 2500, frequency: 'Monthly' },
    { programName: 'UKG', feeType: 'Transport', name: 'Transport Fee', amount: 3000, frequency: 'Monthly' },
  ];

  const feeStructureRecords = [];
  for (const fsd of feeStructureDefs) {
    const program = programRecords.find(p => p.name === fsd.programName)!;
    // Get all classes for this program
    const programClasses = classRecords.filter(c => c.programId === program.id);
    for (const cls of programClasses) {
      const fs = await prisma.feeStructure.create({
        data: {
          branchId: branch.id,
          classId: cls.id,
          programId: program.id,
          name: fsd.name,
          feeType: fsd.feeType,
          amount: fsd.amount,
          frequency: fsd.frequency,
          academicYear: ACADEMIC_YEAR,
          dueDay: 5,
          lateFeePerDay: 50,
          lateFeeMax: 500,
          isActive: true,
        },
      });
      feeStructureRecords.push({ ...fsd, id: fs.id, classId: cls.id });
    }
  }
  console.log('  ✓ Fee structures created');

  // ============================================================
  // 9. INVOICES & PAYMENTS (current + past 5 months)
  // ============================================================
  console.log('  Creating Invoices & Payments...');
  let invoiceCounter = 1;
  let receiptCounter = 1;
  const paymentMethods = ['UPI', 'Cash', 'Card', 'BankTransfer', 'Online'];

  // Generate invoices for past 6 months
  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const now = new Date();
    const invYear = now.getMonth() - monthOffset >= 0 ? now.getFullYear() : now.getFullYear() - 1;
    const invMonth = (now.getMonth() - monthOffset + 12) % 12;
    const periodStr = `${invYear}-${String(invMonth + 1).padStart(2, '0')}`;
    const dueDate = utcDate(invYear, invMonth, 5);

    for (const student of studentRecords) {
      // Get the fee structures for this student's class
      const classFeeStructures = feeStructureRecords.filter(f => f.classId === student.classId);

      // For past months, only create tuition invoices to keep data reasonable
      const feesToInvoice = monthOffset > 0
        ? classFeeStructures.filter(f => f.feeType === 'Tuition')
        : classFeeStructures; // current month: all fee types

      for (const fs of feesToInvoice) {
        // Determine invoice status based on month
        let invoiceStatus: string;
        let paidAmount = 0;

        if (monthOffset > 0) {
          // Past months — mostly paid
          const rand = Math.random();
          if (rand < 0.90) {
            invoiceStatus = 'Paid';
            paidAmount = fs.amount;
          } else if (rand < 0.95) {
            invoiceStatus = 'Pending';
            paidAmount = 0;
          } else {
            invoiceStatus = 'Overdue';
            paidAmount = 0;
          }
        } else {
          // Current month — mix of statuses
          const rand = Math.random();
          if (rand < 0.60) {
            invoiceStatus = 'Paid';
            paidAmount = fs.amount;
          } else if (rand < 0.85) {
            invoiceStatus = 'Pending';
            paidAmount = 0;
          } else {
            invoiceStatus = 'Overdue';
            paidAmount = 0;
          }
        }

        const currentDueDate = new Date(dueDate);
        if (invoiceStatus === 'Overdue') {
          currentDueDate.setDate(currentDueDate.getDate() - 15);
        }

        const invoice = await prisma.invoice.create({
          data: {
            invoiceNo: `INV-${ACADEMIC_YEAR}-${String(invoiceCounter++).padStart(4, '0')}`,
            studentId: student.id,
            branchId: branch.id,
            feeStructureId: fs.id,
            academicYear: ACADEMIC_YEAR,
            period: periodStr,
            amount: fs.amount,
            discount: 0,
            lateFee: invoiceStatus === 'Overdue' ? 500 : 0,
            totalAmount: invoiceStatus === 'Overdue' ? fs.amount + 500 : fs.amount,
            paidAmount: paidAmount,
            dueDate: currentDueDate,
            status: invoiceStatus,
            issuedAt: utcDate(invYear, invMonth, 1),
          },
        });

        // If Paid, create Payment + Receipt
        if (invoiceStatus === 'Paid') {
          const payDate = utcDate(invYear, invMonth, randomInt(5, 15));
          const payment = await prisma.payment.create({
            data: {
              invoiceId: invoice.id,
              amount: paidAmount,
              paymentMethod: randomItem(paymentMethods),
              transactionRef: `TXN${payDate.getTime()}${randomInt(100, 999)}`,
              status: 'Success',
              paidBy: student.parentId,
              paidByName: `${student.firstName} Parent`,
              paidAt: payDate,
              receivedBy: ownerUser.id,
            },
          });

          await prisma.receipt.create({
            data: {
              paymentId: payment.id,
              receiptNo: `RCT-${ACADEMIC_YEAR}-${String(receiptCounter++).padStart(4, '0')}`,
              amount: paidAmount,
              issuedAt: payDate,
              issuedBy: ownerUser.id,
            },
          });
        }
      }
    }
  }
  console.log('  ✓ Invoices & Payments created (6 months of data)');

  // ============================================================
  // 10. ATTENDANCE (past 30 days)
  // ============================================================
  console.log('  Creating Attendance (30 days)...');
  const attendanceStatuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Absent', 'Late', 'HalfDay'];

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const date = daysAgo(dayOffset);
    // Skip Sundays
    if (date.getDay() === 0) continue;

    // Student attendance
    for (const student of studentRecords) {
      const status = randomItem(attendanceStatuses);
      const checkInHour = status === 'Late' ? randomInt(9, 10) : randomInt(8, 9);
      const checkInMin = randomInt(0, 59);

      await prisma.studentAttendance.create({
        data: {
          studentId: student.id,
          date: date,
          status: status,
          method: randomItem(['Manual', 'QR', 'Face']),
          checkInTime: status !== 'Absent' ? utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), checkInHour, checkInMin) : null,
          checkOutTime: status !== 'Absent' ? utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), randomInt(14, 15), randomInt(0, 59)) : null,
          markedBy: ownerUser.id,
        },
      });
    }

    // Staff attendance
    for (const teacher of teacherRecords) {
      const status = Math.random() < 0.95 ? 'Present' : (Math.random() < 0.5 ? 'Absent' : 'Late');
      await prisma.staffAttendance.create({
        data: {
          teacherId: teacher.id,
          date: date,
          status: status,
          method: 'Manual',
          checkInTime: status !== 'Absent' ? utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), randomInt(7, 8), randomInt(0, 59)) : null,
          checkOutTime: status !== 'Absent' ? utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), randomInt(14, 16), randomInt(0, 59)) : null,
          workingHours: status !== 'Absent' ? randomFloat(7, 8.5) : 0,
        },
      });
    }
  }
  console.log('  ✓ Attendance created');

  // ============================================================
  // 11. GROWTH SCORES
  // ============================================================
  console.log('  Creating Growth Scores...');
  for (const student of studentRecords) {
    const cls = classRecords.find(c => c.id === student.classId)!;
    let baseScore: number;
    if (cls.name.includes('PG')) baseScore = 45;
    else if (cls.name.includes('Nursery')) baseScore = 55;
    else if (cls.name.includes('LKG')) baseScore = 65;
    else baseScore = 75;

    const creativity = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const communication = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const socialSkills = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const confidence = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const cognitive = Math.min(100, Math.max(10, baseScore + randomInt(-15, 15)));
    const physical = Math.min(100, Math.max(10, baseScore + randomInt(-10, 15)));
    const overall = parseFloat(((creativity + communication + socialSkills + confidence + cognitive + physical) / 6).toFixed(1));

    const classTeacher = teacherRecords.find(t => t.className === cls.name);

    await prisma.growthScore.create({
      data: {
        studentId: student.id,
        period: CURRENT_QUARTER,
        creativity,
        communication,
        socialSkills,
        confidence,
        cognitive,
        physical,
        overall,
        assessedBy: classTeacher?.id,
        assessmentDate: daysAgo(randomInt(5, 30)),
        comments: `${student.firstName} is showing good progress in ${randomItem(['creativity', 'communication', 'social skills', 'physical activities'])}.`,
      },
    });
  }
  console.log('  ✓ Growth scores created');

  // ============================================================
  // 12. DAILY UPDATES (today, first 5 students)
  // ============================================================
  console.log('  Creating Daily Updates...');
  const moods = ['Happy', 'Calm', 'Excited', 'Tired', 'Fussy'];
  const foodStatuses = ['Eaten', 'Partial', 'NotEaten'];
  const sleepQualities = ['Good', 'Fair', 'Poor'];
  const breakfastMenus = ['Idli with chutney', 'Poha', 'Upma', 'Paratha with curd', 'Dosa with sambar'];
  const lunchMenus = ['Rice with dal', 'Chapati with sabzi', 'Khichdi', 'Pulao with raita', 'Biryani'];
  const snacksMenus = ['Fruit bowl', 'Biscuits with milk', 'Sandwich', 'Sprouts chaat', 'Banana shake'];

  for (let i = 0; i < Math.min(5, studentRecords.length); i++) {
    const student = studentRecords[i];
    const classTeacher = teacherRecords.find(t => t.className === student.className);

    await prisma.dailyUpdate.create({
      data: {
        studentId: student.id,
        date: today(),
        teacherId: classTeacher?.userId,
        breakfast: randomItem(['Eaten', 'Eaten', 'Partial']),
        breakfastMenu: randomItem(breakfastMenus),
        lunch: randomItem(['Eaten', 'Eaten', 'Partial']),
        lunchMenu: randomItem(lunchMenus),
        snacks: randomItem(['Eaten', 'Eaten', 'Partial']),
        snacksMenu: randomItem(snacksMenus),
        foodNotes: Math.random() > 0.7 ? 'Ate well today' : null,
        sleepStart: utcDate(today().getUTCFullYear(), today().getUTCMonth(), today().getUTCDate(), 12, 30),
        sleepEnd: utcDate(today().getUTCFullYear(), today().getUTCMonth(), today().getUTCDate(), 13, 30),
        sleepDuration: 60,
        sleepQuality: randomItem(sleepQualities),
        morningMood: randomItem(moods),
        afternoonMood: randomItem(moods),
        moodNotes: 'Generally cheerful throughout the day',
        pottyCount: randomInt(1, 3),
        pottyType: randomItem(['Dry', 'Wet']),
        waterGlasses: randomInt(3, 8),
        highlights: `Had a fun day doing ${randomItem(['painting', 'coloring', 'story time', 'outdoor play', 'rhyme recitation'])}`,
        status: 'Published',
        publishedAt: new Date(),
      },
    });
  }
  console.log('  ✓ Daily updates created');

  // ============================================================
  // 13. ACTIVITIES
  // ============================================================
  console.log('  Creating Activities...');
  const activityDefs = [
    { title: 'Color Day Celebration', type: 'Art', date: daysAgo(-3), startTime: '09:00', endTime: '11:00', className: null, teacherEmpId: 'TCH004', status: 'Planned', desc: 'Children explore colors through painting, craft, and creative play', subject: 'Creative' },
    { title: 'Rhyme Recitation', type: 'Music', date: daysAgo(5), startTime: '10:00', endTime: '11:00', className: 'Nursery-A', teacherEmpId: 'TCH001', status: 'Completed', desc: 'Nursery rhymes competition for all nursery sections', subject: 'Language' },
    { title: 'Sports Day Practice', type: 'Sports', date: daysAgo(-2), startTime: '08:00', endTime: '10:00', className: null, teacherEmpId: 'TCH006', status: 'Planned', desc: 'Practice session for upcoming annual sports day', subject: 'Physical' },
    { title: 'Story Telling Session', type: 'Story', date: daysAgo(4), startTime: '11:00', endTime: '12:00', className: null, teacherEmpId: 'TCH003', status: 'Completed', desc: 'Interactive story telling with puppets and props', subject: 'Language' },
    { title: "Father's Day Craft", type: 'Craft', date: daysAgo(-5), startTime: '09:00', endTime: '10:30', className: null, teacherEmpId: 'TCH004', status: 'Planned', desc: "Handmade card and craft activity for Father's Day", subject: 'Creative' },
    { title: 'Nature Walk', type: 'Outdoor', date: daysAgo(-1), startTime: '08:30', endTime: '09:30', className: null, teacherEmpId: 'TCH002', status: 'Planned', desc: 'Guided nature walk in school garden', subject: 'Science' },
  ];

  for (const ad of activityDefs) {
    const teacher = teacherRecords.find(t => t.employeeId === ad.teacherEmpId);
    const cls = ad.className ? classRecords.find(c => c.name === ad.className) : null;
    await prisma.activity.create({
      data: {
        branchId: branch.id,
        classId: cls?.id || null,
        teacherId: teacher?.id || null,
        title: ad.title,
        description: ad.desc,
        type: ad.type,
        subject: ad.subject,
        date: ad.date,
        startTime: ad.startTime,
        endTime: ad.endTime,
        status: ad.status,
        isPublished: ad.status === 'Completed',
      },
    });
  }
  console.log('  ✓ Activities created');

  // ============================================================
  // 14. ANNOUNCEMENTS
  // ============================================================
  console.log('  Creating Announcements...');
  const announcementDefs = [
    { title: 'Annual Day Celebration', type: 'Event', priority: 'High', audience: 'All', content: 'Annual day celebration on June 20th. All parents are cordially invited. Cultural performances by students from all classes.' },
    { title: 'Fee Payment Reminder', type: 'Fee', priority: 'Normal', audience: 'Parents', content: 'June month fee is due by 5th. Late fee of ₹50/day applicable after 10th. Please pay on time to avoid penalties.' },
    { title: 'Summer Camp Registration', type: 'Academic', priority: 'Normal', audience: 'All', content: 'Summer camp registrations are now open! Limited seats available. Activities include art, dance, swimming, and nature exploration.' },
    { title: 'Health Check-up Drive', type: 'Health', priority: 'High', audience: 'All', content: 'Annual health check-up for all students scheduled. Pediatrician visit and dental check-up included.' },
    { title: 'Parent-Teacher Meeting', type: 'Academic', priority: 'Urgent', audience: 'Parents', content: 'PTM scheduled for June 25th. Individual time slots will be shared via WhatsApp. Please ensure attendance.' },
  ];

  for (const ann of announcementDefs) {
    await prisma.announcement.create({
      data: {
        branchId: branch.id,
        title: ann.title,
        content: ann.content,
        type: ann.type,
        targetAudience: ann.audience,
        priority: ann.priority,
        isActive: true,
        createdBy: ownerUser.id,
        publishedAt: daysAgo(randomInt(1, 10)),
      },
    });
  }
  console.log('  ✓ Announcements created');

  // ============================================================
  // 15. CRM LEADS & FOLLOW-UPS
  // ============================================================
  console.log('  Creating CRM Leads...');
  const leadDefs = [
    { parentName: 'Vikram Malhotra', childName: 'Ayaan Malhotra', phone: '+91 99887 76655', email: 'vikram.m@email.com', source: 'Website', stage: 'NewInquiry', priority: 'High', program: 'Nursery', occupation: 'IT Manager', notes: 'Interested in full-day program', address: 'Viman Nagar, Pune' },
    { parentName: 'Swati Kapoor', childName: 'Riya Kapoor', phone: '+91 88776 65544', email: 'swati.k@email.com', source: 'Referral', stage: 'Visit', priority: 'Medium', program: 'LKG', occupation: 'Homemaker', notes: 'Referred by existing parent Rajesh Sharma', address: 'Baner, Pune' },
    { parentName: 'Arun Swamy', childName: 'Aditi Swamy', phone: '+91 77665 54433', email: 'arun.s@email.com', source: 'WalkIn', stage: 'Tour', priority: 'Hot', program: 'UKG', occupation: 'Doctor', notes: 'Visited campus, very impressed with facilities', address: 'Aundh, Pune' },
    { parentName: 'Nisha Agarwal', childName: 'Kian Agarwal', phone: '+91 66554 43322', email: 'nisha.a@email.com', source: 'SocialMedia', stage: 'Demo', priority: 'High', program: 'Nursery', occupation: 'Designer', notes: 'Attended demo class, liked the teaching methodology', address: 'Kothrud, Pune' },
    { parentName: 'Deepak Rao', childName: 'Saanvi Rao', phone: '+91 55443 32211', email: 'deepak.r@email.com', source: 'WhatsApp', stage: 'FollowUp', priority: 'Medium', program: 'LKG', occupation: 'Engineer', notes: 'Comparing with 2 other schools', address: 'Hadapsar, Pune' },
    { parentName: 'Pooja Bhatt', childName: 'Vihaan Bhatt', phone: '+91 44332 21100', email: 'pooja.b@email.com', source: 'Ad', stage: 'Confirmed', priority: 'High', program: 'Nursery', occupation: 'Teacher', notes: 'Admission confirmed for July batch', address: 'Koregaon Park, Pune' },
    { parentName: 'Raj Malhotra', childName: 'Anaya Malhotra', phone: '+91 33221 10099', email: 'raj.m@email.com', source: 'Referral', stage: 'Enrolled', priority: 'Low', program: 'UKG', occupation: 'Businessman', notes: 'Enrolled and fee paid', address: 'Magarpatta, Pune' },
    { parentName: 'Kavita Shah', childName: 'Arjun Shah', phone: '+91 22110 09988', email: 'kavita.s@email.com', source: 'Call', stage: 'NewInquiry', priority: 'Medium', program: 'LKG', occupation: 'Lawyer', notes: 'Called from newspaper ad, interested in campus tour', address: 'Wakad, Pune' },
  ];

  const leadRecords = [];
  for (const ld of leadDefs) {
    const lead = await prisma.lead.create({
      data: {
        branchId: branch.id,
        parentName: ld.parentName,
        parentPhone: ld.phone,
        parentEmail: ld.email,
        parentOccupation: ld.occupation,
        parentAddress: ld.address,
        childName: ld.childName,
        childDob: new Date(2020 + randomInt(0, 3), randomInt(0, 11), randomInt(1, 28)),
        childGender: Math.random() > 0.5 ? 'Male' : 'Female',
        programInterest: ld.program,
        source: ld.source,
        stage: ld.stage,
        assignedTo: ownerUser.id,
        notes: ld.notes,
        priority: ld.priority,
        nextFollowUpDate: daysAgo(-randomInt(1, 7)),
        estimatedFee: randomItem([6000, 7500, 8500, 9500]) * 12,
        interactionCount: randomInt(1, 5),
      },
    });
    leadRecords.push({ ...ld, id: lead.id });

    // Create follow-ups for each lead
    const followUpTypes = ['Call', 'Email', 'Visit', 'Meeting', 'WhatsApp'];
    const outcomes = ['Interested', 'Callback', 'VisitScheduled', 'DemoScheduled', 'Enrolled'];
    const numFollowUps = randomInt(1, 3);
    for (let i = 0; i < numFollowUps; i++) {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          type: randomItem(followUpTypes),
          notes: `${randomItem(['Discussed fee structure', 'Shared brochure', 'Campus visit arranged', 'Demo class scheduled', 'Follow-up on admission decision'])}`,
          outcome: i < numFollowUps - 1 ? randomItem(outcomes) : null,
          followUpDate: daysAgo(randomInt(1, 20)),
          conductedBy: ownerUser.id,
          nextFollowUpDate: i < numFollowUps - 1 ? daysAgo(-randomInt(1, 7)) : null,
          duration: randomInt(5, 30),
        },
      });
    }
  }
  console.log('  ✓ CRM Leads & Follow-ups created');

  // ============================================================
  // 16. HOLIDAYS
  // ============================================================
  console.log('  Creating Holidays...');
  const year = new Date().getFullYear();
  const holidayDefs = [
    { name: 'Republic Day', date: new Date(year, 0, 26), type: 'National', desc: 'National holiday — Republic Day celebrations' },
    { name: 'Holi', date: new Date(year, 2, 14), type: 'Religious', desc: 'Festival of colors — school remains closed' },
    { name: 'Independence Day', date: new Date(year, 7, 15), type: 'National', desc: 'National holiday — Independence Day' },
    { name: 'Gandhi Jayanti', date: new Date(year, 9, 2), type: 'National', desc: 'National holiday — Mahatma Gandhi\'s birthday' },
    { name: 'Diwali', date: new Date(year, 10, 1), type: 'Religious', desc: 'Diwali break — school remains closed for 5 days', endDate: new Date(year, 10, 5) },
    { name: 'Christmas', date: new Date(year, 11, 25), type: 'Religious', desc: 'Christmas break', endDate: new Date(year, 11, 31) },
  ];

  for (const hd of holidayDefs) {
    await prisma.holiday.create({
      data: {
        branchId: branch.id,
        name: hd.name,
        description: hd.desc,
        date: hd.date,
        endDate: hd.endDate || null,
        type: hd.type,
        isRecurring: true,
        isActive: true,
      },
    });
  }
  console.log('  ✓ Holidays created');

  // ============================================================
  // 17. EVENTS
  // ============================================================
  console.log('  Creating Events...');
  const eventDefs = [
    { title: 'Annual Day', type: 'Cultural', startDate: daysAgo(-15), endDate: daysAgo(-14), location: 'School Auditorium', status: 'Scheduled', color: '#f59e0b', audience: 'All' },
    { title: 'Sports Day', type: 'Sports', startDate: daysAgo(-10), endDate: daysAgo(-10), location: 'School Playground', status: 'Scheduled', color: '#10b981', audience: 'All' },
    { title: 'Fancy Dress Competition', type: 'Cultural', startDate: daysAgo(-7), endDate: daysAgo(-7), location: 'Activity Hall', status: 'Scheduled', color: '#8b5cf6', audience: 'Parents' },
  ];

  for (const ed of eventDefs) {
    await prisma.event.create({
      data: {
        branchId: branch.id,
        title: ed.title,
        type: ed.type,
        startDate: ed.startDate,
        endDate: ed.endDate,
        location: ed.location,
        organizer: ownerUser.id,
        isAllDay: true,
        targetAudience: ed.audience,
        status: ed.status,
        color: ed.color,
      },
    });
  }
  console.log('  ✓ Events created');

  // ============================================================
  // 18. SCHOOL SETTINGS
  // ============================================================
  console.log('  Creating School Settings...');
  const settings = [
    { key: 'academicYear', value: ACADEMIC_YEAR },
    { key: 'feeDueDay', value: '5' },
    { key: 'lateFeePerDay', value: '50' },
    { key: 'lateFeeMax', value: '500' },
    { key: 'attendanceMethod', value: 'Manual' },
    { key: 'timezone', value: 'Asia/Kolkata' },
    { key: 'currency', value: 'INR' },
    { key: 'schoolStartTime', value: '08:00' },
    { key: 'schoolEndTime', value: '14:30' },
  ];
  for (const s of settings) {
    await prisma.schoolSetting.create({
      data: { schoolId: school.id, key: s.key, value: s.value },
    });
  }
  console.log('  ✓ School settings created');

  // ============================================================
  // 19. SALARY RECORDS (current month)
  // ============================================================
  console.log('  Creating Salary Records...');
  for (const teacher of teacherRecords) {
    const basicPay = 25000 + (teacher.experience || 0) * 2000;
    const hra = basicPay * 0.2;
    const da = basicPay * 0.1;
    const transportAllowance = 3000;
    const totalAllowances = hra + da + transportAllowance;
    const pfDeduction = basicPay * 0.12;
    const totalDeductions = pfDeduction;
    const grossPay = basicPay + totalAllowances;
    const netPay = grossPay - totalDeductions;

    await prisma.salaryRecord.create({
      data: {
        teacherId: teacher.id,
        month: CURRENT_PERIOD,
        basicPay,
        hra,
        da,
        transportAllowance,
        totalAllowances,
        pfDeduction,
        totalDeductions,
        grossPay,
        netPay,
        paidOn: daysAgo(randomInt(1, 5)),
        paymentMethod: 'BankTransfer',
        status: 'Paid',
      },
    });
  }
  console.log('  ✓ Salary records created');

  // ============================================================
  // 20. MEDICAL RECORDS (some students)
  // ============================================================
  console.log('  Creating Medical Records...');
  const medicalDefs = [
    { studentIdx: 0, recordType: 'Allergy', title: 'Peanut Allergy', desc: 'Mild allergic reaction to peanuts', doctor: 'Dr. Patil' },
    { studentIdx: 2, recordType: 'Vaccination', title: 'MMR Vaccine', desc: 'Measles, Mumps, Rubella vaccination completed', doctor: 'Dr. Deshmukh' },
    { studentIdx: 5, recordType: 'Condition', title: 'Mild Asthma', desc: 'Requires inhaler occasionally', doctor: 'Dr. Rao' },
    { studentIdx: 8, recordType: 'Vaccination', title: 'DPT Booster', desc: 'Diphtheria, Pertussis, Tetanus booster', doctor: 'Dr. Kulkarni' },
  ];

  for (const md of medicalDefs) {
    if (md.studentIdx < studentRecords.length) {
      await prisma.medicalRecord.create({
        data: {
          studentId: studentRecords[md.studentIdx].id,
          recordType: md.recordType,
          title: md.title,
          description: md.desc,
          date: daysAgo(randomInt(30, 180)),
          doctorName: md.doctor,
          hospital: randomItem(['Sahyadri Hospital', 'Jehangir Hospital', 'Ruby Hall Clinic']),
          isActive: true,
        },
      });
    }
  }
  console.log('  ✓ Medical records created');

  // ============================================================
  // 21. OBSERVATIONS (some students by teachers)
  // ============================================================
  console.log('  Creating Observations...');
  const obsCategories = ['Behavioral', 'Academic', 'Social', 'Emotional', 'Physical', 'Cognitive'];
  for (let i = 0; i < 10; i++) {
    const student = studentRecords[i % studentRecords.length];
    const cls = classRecords.find(c => c.id === student.classId)!;
    const teacher = teacherRecords.find(t => t.className === cls.name) || teacherRecords[0];
    await prisma.observation.create({
      data: {
        studentId: student.id,
        teacherId: teacher.id,
        category: randomItem(obsCategories),
        content: `${student.firstName} ${randomItem(['showed great enthusiasm in', 'participated actively in', 'needed encouragement for', 'excelled in', 'showed improvement in'])} ${randomItem(['group activities', 'art class', 'story time', 'outdoor play', 'music session', 'color recognition', 'number counting'])}.`,
        date: daysAgo(randomInt(1, 14)),
        isShared: Math.random() > 0.3,
        sharedAt: daysAgo(randomInt(0, 7)),
        parentAcknowledged: Math.random() > 0.4,
        priority: randomItem(['Low', 'Normal', 'Normal', 'Normal']),
      },
    });
  }
  console.log('  ✓ Observations created');

  // ============================================================
  // DONE
  // ============================================================
  console.log('\n✅ Seed completed successfully!');
  console.log(`   School: ${school.name}`);
  console.log(`   Branch: ${branch.name}`);
  console.log(`   Programs: ${programRecords.length}`);
  console.log(`   Classes: ${classRecords.length}`);
  console.log(`   Teachers: ${teacherRecords.length}`);
  console.log(`   Students: ${studentRecords.length}`);
  console.log(`   Parents: ${parentRecords.length}`);
  console.log(`   Users: ${2 + teacherUsers.length + parentUsers.length}`);
  console.log(`   Fee Structures: ${feeStructureRecords.length}`);
  console.log(`   Leads: ${leadRecords.length}`);
  console.log(`   Activities: ${activityDefs.length}`);
  console.log(`   Announcements: ${announcementDefs.length}`);
  console.log(`   Holidays: ${holidayDefs.length}`);
  console.log(`   Events: ${eventDefs.length}`);
  console.log(`\n   Login credentials:`);
  console.log(`   SuperAdmin: admin@preone.com / password123`);
  console.log(`   Owner: owner@littlestars.com / password123`);
  console.log(`   Teachers: kavitha.raman@littlestars.com / password123 (etc)`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
