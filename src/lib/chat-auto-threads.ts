import { prisma } from '@/lib/db';

/**
 * Create or find existing DM thread between 2 users.
 * Only returns a DIRECT thread that has exactly these 2 participants.
 */
export async function findOrCreateDirectThread(
  schoolId: string,
  userId1: string,
  userId2: string,
) {
  // Find existing DIRECT thread with exactly these 2 participants
  const existing = await prisma.chatThread.findFirst({
    where: {
      type: 'DIRECT',
      schoolId,
      participants: {
        every: { userId: { in: [userId1, userId2] } },
      },
    },
    include: { participants: true },
  });

  if (existing && existing.participants.length === 2) return existing;

  return prisma.chatThread.create({
    data: {
      type: 'DIRECT',
      schoolId,
      participants: {
        create: [
          { userId: userId1, role: 'member' },
          { userId: userId2, role: 'member' },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
        },
      },
    },
  });
}

/**
 * Create class group chat when a class is set up.
 * Returns the existing thread if one already exists for this class.
 */
export async function createClassGroupThread(
  schoolId: string,
  classId: string,
  className: string,
  branchId?: string,
) {
  const existing = await prisma.chatThread.findFirst({
    where: { type: 'CLASS_GROUP', schoolId, classId },
  });
  if (existing) return existing;

  return prisma.chatThread.create({
    data: {
      type: 'CLASS_GROUP',
      name: `${className} Group`,
      schoolId,
      classId,
      branchId,
      onlyAdminsCanMessage: false,
    },
  });
}

/**
 * Auto-add parent to class group when a student is enrolled.
 * Creates the participant entry if the thread exists and the parent is not already in it.
 */
export async function addParentToClassGroup(
  parentUserId: string,
  classId: string,
) {
  const thread = await prisma.chatThread.findFirst({
    where: { type: 'CLASS_GROUP', classId },
  });
  if (!thread) return;

  const existing = await prisma.chatParticipant.findUnique({
    where: { threadId_userId: { threadId: thread.id, userId: parentUserId } },
  });
  if (existing) return;

  await prisma.chatParticipant.create({
    data: {
      threadId: thread.id,
      userId: parentUserId,
      role: 'member',
    },
  });
}

/**
 * Auto-add teacher to class group when assigned.
 * Teachers are added as admins so they can manage the group.
 */
export async function addTeacherToClassGroup(
  teacherUserId: string,
  classId: string,
) {
  const thread = await prisma.chatThread.findFirst({
    where: { type: 'CLASS_GROUP', classId },
  });
  if (!thread) return;

  const existing = await prisma.chatParticipant.findUnique({
    where: { threadId_userId: { threadId: thread.id, userId: teacherUserId } },
  });
  if (existing) return;

  await prisma.chatParticipant.create({
    data: {
      threadId: thread.id,
      userId: teacherUserId,
      role: 'admin',
    },
  });
}

/**
 * Post announcement to relevant class/branch chat threads.
 * Finds all matching CLASS_GROUP threads and posts a message of type ANNOUNCEMENT.
 * Also updates the thread's lastMessagePreview / lastMessageAt.
 */
export async function postAnnouncementToChat(announcementId: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
  });
  if (!announcement) return;

  const whereClause: Record<string, unknown> = {
    type: 'CLASS_GROUP',
    schoolId: announcement.schoolId,
  };
  if (announcement.branchId) whereClause.branchId = announcement.branchId;
  if (announcement.classId) whereClause.classId = announcement.classId;

  const threads = await prisma.chatThread.findMany({ where: whereClause });

  for (const thread of threads) {
    await prisma.message.create({
      data: {
        threadId: thread.id,
        senderId: announcement.createdBy || 'system',
        content: `${announcement.title}\n\n${announcement.content}`,
        type: 'ANNOUNCEMENT',
        metadata: JSON.stringify({ announcementId }),
      },
    });

    // Update thread last message
    await prisma.chatThread.update({
      where: { id: thread.id },
      data: {
        lastMessagePreview: announcement.title,
        lastMessageAt: new Date(),
      },
    });
  }
}
