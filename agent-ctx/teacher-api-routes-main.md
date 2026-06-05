# Teacher Portal API Routes - Work Record

## Task: Create 9 API route files for the Teacher Portal

### Completed Routes

1. **`/api/teacher/dashboard/route.ts`** - GET
   - Requires auth with role=Teacher
   - Returns: teacher profile, assigned class info, today's schedule, student count, attendance summary for today, pending daily updates count, recent activities (last 5), upcoming events (next 7 days)
   - Handles gracefully when teacher has no assigned class

2. **`/api/teacher/class/route.ts`** - GET
   - Requires auth with role=Teacher
   - Returns: Class details (name, program, capacity, room, academic year, sections), list of students with parent contacts (phone, email, relation, isPrimary), medical alerts (Allergy, Condition, Medication, Emergency types)
   - Returns null classInfo with empty students array if no class assigned

3. **`/api/teacher/attendance/mark/route.ts`** - POST
   - Requires auth with role=Teacher
   - Body: `{ date, records: [{ studentId, status }] }`
   - Uses Prisma upsert on StudentAttendance (unique on studentId+date)
   - Validates status values (Present, Absent, Late, HalfDay, Excused)
   - Returns: success count, error count, individual results

4. **`/api/teacher/daily-updates/route.ts`** - GET + POST
   - GET: Query params `?date=2024-01-15&classId=xxx` - returns all daily updates for the class on that date with student info
   - POST: Create/update daily update for a student using upsert on DailyUpdate (unique on studentId+date)
   - Body: `{ studentId, date, breakfast, lunch, snacks, sleepQuality, morningMood, afternoonMood, waterGlasses, highlights, notes }`

5. **`/api/teacher/observations/route.ts`** - GET + POST
   - GET: Query params `?classId=xxx&studentId=xxx&category=xxx` - paginated observations with student name
   - POST: Create new observation with category validation
   - Body: `{ studentId, category, content, priority, isShared }`
   - Valid categories: Behavioral, Academic, Social, Emotional, Physical, Cognitive

6. **`/api/teacher/activities/route.ts`** - GET + POST
   - GET: Query params `?date=2024-01-15&status=Planned&type=Art` - paginated activities for the teacher
   - POST: Create new activity with branchId from teacher profile
   - Body: `{ title, type, description, date, startTime, endTime, classId, learningOutcomes }`

7. **`/api/teacher/leaves/route.ts`** - GET + POST
   - GET: Returns teacher's leave history and computed leave balance by type (Sick, Casual, Earned, Maternity, Paternity, CompOff, LossOfPay)
   - POST: Apply for leave with overlap detection against existing Pending/Approved leaves
   - Body: `{ leaveType, startDate, endDate, totalDays, reason }`

8. **`/api/teacher/growth/route.ts`** - GET + POST
   - GET: Query params `?classId=xxx&period=2024-Q1&studentId=xxx` - returns growth scores with computed class averages
   - POST: Update growth score using upsert on GrowthScore (unique on studentId+period), auto-computes overall if not provided
   - Body: `{ studentId, period, creativity, communication, socialSkills, confidence, cognitive, physical, overall, comments }`

9. **`/api/teacher/schedule/route.ts`** - GET
   - Requires auth with role=Teacher
   - Returns: Complete weekly schedule (7 days), today's specific schedule, working summary (total working days, weekly hours)
   - Handles missing days gracefully with null values

### Implementation Patterns

- All routes use `import { db } from '@/lib/db'` for Prisma client
- All routes use `import { getAuthUser } from '@/lib/auth'` for authentication
- Consistent error handling with try/catch and proper status codes
- Role check: 403 for non-Teacher roles
- Teacher identified by `db.teacher.findUnique({ where: { userId: authUser.userId } })`
- Class found via `db.class.findFirst({ where: { teacherId: teacher.id } })`
- Lint passed cleanly with no errors
