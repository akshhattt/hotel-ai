import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';
import { z } from 'zod';
import logger from '../../lib/logger';

const router = Router();

// ─── Validation ──────────────────────────────────────────────

const createDealSchema = z.object({
    name: z.string().min(1),
    propertyName: z.string().min(1),
    propertyAddress: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    market: z.string().min(1),
    acquisitionPrice: z.number().positive(),
    totalRaise: z.number().positive(),
    minimumInvestment: z.number().positive(),
    targetIRR: z.number().optional(),
    targetEquityMultiple: z.number().optional(),
    targetCashOnCash: z.number().optional(),
    holdPeriod: z.number().int().positive().optional(),
    propertyType: z.enum(['SELECT_SERVICE', 'FULL_SERVICE', 'EXTENDED_STAY', 'RESORT', 'BOUTIQUE', 'LIFESTYLE', 'CONVENTION']),
    roomCount: z.number().int().positive().optional(),
    brand: z.string().optional(),
    starRating: z.number().min(1).max(5).optional(),
    renovationBudget: z.number().optional(),
    renovationThesis: z.string().optional(),
    strRevPAR: z.number().optional(),
    strOccupancy: z.number().min(0).max(100).optional(),
    strADR: z.number().optional(),
    marketGrowthRate: z.number().optional(),
    exitAssumptions: z.string().optional(),
    offeringType: z.enum(['REG_D_506B', 'REG_D_506C']).default('REG_D_506B'),
    maxInvestors: z.number().int().positive().optional(),
});

// ─── Routes ──────────────────────────────────────────────────

/**
 * GET /deals
 * List all deals with pipeline summary
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;
        const where: any = {};
        if (status) where.status = status;

        const deals = await prisma.deal.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { investors: true, commitments: true, meetings: true },
                },
            },
        });

        // Enrich with pipeline stats
        const enriched = await Promise.all(
            deals.map(async (deal) => {
                const commitments = await prisma.commitment.groupBy({
                    by: ['type'],
                    where: { dealId: deal.id },
                    _sum: { amount: true },
                });

                const pipelineByStatus = await prisma.dealInvestor.groupBy({
                    by: ['status'],
                    where: { dealId: deal.id },
                    _count: true,
                });

                return {
                    ...deal,
                    commitmentSummary: commitments.reduce((acc, c) => {
                        acc[c.type] = Number(c._sum.amount || 0);
                        return acc;
                    }, {} as Record<string, number>),
                    pipelineByStatus: pipelineByStatus.reduce((acc, p) => {
                        acc[p.status] = p._count;
                        return acc;
                    }, {} as Record<string, number>),
                    raiseProgress: Number(deal.raisedToDate) / Number(deal.totalRaise) * 100,
                };
            })
        );

        res.json({ data: enriched });
    } catch (error) {
        logger.error('Error fetching deals', { error });
        res.status(500).json({ error: 'Failed to fetch deals' });
    }
});

/**
 * GET /deals/:id
 * Get deal detail with full pipeline
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const deal = await prisma.deal.findUnique({
            where: { id: req.params.id },
            include: {
                investors: {
                    include: { investor: true },
                    orderBy: { fitScore: 'desc' },
                },
                commitments: {
                    include: { investor: { select: { firstName: true, lastName: true, company: true } } },
                    orderBy: { date: 'desc' },
                },
                meetings: {
                    include: { investor: { select: { firstName: true, lastName: true } } },
                    orderBy: { scheduledAt: 'desc' },
                    take: 20,
                },
                outreachSequences: {
                    include: { _count: { select: { enrollments: true } } },
                },
            },
        });

        if (!deal) {
            res.status(404).json({ error: 'Deal not found' });
            return;
        }

        res.json({ data: deal });
    } catch (error) {
        logger.error('Error fetching deal', { error });
        res.status(500).json({ error: 'Failed to fetch deal' });
    }
});

/**
 * POST /deals
 * Create a new deal
 */
router.post('/', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
    try {
        const data = createDealSchema.parse(req.body);
        const deal = await prisma.deal.create({ data });

        await logAuditEvent({
            userId: req.user?.id,
            action: 'CREATE',
            entity: 'Deal',
            entityId: deal.id,
            after: deal,
        });

        res.status(201).json({ data: deal });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        logger.error('Error creating deal', { error });
        res.status(500).json({ error: 'Failed to create deal' });
    }
});

/**
 * PATCH /deals/:id/status
 * Update deal status (with raise timeline tracking)
 */
router.patch('/:id/status', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;
        const before = await prisma.deal.findUnique({ where: { id: req.params.id } });

        const updateData: any = { status };
        if (status === 'RAISING' && !before?.raiseStartDate) {
            updateData.raiseStartDate = new Date();
        }
        if (status === 'FULLY_FUNDED' || status === 'CLOSED') {
            updateData.raiseActualClose = new Date();
        }

        const deal = await prisma.deal.update({
            where: { id: req.params.id },
            data: updateData,
        });

        await logAuditEvent({
            userId: req.user?.id,
            action: 'STATUS_CHANGE',
            entity: 'Deal',
            entityId: deal.id,
            before: { status: before?.status },
            after: { status: deal.status },
        });

        res.json({ data: deal });
    } catch (error) {
        logger.error('Error updating deal status', { error });
        res.status(500).json({ error: 'Failed to update deal status' });
    }
});

export default router;
