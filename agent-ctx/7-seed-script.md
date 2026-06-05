# Task 7 - Seed Script

## Summary

Created the comprehensive seed script for the PreOne preschool ERP project and successfully seeded the database.

## Files Created/Modified

### Created: `/home/z/my-project/prisma/seed.ts`

- Comprehensive seed script that creates demo data for "Blossom Preschool"
- Idempotent — checks if `admin@blossom.edu` exists before seeding
- Uses `PrismaClient` directly (not the shared singleton) as required for seed scripts
- Uses `bcrypt` (NOT bcryptjs) for password hashing with salt rounds of 12

### Modified: `/home/z/my-project/package.json`

- Added `prisma.seed` configuration: `"seed": "bunx tsx prisma/seed.ts"`

## Seed Data Created

| Entity            | Details                                                              |
| ----------------- | -------------------------------------------------------------------- |
| School            | Blossom Preschool, Mumbai, Maharashtra, CBSE, 2025-2026              |
| Branch            | Main Campus (MC), isHeadOffice: true, capacity: 200                  |
| Admin User        | admin@blossom.edu / Admin@123 (role: ADMIN)                          |
| Teacher User      | priya@blossom.edu / Teacher@123 (role: TEACHER)                      |
| Parent User       | raj@family.com / Parent@123 (role: PARENT)                           |
| Program           | Nursery (ages 3-4)                                                   |
| Teacher Record    | Priya Sharma, B.Ed, Early Childhood Education, 5 years exp           |
| Class             | Nursery-A, Room 101, capacity 30                                     |
| Student           | Aarav Patel, DOB: 2021-06-15, Gender: male, Blood: B+, Roll: NUR-001 |
| Parent Record     | Raj Patel, father, Software Engineer, emergency contact              |
| StudentParent     | Linked Aarav to Raj (isPrimary: true)                                |
| DailyUpdateConfig | All updates enabled, end_of_day at 14:30, app+email notifications    |

## Verification

All seed data was verified to exist in the database after running `bun run db:seed`.
