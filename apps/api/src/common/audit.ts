import { prisma } from '../lib/prisma.js';

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId: targetId ?? null,
        metadata: metadata as any,
      },
    });
  } catch {
    // Audit logging must not break the primary operation; errors are swallowed.
  }
}