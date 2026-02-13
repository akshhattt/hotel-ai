import { Router, Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { calculateInvestorScore, InvestorScoreInput } from '../../lib/scoring';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';
import { z } from 'zod';
import logger from '../../lib/logger';

const router = Router();

// ─── Validation Schemas ──────────────────────────────────────

const createInvestorSchema = z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
    title: z.string().optional(),
    linkedinUrl: z.string().url().optional(),
    source: z.enum(['REFERRAL', 'LINKEDIN', 'CONFERENCE', 'WEBSITE', 'PURCHASED_LIST', 'PRIOR_INVESTOR', 'INBOUND_CALL', 'OTHER']),
    sourceDetail: z.string().optional(),
    checkSizeMin: z.number().positive().optional(),
    checkSizeMax: z.number().positive().optional(),
    assetClassPrefs: z.array(z.string()).optional(),
    geographyPrefs: z.array(z.string()).optional(),
    priorRelationship: z.boolean().optional(),
    priorRelationshipNote: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

// ─── Routes ──────────────────────────────────────────────────

/**
 * GET /investors
 * List investors with filtering, sorting, and pagination
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const {
            page = '1',
            limit = '25',
            sort = 'qualityScore',
            order = 'desc',
            status,
            minScore,
            search,
            tags,
            accreditedStatus,
        } = req.query as Record<string, string>;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where: any = {
            optedOut: false,
            doNotContact: false,
        };

        if (minScore) where.qualityScore = { gte: parseInt(minScore) };
        if (accreditedStatus) where.accreditedStatus = accreditedStatus;
        if (tags) where.tags = { hasSome: tags.split(',') };
        if (search) {
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [investors, total] = await Promise.all([
            prisma.investor.findMany({
                where,
                skip,
                take,
                orderBy: { [sort]: order },
                include: {
                    dealInterests: { include: { deal: { select: { name: true, status: true } } } },
                    _count: { select: { meetings: true, commitments: true, voiceCalls: true } },
                },
            }),
            prisma.investor.count({ where }),
        ]);

        res.json({
            data: investors,
            pagination: {
                page: parseInt(page),
                limit: take,
                total,
                totalPages: Math.ceil(total / take),
            },
        });
    } catch (error) {
        logger.error('Error fetching investors', { error });
        res.status(500).json({ error: 'Failed to fetch investors' });
    }
});

/**
 * GET /investors/:id
 * Get investor with full profile and activity history
 */
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const investor = await prisma.investor.findUnique({
            where: { id: req.params.id },
            include: {
                dealInterests: { include: { deal: true } },
                outreachSequences: { include: { sequence: true, events: true } },
                voiceCalls: { orderBy: { startedAt: 'desc' }, take: 10 },
                meetings: { orderBy: { scheduledAt: 'desc' }, take: 10 },
                commitments: { include: { deal: true } },
                activities: { orderBy: { createdAt: 'desc' }, take: 20 },
            },
        });

        if (!investor) {
            res.status(404).json({ error: 'Investor not found' });
            return;
        }

        res.json({ data: investor });
    } catch (error) {
        logger.error('Error fetching investor', { error });
        res.status(500).json({ error: 'Failed to fetch investor' });
    }
});

/**
 * POST /investors
 * Create new investor with initial scoring
 */
router.post('/', authenticate, authorize('ADMIN', 'MANAGER', 'ANALYST'), async (req: AuthRequest, res: Response) => {
    try {
        const data = createInvestorSchema.parse(req.body);

        const investor = await prisma.investor.create({
            data: {
                ...data,
                assetClassPrefs: data.assetClassPrefs || [],
                geographyPrefs: data.geographyPrefs || [],
                tags: data.tags || [],
            },
        });

        await logAuditEvent({
            userId: req.user?.id,
            investorId: investor.id,
            action: 'CREATE',
            entity: 'Investor',
            entityId: investor.id,
            after: investor,
        });

        res.status(201).json({ data: investor });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({ error: 'Investor with this email already exists' });
            return;
        }
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        logger.error('Error creating investor', { error });
        res.status(500).json({ error: 'Failed to create investor' });
    }
});

