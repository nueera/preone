import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from '@/lib/db';

// ============================================================
// Socket.io Server Singleton
// ============================================================

let io: SocketIOServer | null = null;

const TOKEN_SECRET = process.env.JWT_SECRET || process.env.TOKEN_SECRET || 'preone-demo-secret-key-2024';

// ---- HMAC-SHA256 Sign (matches middleware.ts) ----
async function sign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(TOKEN_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---- Verify JWT token ----
interface VerifiedPayload {
  userId: string;
  email: string;
  role: string;
  branchId?: string | null;
  schoolId?: string | null;
}

async function verifyToken(token: string): Promise<VerifiedPayload | null> {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const expectedSig = await sign(payloadB64);
    if (signature.length !== expectedSig.length) return null;
    let mismatch = 0;
    for (let i = 0; i < signature.length; i++) {
      mismatch |= signature.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const payloadJson = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
    const payload = JSON.parse(payloadJson);

    if (Date.now() > payload.expiresAt) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,
      schoolId: payload.schoolId,
    };
  } catch {
    return null;
  }
}

export function getSocketServer(server: HttpServer): SocketIOServer {
  if (io) return io;

  // CORS: In production, restrict to allowed origins from env
  const allowedOrigins = process.env.SOCKET_CORS_ORIGINS?.split(',').map(o => o.trim()) || '*';

  io = new SocketIOServer(server, {
    path: '/api/socketio',
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // ---- Authentication middleware ----
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = await verifyToken(token as string);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    // Attach user info to socket
    (socket as any).user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      branchId: payload.branchId,
      schoolId: payload.schoolId,
    };

    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`[Socket] ${user.email} connected (${user.role})`);

    // Join school room
    if (user.schoolId) {
      socket.join(`school:${user.schoolId}`);
    }

    // Join personal room (for DMs and targeted events)
    socket.join(`user:${user.id}`);

    // Auto-join all thread rooms
    joinUserThreads(socket, user.id);

    // Broadcast online status
    if (user.schoolId) {
      io!.to(`school:${user.schoolId}`).emit('user:online', {
        userId: user.id,
        name: user.email,
        role: user.role,
      });
    }

    // ====================================
    // MESSAGE EVENTS
    // ====================================

    // ---- SEND MESSAGE ----
    socket.on('message:send', async (data: {
      threadId: string;
      content: string;
      type?: string;
      mediaUrl?: string;
      replyToId?: string;
    }) => {
      try {
        const { threadId, content, type = 'TEXT', mediaUrl, replyToId } = data;

        // Verify user is a participant
        const participant = await prisma.chatParticipant.findUnique({
          where: { threadId_userId: { threadId, userId: user.id } },
        });
        if (!participant || participant.leftAt) {
          socket.emit('error', { message: 'Not a participant in this thread' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            threadId,
            senderId: user.id,
            content,
            type: type as any,
            mediaUrl,
            replyToId,
          },
          include: {
            sender: { select: { id: true, name: true, avatar: true, role: true } },
          },
        });

        // Update thread's last message cache
        await prisma.chatThread.update({
          where: { id: threadId },
          data: {
            lastMessagePreview: content.substring(0, 100),
            lastMessageAt: new Date(),
          },
        });

        // Increment unread for all OTHER participants
        await prisma.chatParticipant.updateMany({
          where: {
            threadId,
            userId: { not: user.id },
            leftAt: null,
          },
          data: { unreadCount: { increment: 1 } },
        });

        // Broadcast to thread room
        io!.to(`thread:${threadId}`).emit('message:new', message);

        // Create notifications for offline users
        const thread = await prisma.chatThread.findUnique({
          where: { id: threadId },
          include: { participants: { where: { userId: { not: user.id }, leftAt: null } } },
        });

        if (thread) {
          for (const p of thread.participants) {
            // Create in-app notification
            await prisma.notification.create({
              data: {
                schoolId: thread.schoolId,
                userId: p.userId,
                title: thread.type === 'DIRECT' ? user.email : (thread.name || 'Group Message'),
                message: content.substring(0, 100),
                type: 'CHAT',
                category: 'COMMUNICATION',
                link: `/chat`,
              },
            });

            // Emit notification event if online
            io!.to(`user:${p.userId}`).emit('notification:new', {
              title: thread.type === 'DIRECT' ? user.email : thread.name,
              message: content.substring(0, 100),
              type: 'CHAT',
            });
          }
        }
      } catch (error) {
        console.error('[Socket] message:send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ---- EDIT MESSAGE ----
    socket.on('message:edit', async (data: { messageId: string; content: string }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: data.messageId } });
        if (!message || message.senderId !== user.id) {
          socket.emit('error', { message: 'Cannot edit this message' });
          return;
        }

        const updated = await prisma.message.update({
          where: { id: data.messageId },
          data: { content: data.content, isEdited: true },
          include: { sender: { select: { id: true, name: true, avatar: true } } },
        });

        io!.to(`thread:${message.threadId}`).emit('message:edited', updated);
      } catch (error) {
        console.error('[Socket] message:edit error:', error);
      }
    });

    // ---- DELETE MESSAGE ----
    socket.on('message:delete', async (data: { messageId: string }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: data.messageId } });
        if (!message) return;

        // Only sender or admin can delete
        if (message.senderId !== user.id && user.role !== 'ADMIN') {
          socket.emit('error', { message: 'Cannot delete this message' });
          return;
        }

        await prisma.message.update({
          where: { id: data.messageId },
          data: { isDeleted: true, content: 'This message was deleted' },
        });

        io!.to(`thread:${message.threadId}`).emit('message:deleted', { messageId: data.messageId });
      } catch (error) {
        console.error('[Socket] message:delete error:', error);
      }
    });

    // ---- REACT TO MESSAGE ----
    socket.on('message:react', async (data: { messageId: string; emoji: string }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: data.messageId } });
        if (!message) return;

        const reactions = JSON.parse(message.reactions || '{}');
        const emojiReactions = reactions[data.emoji] || [];

        if (emojiReactions.includes(user.id)) {
          // Toggle off
          reactions[data.emoji] = emojiReactions.filter((id: string) => id !== user.id);
          if (reactions[data.emoji].length === 0) delete reactions[data.emoji];
        } else {
          // Toggle on
          reactions[data.emoji] = [...emojiReactions, user.id];
        }

        await prisma.message.update({
          where: { id: data.messageId },
          data: { reactions: JSON.stringify(reactions) },
        });

        io!.to(`thread:${message.threadId}`).emit('message:reaction', {
          messageId: data.messageId,
          reactions,
        });
      } catch (error) {
        console.error('[Socket] message:react error:', error);
      }
    });

    // ---- MARK AS READ ----
    socket.on('message:read', async (data: { threadId: string }) => {
      try {
        await prisma.chatParticipant.update({
          where: { threadId_userId: { threadId: data.threadId, userId: user.id } },
          data: { unreadCount: 0, lastReadAt: new Date() },
        });

        socket.emit('thread:read', { threadId: data.threadId });
      } catch (error) {
        console.error('[Socket] message:read error:', error);
      }
    });

    // ---- TYPING INDICATOR ----
    socket.on('message:typing', (data: { threadId: string; isTyping: boolean }) => {
      socket.to(`thread:${data.threadId}`).emit('user:typing', {
        threadId: data.threadId,
        userId: user.id,
        isTyping: data.isTyping,
      });
    });

    // ====================================
    // THREAD EVENTS
    // ====================================

    // ---- CREATE THREAD ----
    socket.on('thread:create', async (data: {
      type: string;
      name?: string;
      participantIds: string[];
      branchId?: string;
      classId?: string;
      onlyAdminsCanMessage?: boolean;
    }) => {
      try {
        const thread = await prisma.chatThread.create({
          data: {
            type: data.type as any,
            name: data.name,
            schoolId: user.schoolId!,
            branchId: data.branchId,
            classId: data.classId,
            onlyAdminsCanMessage: data.onlyAdminsCanMessage || false,
            participants: {
              create: [
                { userId: user.id, role: 'admin' },
                ...data.participantIds
                  .filter(id => id !== user.id)
                  .map(id => ({ userId: id, role: 'member' as const })),
              ],
            },
          },
          include: {
            participants: { include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
          },
        });

        // Join creator to thread room
        socket.join(`thread:${thread.id}`);

        // Notify all participants
        for (const p of thread.participants) {
          io!.to(`user:${p.userId}`).emit('thread:new', thread);
        }
      } catch (error) {
        console.error('[Socket] thread:create error:', error);
        socket.emit('error', { message: 'Failed to create thread' });
      }
    });

    // ====================================
    // PRESENCE EVENTS
    // ====================================

    // ---- GET ONLINE USERS ----
    socket.on('presence:getOnline', async () => {
      const onlineUsers = await getOnlineUsersInSchool(user.schoolId!);
      socket.emit('presence:onlineUsers', onlineUsers);
    });

    // ---- DISCONNECT ----
    socket.on('disconnect', () => {
      console.log(`[Socket] ${user.email} disconnected`);
      if (user.schoolId) {
        io!.to(`school:${user.schoolId}`).emit('user:offline', {
          userId: user.id,
        });
      }
    });
  });

  return io;
}

// ====== HELPER FUNCTIONS ======

async function joinUserThreads(socket: Socket, userId: string) {
  const participants = await prisma.chatParticipant.findMany({
    where: { userId, leftAt: null },
    select: { threadId: true },
  });
  participants.forEach(p => {
    socket.join(`thread:${p.threadId}`);
  });
}

async function getOnlineUsersInSchool(schoolId: string) {
  const sockets = await io!.in(`school:${schoolId}`).fetchSockets();
  const userIds = new Set<string>();
  sockets.forEach(s => {
    if ((s as any).user) userIds.add((s as any).user.id);
  });
  return Array.from(userIds);
}

export { io };
