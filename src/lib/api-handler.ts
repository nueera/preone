import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logApiError } from '@/lib/error-logger';

/**
 * Standardized API route handler with automatic error catching + logging.
 * Wraps your handler in try/catch, formats Zod/Prisma/Auth errors properly.
 *
 * Usage:
 *   export async function GET(req: NextRequest) {
 *     return apiHandler(async (req) => {
 *       const data = await prisma.student.findMany();
 *       return NextResponse.json(data);
 *     })(req);
 *   }
 */
export function apiHandler(
  handler: (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      // Zod validation error
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        );
      }

      // Prisma error
      if (error instanceof Error && (error.message.includes('Prisma') || error.message.includes('prisma'))) {
        await logApiError(error, {
          method: req.method,
          url: req.url,
          headers: Object.fromEntries(req.headers.entries()),
        });

        // Don't expose Prisma errors to client
        return NextResponse.json(
          { error: 'Database operation failed', code: 'DB_ERROR' },
          { status: 500 }
        );
      }

      // Auth error
      if (error instanceof Error && (error.message.includes('Authentication') || error.message.includes('Unauthorized'))) {
        return NextResponse.json(
          { error: error.message, code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Generic error
      const err = error instanceof Error ? error : new Error(String(error));
      await logApiError(err, {
        method: req.method,
        url: req.url,
        headers: Object.fromEntries(req.headers.entries()),
      });

      return NextResponse.json(
        { error: err.message || 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}
