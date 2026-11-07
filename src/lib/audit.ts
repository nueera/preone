/**
 * PreOne Audit Service — Central audit logging system
 *
 * ALL modules should use this service to create audit log entries.
 * Never create AuditLog records directly via Prisma.
 *
 * Usage:
 *   import { auditLog } from '@/lib/audit';
 *   await auditLog.create({ action: 'CREATE', entity: 'Student', entityId: studentId, userId, details: { name: 'Aarav' } });
 */

import { db } from '@/lib/db';

// ── Types ──
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'READ' | 'EXPORT' | 'IMPORT' | 'APPROVE' | 'REJECT';

export interface CreateAuditLogInput {
  action: AuditAction;
  entity: string;          // Model name: 'Student', 'Teacher', 'Invoice', 'Lead', etc.
  entityId?: string;       // ID of the affected record
  userId?: string;         // Who performed the action
  details?: Record<string, unknown>;  // Field-level diff or extra context
  ipAddress?: string;      // IP address of the request
}

export interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

// ── Core Functions ──

/**
 * Create a single audit log entry
 */
export async function createAuditLog(input: CreateAuditLogInput) {
  return db.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      userId: input.userId,
      details: input.details ? JSON.stringify(input.details) : undefined,
      ipAddress: input.ipAddress,
    },
  });
}

/**
 * Compute field-level diff between old and new values
 * Returns array of changed fields with old/new values
 */
export function computeDiff(
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>
): FieldDiff[] {
  const diffs: FieldDiff[] = [];
  const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

  for (const key of allKeys) {
    const oldVal = oldValues[key];
    const newVal = newValues[key];

    // Skip unchanged fields
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) continue;

    // Skip undefined fields
    if (oldVal === undefined && newVal === undefined) continue;

    diffs.push({
      field: key,
      oldValue: oldVal ?? null,
      newValue: newVal ?? null,
    });
  }

  return diffs;
}

/**
 * Create audit log for an UPDATE action with field-level diff
 */
export async function auditUpdate(input: {
  entity: string;
  entityId: string;
  userId?: string;
  ipAddress?: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}) {
  const diff = computeDiff(input.oldValues, input.newValues);

  if (diff.length === 0) return null; // No changes, don't log

  return createAuditLog({
    action: 'UPDATE',
    entity: input.entity,
    entityId: input.entityId,
    userId: input.userId,
    ipAddress: input.ipAddress,
    details: { changes: diff },
  });
}

// ── Convenience wrapper ──
export const auditLog = {
  create: createAuditLog,
  update: auditUpdate,
  computeDiff,
};
