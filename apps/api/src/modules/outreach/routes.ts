import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { checkCompliance, appendComplianceFooter } from '../../lib/compliance';
import { logAuditEvent } from '../../middleware/audit';
import logger from '../../lib/logger';
import { z } from 'zod';

const router = Router();

// ─── Outreach Sequence Routes ────────────────────────────────

/**
 * POST /outreach/sequences
 * Create a new outreach sequence for a deal
 */
router.post('/sequences', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
    try {
        const schema = z.object({
            dealId: z.string(),
            name: z.string().min(1),
            type: z.enum(['EMAIL', 'MULTI_CHANNEL']).default('EMAIL'),
            steps: z.array(z.object({
                stepOrder: z.number().int().min(0),
                channel: z.enum(['EMAIL', 'VOICE', 'SMS']),
                delayDays: z.number().int().min(0),
                templateSubject: z.string().optional(),
                templateBody: z.string().optional(),
                aiPrompt: z.string().optional(),
                complianceFooter: z.string().optional(),
            })),
        });

        const data = schema.parse(req.body);
        const deal = await prisma.deal.findUnique({ where: { id: data.dealId } });
        if (!deal) {
            res.status(404).json({ error: 'Deal not found' });
            return;
        }

        const sequence = await prisma.outreachSequence.create({
            data: {
                dealId: data.dealId,
                name: data.name,
                type: data.type,
                steps: {
                    create: data.steps,
                },
            },
            include: { steps: true },
        });

        await logAuditEvent({
            userId: req.user?.id,
            action: 'CREATE',
            entity: 'OutreachSequence',
            entityId: sequence.id,
            after: { name: sequence.name, dealId: sequence.dealId, stepCount: data.steps.length },
        });

        res.status(201).json({ data: sequence });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        logger.error('Error creating sequence', { error });
        res.status(500).json({ error: 'Failed to create sequence' });
    }
});

/**
 * POST /outreach/sequences/:id/enroll
 * Enroll investors in a sequence with compliance pre-check
 */
router.post('/sequences/:id/enroll', authenticate, authorize('ADMIN', 'MANAGER', 'ANALYST'), async (req: AuthRequest, res: Response) => {
    try {
        const { investorIds } = req.body as { investorIds: string[] };
        const sequence = await prisma.outreachSequence.findUnique({
            where: { id: req.params.id },
            include: { deal: true, steps: { orderBy: { stepOrder: 'asc' } } },
        });

        if (!sequence) {
            res.status(404).json({ error: 'Sequence not found' });
            return;
        }

        if (!sequence.complianceApproved) {
            res.status(403).json({ error: 'Sequence not yet compliance-approved' });
            return;
        }

        const results: { investorId: string; enrolled: boolean; reason?: string }[] = [];

        for (const investorId of investorIds) {
            const investor = await prisma.investor.findUnique({ where: { id: investorId } });

            if (!investor) {
                results.push({ investorId, enrolled: false, reason: 'Investor not found' });
                continue;
            }

            // Compliance pre-checks
            if (investor.optedOut || investor.doNotContact) {
                results.push({ investorId, enrolled: false, reason: 'Investor opted out or DNC' });
                continue;
            }

            if (sequence.deal.offeringType === 'REG_D_506B' && !investor.priorRelationship) {
                results.push({ investorId, enrolled: false, reason: '506(b) requires prior relationship' });
                continue;
            }

            // Check max active sequences per investor
            const activeEnrollments = await prisma.outreachEnrollment.count({
                where: { investorId, status: 'ACTIVE' },
            });

            if (activeEnrollments >= 2) {
                results.push({ investorId, enrolled: false, reason: 'Max active sequences reached (2)' });
                continue;
            }

            try {
                await prisma.outreachEnrollment.create({
                    data: {
                        sequenceId: sequence.id,
                        investorId,
                    },
                });

                // Ensure deal-investor link exists
                await prisma.dealInvestor.upsert({
                    where: { dealId_investorId: { dealId: sequence.dealId, investorId } },
                    create: { dealId: sequence.dealId, investorId, status: 'CONTACTED' },
                    update: { status: 'CONTACTED' },
                });

                results.push({ investorId, enrolled: true });
            } catch (err: any) {
                if (err.code === 'P2002') {
                    results.push({ investorId, enrolled: false, reason: 'Already enrolled' });
                } else {
                    results.push({ investorId, enrolled: false, reason: 'Database error' });
                }
            }
        }

        await logAuditEvent({
            userId: req.user?.id,
            action: 'BULK_ENROLL',
            entity: 'OutreachSequence',
            entityId: sequence.id,
            after: {
                total: investorIds.length,
                enrolled: results.filter((r) => r.enrolled).length,
                rejected: results.filter((r) => !r.enrolled).length,
            },
        });

        res.json({
            data: {
                sequenceId: sequence.id,
                results,
                summary: {
                    total: investorIds.length,
                    enrolled: results.filter((r) => r.enrolled).length,
                    rejected: results.filter((r) => !r.enrolled).length,
                },
            },
        });
    } catch (error) {
        logger.error('Error enrolling investors', { error });
        res.status(500).json({ error: 'Failed to enroll investors' });
    }
});

/**
 * POST /outreach/compliance-check
 * Pre-send compliance validation for content
 */
router.post('/compliance-check', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { content, subject, offeringType, investorId } = req.body;

        const investor = investorId
            ? await prisma.investor.findUnique({ where: { id: investorId } })
            : null;

        const result = checkCompliance({
            content,
            subject,
            offeringType: offeringType || 'REG_D_506B',
            investorHasPriorRelationship: investor?.priorRelationship || false,
            investorOptedOut: investor?.optedOut || false,
            investorAccreditedStatus: investor?.accreditedStatus || 'UNVERIFIED',
        });

        res.json({ data: result });
    } catch (error) {
        logger.error('Error running compliance check', { error });
        res.status(500).json({ error: 'Failed to run compliance check' });
    }
});

export default router;
