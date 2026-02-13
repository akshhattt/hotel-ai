import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

interface AuditOptions {
    action: string;
    entity: string;
    getEntityId: (req: Request) => string;
    getBefore?: (req: Request) => any;
    getAfter?: (req: Request, res: Response) => any;
    getInvestorId?: (req: Request) => string | null;
}

/**
 * Middleware factory that creates an immutable audit log entry
 * for compliance and regulatory tracking.
 */
export function auditLog(options: AuditOptions) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        // Capture the original end to intercept response
        const originalEnd = res.end;
        const userId = (req as any).user?.id || null;

        res.end = function (...args: any[]) {
            // Log after response is sent
            prisma.auditLog
                .create({
                    data: {
                        userId,
                        investorId: options.getInvestorId?.(req) || null,
                        action: options.action,
                        entity: options.entity,
                        entityId: options.getEntityId(req),
                        before: options.getBefore?.(req) || undefined,
                        after: options.getAfter?.(req, res) || undefined,
                        ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
                        userAgent: req.headers['user-agent'] || 'unknown',
                    },
                })
                .catch((err) => {
                    logger.error('Failed to write audit log', { err, action: options.action });
                });

            return originalEnd.apply(res, args);
        } as any;

        next();
    };
}

/**
 * Standalone function to log audit events from services
 */
export async function logAuditEvent(params: {
    userId?: string;
    investorId?: string;
    action: string;
    entity: string;
    entityId: string;
    before?: any;
    after?: any;
    ipAddress?: string;
}): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: params.userId || null,
                investorId: params.investorId || null,
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                before: params.before || undefined,
                after: params.after || undefined,
                ipAddress: params.ipAddress || 'system',
                userAgent: 'system',
            },
        });
    } catch (err) {
        logger.error('Failed to write audit log', { err, action: params.action });
    }
}
