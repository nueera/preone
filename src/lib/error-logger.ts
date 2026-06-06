import { prisma } from '@/lib/db';
import { createHash } from 'crypto';

// ====== SANITIZATION ======

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'cookie', 'apikey', 'api_key', 'access_token', 'refresh_token'];

function sanitize(data: any, maxDepth = 3): any {
  if (!data || maxDepth <= 0) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(sanitize(parsed, maxDepth - 1));
    } catch {
      return data.substring(0, 2000);
    }
  }
  if (Array.isArray(data)) return data.slice(0, 50).map(item => sanitize(item, maxDepth - 1));
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(value, maxDepth - 1);
      }
    }
    return sanitized;
  }
  return data;
}

// ====== FINGERPRINT ======

function generateFingerprint(params: {
  message: string;
  type?: string;
  source?: string;
  url?: string;
  apiRoute?: string;
  fileName?: string;
  lineNumber?: number;
}): string {
  const raw = [
    params.message?.substring(0, 200) || '',
    params.type || '',
    params.source || '',
    params.url?.split('?')[0] || '',
    params.apiRoute || '',
    params.fileName || '',
    params.lineNumber?.toString() || '',
  ].join('|');
  return createHash('sha256').update(raw).digest('hex').substring(0, 32);
}

// ====== CORE LOG FUNCTION ======

interface LogErrorParams {
  message: string;
  stack?: string;
  type?: string;
  source: 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'AUTH' | 'EXTERNAL' | 'SOCKET';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  url?: string;
  method?: string;
  apiRoute?: string;
  lineNumber?: number;
  columnName?: number;
  fileName?: string;
  userId?: string;
  userRole?: string;
  schoolId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  requestBody?: any;
  requestQuery?: any;
  statusCode?: number;
  responseBody?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  breadcrumbs?: any[];
}

export async function logError(params: LogErrorParams) {
  try {
    const fingerprint = generateFingerprint(params);

    // Check if error with this fingerprint exists
    const existing = await prisma.errorLog.findUnique({
      where: { fingerprint },
    });

    if (existing) {
      // Update existing — increment count, update lastSeenAt
      const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const currentSeverityIndex = severityOrder.indexOf(existing.severity);
      const newSeverityIndex = severityOrder.indexOf(params.severity || 'MEDIUM');

      const updateData: any = {
        occurrenceCount: { increment: 1 },
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      };

      // Escalate severity if new is higher
      if (newSeverityIndex > currentSeverityIndex) {
        updateData.severity = params.severity;
      }

      // If error was RESOLVED/IGNORED but it's happening again, reset to NEW
      if (existing.status === 'RESOLVED' || existing.status === 'IGNORED') {
        updateData.status = 'NEW';
        updateData.resolvedBy = null;
        updateData.resolvedAt = null;
        updateData.resolutionNote = null;
      }

      return await prisma.errorLog.update({
        where: { fingerprint },
        data: updateData,
      });
    }

    // Create new error log
    return await prisma.errorLog.create({
      data: {
        fingerprint,
        message: params.message.substring(0, 2000),
        stack: params.stack?.substring(0, 5000),
        type: params.type,
        source: params.source as any,
        severity: (params.severity || 'MEDIUM') as any,
        url: params.url,
        method: params.method,
        apiRoute: params.apiRoute,
        lineNumber: params.lineNumber,
        columnName: params.columnNumber,
        fileName: params.fileName,
        userId: params.userId,
        userRole: params.userRole,
        schoolId: params.schoolId,
        sessionId: params.sessionId,
        userAgent: params.userAgent?.substring(0, 500),
        ipAddress: params.ipAddress,
        requestBody: params.requestBody ? JSON.stringify(sanitize(params.requestBody)) : undefined,
        requestQuery: params.requestQuery ? JSON.stringify(sanitize(params.requestQuery)) : undefined,
        statusCode: params.statusCode,
        responseBody: params.responseBody?.substring(0, 2000),
        tags: JSON.stringify(params.tags || []),
        metadata: JSON.stringify(params.metadata || {}),
        breadcrumbs: JSON.stringify(params.breadcrumbs || []),
      },
    });
  } catch (error) {
    // If error logging itself fails, just console.error — don't crash the app
    console.error('[ErrorLogger] Failed to log error:', error);
    return null;
  }
}

// ====== CONVENIENCE HELPERS ======

export async function logApiError(error: Error, req: { method?: string; url?: string; headers?: any }, userId?: string, schoolId?: string) {
  return logError({
    message: error.message,
    stack: error.stack,
    type: error.constructor.name,
    source: 'BACKEND',
    severity: error.message.includes('Prisma') ? 'HIGH' : 'MEDIUM',
    apiRoute: req.url,
    method: req.method,
    statusCode: (error as any).statusCode || 500,
    userId,
    schoolId,
    requestBody: (error as any).requestBody,
    userAgent: req.headers?.['user-agent'],
    ipAddress: req.headers?.['x-forwarded-for'] || req.headers?.['x-real-ip'],
    tags: ['api', req.method?.toLowerCase() || 'unknown'],
  });
}

export async function logDbError(error: any, operation: string, model: string, userId?: string) {
  return logError({
    message: `[DB] ${operation} on ${model}: ${error.message}`,
    stack: error.stack,
    type: error.constructor.name,
    source: 'DATABASE',
    severity: 'HIGH',
    tags: ['database', model.toLowerCase(), operation.toLowerCase()],
    userId,
    metadata: { operation, model, errorCode: error.code },
  });
}

export async function logAuthError(error: string, userId?: string, metadata?: Record<string, any>) {
  return logError({
    message: error,
    source: 'AUTH',
    severity: 'MEDIUM',
    userId,
    tags: ['auth'],
    metadata,
  });
}

export async function logFrontendError(params: {
  message: string;
  stack?: string;
  type?: string;
  url?: string;
  lineNumber?: number;
  columnName?: number;
  fileName?: string;
  userId?: string;
  userRole?: string;
  schoolId?: string;
  userAgent?: string;
  breadcrumbs?: any[];
  metadata?: Record<string, any>;
}) {
  return logError({
    ...params,
    source: 'FRONTEND',
    severity: 'MEDIUM',
  });
}