/**
 * POST /investors/:id/score
 * Re-score an investor against a specific deal
 */
router.post('/:id/score', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { dealId } = req.body;
        const investor = await prisma.investor.findUnique({ where: { id: req.params.id } });
        if (!investor) {
            res.status(404).json({ error: 'Investor not found' });
            return;
        }

        const deal = dealId
            ? await prisma.deal.findUnique({ where: { id: dealId } })
            : null;

        // Gather engagement metrics (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [emailEvents, voiceCalls] = await Promise.all([
            prisma.outreachEvent.findMany({
                where: {
                    enrollment: { investorId: investor.id },
                    occurredAt: { gte: thirtyDaysAgo },
                },
            }),
            prisma.voiceCall.findMany({
                where: {
                    investorId: investor.id,
                    status: 'COMPLETED',
                    startedAt: { gte: thirtyDaysAgo },
                },
            }),
        ]);

        const scoreInput: InvestorScoreInput = {
            accreditedStatus: investor.accreditedStatus,
            checkSizeMin: investor.checkSizeMin ? Number(investor.checkSizeMin) : null,
            checkSizeMax: investor.checkSizeMax ? Number(investor.checkSizeMax) : null,
            dealMinimum: deal ? Number(deal.minimumInvestment) : 100000,
            dealTarget: deal ? Number(deal.totalRaise) / 20 : 500000, // target = 1/20 of raise
            assetClassPrefs: investor.assetClassPrefs,
            priorHotelInvestments: investor.priorHotelInvestments,
            hospitalityExperience: investor.hospitalityExperience,
            emailOpens30d: emailEvents.filter((e) => e.eventType === 'OPENED').length,
            emailClicks30d: emailEvents.filter((e) => e.eventType === 'CLICKED').length,
            emailReplies30d: emailEvents.filter((e) => e.eventType === 'REPLIED').length,
            voiceCallsCompleted30d: voiceCalls.length,
            websiteVisits30d: 0, // TODO: integrate analytics
            docDownloads30d: 0,
            isPriorInvestor: investor.source === 'PRIOR_INVESTOR',
            isReferral: investor.source === 'REFERRAL',
            has1031Exchange: investor.tags.includes('1031_exchange'),
            deploymentDeadlineDays: null,
        };

        const scoreResult = calculateInvestorScore(scoreInput);

        const updated = await prisma.investor.update({
            where: { id: investor.id },
            data: {
                qualityScore: scoreResult.total,
                lastScoredAt: new Date(),
            },
        });

        // Update deal-specific fit score if applicable
        if (dealId) {
            await prisma.dealInvestor.upsert({
                where: { dealId_investorId: { dealId, investorId: investor.id } },
                create: { dealId, investorId: investor.id, fitScore: scoreResult.total },
                update: { fitScore: scoreResult.total },
            });
        }

        res.json({ data: { investor: updated, score: scoreResult } });
    } catch (error) {
        logger.error('Error scoring investor', { error });
        res.status(500).json({ error: 'Failed to score investor' });
    }
});

/**
 * POST /investors/:id/opt-out
 * Process an investor opt-out (compliance-critical)
 */
router.post('/:id/opt-out', async (req: Request, res: Response) => {
    try {
        const investor = await prisma.investor.update({
            where: { id: req.params.id },
            data: {
                optedOut: true,
                optOutDate: new Date(),
                doNotContact: true,
            },
        });

        // Cancel all active outreach enrollments
        await prisma.outreachEnrollment.updateMany({
            where: { investorId: investor.id, status: 'ACTIVE' },
            data: { status: 'OPTED_OUT', completedAt: new Date() },
        });

        await logAuditEvent({
            action: 'OPT_OUT',
            entity: 'Investor',
            entityId: investor.id,
            investorId: investor.id,
            after: { optedOut: true },
            ipAddress: req.ip || 'unknown',
        });

        logger.info('Investor opted out', { investorId: investor.id });
        res.json({ message: 'Successfully opted out' });
    } catch (error) {
        logger.error('Error processing opt-out', { error });
        res.status(500).json({ error: 'Failed to process opt-out' });
    }
});

export default router;
