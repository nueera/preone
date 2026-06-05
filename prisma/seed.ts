import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@blossom.edu' },
  });

  if (existingAdmin) {
    console.log('⚠️  Database already seeded. Skipping...');
    return;
  }

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const teacherPassword = await bcrypt.hash('Teacher@123', 12);
  const parentPassword = await bcrypt.hash('Parent@123', 12);

  // Create school
  const school = await prisma.school.create({
    data: {
      name: 'Blossom Preschool',
      email: 'info@blossom.edu',
      phone: '+91 98765 43210',
      address: '123 Garden Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      board: 'CBSE',
      academicYear: '2025-2026',
      onboardingComplete: true,
    },
  });

  // Create branch
  const branch = await prisma.branch.create({
    data: {
      schoolId: school.id,
      name: 'Main Campus',
      code: 'MC',
      address: '123 Garden Road, Mumbai',
      phone: '+91 98765 43210',
      capacity: 200,
      startTime: '08:00',
      endTime: '14:00',
      isHeadOffice: true,
      inChargeName: 'Priya Sharma',
      inChargePhone: '+91 98765 43212',
    },
  });

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@blossom.edu',
      password: adminPassword,
      name: 'Admin User',
      phone: '+91 98765 43211',
      role: 'ADMIN',
      schoolId: school.id,
      branchId: branch.id,
    },
  });

  // Create program
  const program = await prisma.program.create({
    data: {
      name: 'Nursery',
      description: 'Nursery program for ages 3-4',
      ageMin: 3,
      ageMax: 4,
      branchId: branch.id,
    },
  });

  // Create teacher user
  const teacherUser = await prisma.user.create({
    data: {
      email: 'priya@blossom.edu',
      password: teacherPassword,
      name: 'Priya Sharma',
      phone: '+91 98765 43212',
      role: 'TEACHER',
      schoolId: school.id,
      branchId: branch.id,
    },
  });

  // Create teacher record
  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya@blossom.edu',
      phone: '+91 98765 43212',
      qualification: 'B.Ed',
      specialization: 'Early Childhood Education',
      experience: 5,
      branchId: branch.id,
    },
  });

  // Create class
  const classRecord = await prisma.class.create({
    data: {
      name: 'Nursery-A',
      programId: program.id,
      branchId: branch.id,
      capacity: 30,
      teacherId: teacher.id,
      roomNo: '101',
    },
  });

  // Create parent user
  const parentUser = await prisma.user.create({
    data: {
      email: 'raj@family.com',
      password: parentPassword,
      name: 'Raj Patel',
      phone: '+91 98765 43213',
      role: 'PARENT',
      schoolId: school.id,
      branchId: branch.id,
    },
  });

  // Create parent record
  const parent = await prisma.parent.create({
    data: {
      firstName: 'Raj',
      lastName: 'Patel',
      phone: '+91 98765 43213',
      email: 'raj@family.com',
      occupation: 'Software Engineer',
      relation: 'father',
      isEmergencyContact: true,
    },
  });

  // Create student
  const student = await prisma.student.create({
    data: {
      firstName: 'Aarav',
      lastName: 'Patel',
      dob: new Date('2021-06-15'),
      gender: 'male',
      bloodGroup: 'B+',
      classId: classRecord.id,
      branchId: branch.id,
      rollNumber: 'NUR-001',
      status: 'ACTIVE',
    },
  });

  // Link student to parent
  await prisma.studentParent.create({
    data: {
      studentId: student.id,
      parentId: parent.id,
      isPrimary: true,
    },
  });

  // Create DailyUpdateConfig
  await prisma.dailyUpdateConfig.create({
    data: {
      schoolId: school.id,
      sendAttendance: true,
      sendMood: true,
      sendActivities: true,
      sendMeals: true,
      sendNap: true,
      sendPhotos: true,
      sendNotes: true,
      sendTime: 'end_of_day',
      sendAt: '14:30',
      notifyVia: 'app,email',
      isActive: true,
    },
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('🔑 Demo Accounts:');
  console.log('  Admin:   admin@blossom.edu  /  Admin@123');
  console.log('  Teacher: priya@blossom.edu  /  Teacher@123');
  console.log('  Parent:  raj@family.com     /  Parent@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
