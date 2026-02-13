import { Router, Response, Request } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';
import logger from '../../lib/logger';
import { z } from 'zod';

const router = Router();

// ─── Voice Call Management ──────────────────────────────────

/**
 * POST /voice/calls
 * Initiate an outbound voice call for investor qualification
 */
router.post('/calls', authenticate, authorize('ADMIN', 'MANAGER', 'ANALYST'), async (req: AuthRequest, res: Response) => {
    try {
        const schema = z.object({
            investorId: z.string(),
            dealId: z.string().optional(),
        });
        const data = schema.parse(req.body);

        const investor = await prisma.investor.findUnique({ where: { id: data.investorId } });
        if (!investor) {
            res.status(404).json({ error: 'Investor not found' });
            return;
        }

        if (investor.optedOut || investor.doNotContact) {
            res.status(403).json({ error: 'Investor is on Do Not Contact list' });
            return;
        }

        if (!investor.phone) {
            res.status(400).json({ error: 'Investor has no phone number on file' });
            return;
        }

        // Create call record
        const call = await prisma.voiceCall.create({
            data: {
                investorId: data.investorId,
                direction: 'OUTBOUND',
                status: 'INITIATED',
            },
        });

        // In production, this would trigger Twilio:
        // const twilioCall = await twilioClient.calls.create({
        //   to: investor.phone,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   url: `${process.env.API_BASE_URL}/voice/twiml/${call.id}`,
        //   statusCallback: `${process.env.API_BASE_URL}/voice/status/${call.id}`,
        // });
        // await prisma.voiceCall.update({ where: { id: call.id }, data: { twilioCallSid: twilioCall.sid } });

        await logAuditEvent({
            userId: req.user?.id,
            investorId: investor.id,
            action: 'INITIATE_CALL',
            entity: 'VoiceCall',
            entityId: call.id,
            after: { direction: 'OUTBOUND', investorPhone: investor.phone },
        });

        res.status(201).json({ data: call });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        logger.error('Error initiating call', { error });
        res.status(500).json({ error: 'Failed to initiate call' });
    }
});

/**
 * POST /voice/qualification/:callId
 * Submit voice qualification results (called by AI agent or human)
 */
router.post('/qualification/:callId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const schema = z.object({
            accreditedConfirmed: z.boolean().optional(),
            statedCheckSize: z.number().optional(),
            returnExpectation: z.string().optional(),
            hospitalityExp: z.string().optional(),
            investorSentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).optional(),
            qualificationScore: z.number().min(0).max(100).optional(),
            qualifiedForBooking: z.boolean().optional(),
            consentRecorded: z.boolean().optional(),
            disclaimerPlayed: z.boolean().optional(),
        });

        const data = schema.parse(req.body);

        const call = await prisma.voiceCall.update({
            where: { id: req.params.callId },
            data: {
                ...data,
                status: 'COMPLETED',
                endedAt: new Date(),
            },
            include: { investor: true },
        });

        // Auto-route to calendar booking if qualified
        if (data.qualifiedForBooking && data.qualificationScore && data.qualificationScore >= 70) {
            // Update investor deal status
            const dealInvestors = await prisma.dealInvestor.findMany({
                where: {
                    investorId: call.investorId,
                    status: { in: ['CONTACTED', 'ENGAGED', 'QUALIFIED'] },
                },
            });

            for (const di of dealInvestors) {
                await prisma.dealInvestor.update({
                    where: { id: di.id },
                    data: { status: 'QUALIFIED' },
                });
            }

            // Log activity
            await prisma.activity.create({
                data: {
                    investorId: call.investorId,
                    type: 'VOICE_QUALIFIED',
                    description: `Voice qualification completed. Score: ${data.qualificationScore}. Ready for calendar booking.`,
                    metadata: {
                        callId: call.id,
                        score: data.qualificationScore,
                        sentiment: data.investorSentiment,
                    },
                },
            });
        }

        await logAuditEvent({
            userId: req.user?.id,
            investorId: call.investorId,
            action: 'VOICE_QUALIFICATION',
            entity: 'VoiceCall',
            entityId: call.id,
            after: data,
        });

        res.json({ data: call });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        logger.error('Error submitting qualification', { error });
        res.status(500).json({ error: 'Failed to submit qualification' });
    }
});

/**
 * POST /voice/webhook/status
 * Twilio status callback webhook
 */
router.post('/webhook/status', async (req: Request, res: Response) => {
    try {
        const { CallSid, CallStatus, CallDuration, RecordingUrl } = req.body;

        const statusMap: Record<string, string> = {
            'queued': 'INITIATED',
            'ringing': 'RINGING',
            'in-progress': 'IN_PROGRESS',
            'completed': 'COMPLETED',
            'failed': 'FAILED',
            'no-answer': 'NO_ANSWER',
            'busy': 'BUSY',
        };

        await prisma.voiceCall.updateMany({
            where: { twilioCallSid: CallSid },
            data: {
                status: (statusMap[CallStatus] || 'FAILED') as any,
                duration: CallDuration ? parseInt(CallDuration) : undefined,
                recordingUrl: RecordingUrl || undefined,
                endedAt: ['completed', 'failed', 'no-answer', 'busy'].includes(CallStatus) ? new Date() : undefined,
            },
        });

        res.sendStatus(200);
    } catch (error) {
        logger.error('Error processing Twilio webhook', { error });
        res.sendStatus(500);
    }
});

export default router;
