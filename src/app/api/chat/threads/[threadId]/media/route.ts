// ============================================================
// PreOne — Chat Media Upload API
// POST /api/chat/threads/[threadId]/media — Upload media to chat
// Max 10MB admin, 5MB teacher, 2MB parent
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser, Role } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

// Max file sizes by role (in bytes)
const MAX_FILE_SIZE: Record<string, number> = {
  ADMIN: 10 * 1024 * 1024,    // 10MB
  TASK_MASTER: 10 * 1024 * 1024, // 10MB
  TEACHER: 5 * 1024 * 1024,   // 5MB
  PARENT: 2 * 1024 * 1024,    // 2MB
};

// Allowed MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'audio/ogg',
  'audio/mpeg',
  'audio/webm',
  'audio/mp4',
  'video/mp4',
  'video/webm',
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { threadId } = await params;

    // Verify user is a participant in this thread
    const participation = await prisma.chatParticipant.findFirst({
      where: { threadId, userId: user.userId, leftAt: null },
    });

    if (!participation) {
      return NextResponse.json(
        { error: 'Access denied. You are not a participant in this thread.' },
        { status: 403 }
      );
    }

    // Verify thread exists and is active
    const thread = await prisma.chatThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    if (!thread.isActive) {
      return NextResponse.json({ error: 'Thread is not active' }, { status: 400 });
    }

    // Check file size limit based on role
    const maxSize = MAX_FILE_SIZE[user.role] || MAX_FILE_SIZE.PARENT;

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      return NextResponse.json(
        { error: `File size exceeds the ${maxMB}MB limit for your role` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed. Allowed types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = path.extname(file.name) || mimeToExtension(file.type);
    const uniqueName = `${randomUUID()}${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat', threadId);
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadDir, uniqueName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Generate the public URL
    const mediaUrl = `/uploads/chat/${threadId}/${uniqueName}`;

    // Determine media type category
    let mediaType = file.type;
    let messageType = 'FILE';
    if (file.type.startsWith('image/')) {
      messageType = 'IMAGE';
    } else if (file.type.startsWith('audio/')) {
      messageType = 'VOICE';
    }

    return NextResponse.json(
      {
        mediaUrl,
        mediaType,
        mediaSize: file.size,
        messageType,
        originalName: file.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Chat media upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: Map MIME type to file extension
function mimeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'audio/webm': '.webm',
    'audio/mp4': '.m4a',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
  };
  return map[mimeType] || '.bin';
}
