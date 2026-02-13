import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';
import { logAuditEvent } from '../../middleware/audit';
import logger from '../../lib/logger';
import { z } from 'zod';

const router = Router();

/**
 * GET /disposition/buyers
 * List hotel buyers with engagement tracking
 */
router.get('/buyers', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { type, market, minAcquisition, maxAcquisition } = req.query;
        const where: any = {};

        if (type) where.buyerType = type;
        if (market) where.preferredMarkets = { hasSome: [market as string] };
        if (minAcquisition) where.acquisitionMax = { gte: parseFloat(minAcquisition as string) };
        if (maxAcquisition) where.acquisitionMin = { lte: parseFloat(maxAcquisition as string) };

        const buyers = await prisma.buyer.findMany({
            where,
            include: {
                _count: { select: { lois: true, engagements: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json({ data: buyers });
    } catch (error) {
        logger.error('Error fetching buyers', { error });
        res.status(500).json({ error: 'Failed to fetch buyers' });
    }
});

/**
 * POST /disposition/blast
 * Execute a buyer blast campaign for a disposition
 */
router.post('/blast', authenticate, authorize('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
    try {
        const schema = z.object({
            dealName: z.string(),
            askingPrice: z.number().positive(),
            propertyType: z.string(),
            market: z.string(),
            roomCount: z.number().int().positive(),
            brand: z.string().optional(),
            buyerFilters: z.object({
                buyerTypes: z.array(z.string()).optional(),
                markets: z.array(z.string()).optional(),
                minAcquisition: z.number().optional(),
                maxAcquisition: z.number().optional(),
            }).optional(),
        });

        const data = schema.parse(req.body);
        const filters: any = {};

        if (data.buyerFilters?.buyerTypes?.length) {
            filters.buyerType = { in: data.buyerFilters.buyerTypes };
        }
        if (data.buyerFilters?.markets?.length) {
            filters.preferredMarkets = { hasSome: data.buyerFilters.markets };
        }
        if (data.buyerFilters?.minAcquisition) {
            filters.acquisitionMax = { gte: data.buyerFilters.minAcquisition };
        }

        const targetBuyers = await prisma.buyer.findMany({ where: filters });

        // Create engagement records for each buyer
        const engagements = await Promise.all(
            targetBuyers.map((buyer) =>
                prisma.buyerEngagement.create({
                    data: {
                        buyerId: buyer.id,
                        eventType: 'BLAST_SENT',
                        metadata: {
                            dealName: data.dealName,
                            askingPrice: data.askingPrice,
                            propertyType: data.propertyType,
                            market: data.market,
                        },
                    },
                })
            )
        );

        await logAuditEvent({
            userId: req.user?.id,
            action: 'DISPOSITION_BLAST',
            entity: 'Disposition',
            entityId: data.dealName,
            after: {
                targetBuyerCount: targetBuyers.length,
                dealName: data.dealName,
                askingPrice: data.askingPrice,
            },
        });

        res.json({
            data: {
                dealName: data.dealName,
                buyersTargeted: targetBuyers.length,
                engagementsCreated: engagements.length,
            },
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        logger.error('Error executing blast', { error });
        res.status(500).json({ error: 'Failed to execute blast' });
    }
});

/**
 * GET /disposition/heatmap/:dealName
 * Buyer engagement heatmap data
 */
router.get('/heatmap/:dealName', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { dealName } = req.params;

        const engagements = await prisma.buyerEngagement.findMany({
            where: {
                metadata: { path: ['dealName'], equals: dealName },
            },
            include: {
                buyer: {
                    select: {
                        id: true,
                        companyName: true,
                        contactName: true,
                        buyerType: true,
                        acquisitionMin: true,
                        acquisitionMax: true,
                    },
                },
            },
            orderBy: { occurredAt: 'desc' },
        });

        // Build heatmap: engagement depth per buyer
        const buyerMap = new Map<string, {
            buyer: any;
            events: string[];
            score: number;
            lastActivity: Date;
        }>();

        const eventWeights: Record<string, number> = {
            BLAST_SENT: 1,
            EMAIL_OPENED: 2,
            CA_SIGNED: 5,
            OM_DOWNLOADED: 8,
            TOUR_SCHEDULED: 15,
            LOI_SUBMITTED: 25,
        };

        for (const eng of engagements) {
            const existing = buyerMap.get(eng.buyerId) || {
                buyer: eng.buyer,
                events: [],
                score: 0,
                lastActivity: eng.occurredAt,
            };
            existing.events.push(eng.eventType);
            existing.score += eventWeights[eng.eventType] || 1;
            if (eng.occurredAt > existing.lastActivity) {
                existing.lastActivity = eng.occurredAt;
            }
            buyerMap.set(eng.buyerId, existing);
        }

        const heatmapData = Array.from(buyerMap.values())
            .sort((a, b) => b.score - a.score);

        // LOI summary
        const lois = await prisma.lOI.findMany({
            where: { dealName },
            include: {
                buyer: { select: { companyName: true, contactName: true, buyerType: true } },
            },
            orderBy: { offerPrice: 'desc' },
        });

        // Competitive pressure metrics
        const totalLOIs = lois.length;
        const avgOfferPrice = lois.length > 0
            ? lois.reduce((sum, l) => sum + Number(l.offerPrice), 0) / lois.length
            : 0;
        const highestOffer = lois.length > 0 ? Number(lois[0].offerPrice) : 0;

        res.json({
            data: {
                heatmap: heatmapData,
                lois,
                competitivePressure: {
                    totalLOIs,
                    avgOfferPrice,
                    highestOffer,
                    buyersEngaged: buyerMap.size,
                    deeplyEngaged: heatmapData.filter((b) => b.score >= 10).length,
                },
            },
        });
    } catch (error) {
        logger.error('Error fetching heatmap', { error });
        res.status(500).json({ error: 'Failed to fetch heatmap' });
    }
});

export default router;
