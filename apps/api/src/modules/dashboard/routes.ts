import { Router, Response } from 'express';
import prisma from '../../lib/prisma';
import { authenticate, AuthRequest } from '../../middleware/auth';
import logger from '../../lib/logger';

const router = Router();

/**
 * GET /dashboard/overview
 * Capital velocity dashboard — all KPIs in one call
 */
router.get('/overview', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // ─── Meetings KPIs ─────────────────────────────────
        const [meetingsThisWeek, meetingsThisMonth] = await Promise.all([
            prisma.meeting.count({
                where: {
                    scheduledAt: { gte: weekAgo },
                    status: { not: 'CANCELLED' },
                },
            }),
            prisma.meeting.count({
                where: {
                    scheduledAt: { gte: monthAgo },
                    status: { not: 'CANCELLED' },
                },
            }),
        ]);

        // ─── Pipeline Funnel ────────────────────────────────
        const funnel = await prisma.dealInvestor.groupBy({
            by: ['status'],
            _count: true,
        });

        const funnelMap = funnel.reduce((acc, f) => {
            acc[f.status] = f._count;
            return acc;
        }, {} as Record<string, number>);

        const totalContacted = (funnelMap.CONTACTED || 0) + (funnelMap.ENGAGED || 0) +
            (funnelMap.QUALIFIED || 0) + (funnelMap.MEETING_SCHEDULED || 0) +
            (funnelMap.MEETING_COMPLETED || 0) + (funnelMap.SOFT_COMMIT || 0) +
            (funnelMap.HARD_COMMIT || 0) + (funnelMap.FUNDED || 0);

        const conversionRates = {
            contactToMeeting: totalContacted > 0
                ? ((funnelMap.MEETING_SCHEDULED || 0) + (funnelMap.MEETING_COMPLETED || 0)) / totalContacted * 100
                : 0,
            meetingToSoftCommit: (funnelMap.MEETING_COMPLETED || 0) > 0
                ? (funnelMap.SOFT_COMMIT || 0) / (funnelMap.MEETING_COMPLETED || 0) * 100
                : 0,
            softToHardCommit: (funnelMap.SOFT_COMMIT || 0) > 0
                ? (funnelMap.HARD_COMMIT || 0) / (funnelMap.SOFT_COMMIT || 0) * 100
                : 0,
            hardCommitToFunded: (funnelMap.HARD_COMMIT || 0) > 0
                ? (funnelMap.FUNDED || 0) / (funnelMap.HARD_COMMIT || 0) * 100
                : 0,
        };

        // ─── Active Deals Pipeline ──────────────────────────
        const activeDeals = await prisma.deal.findMany({
            where: { status: { in: ['RAISING', 'UNDER_CONTRACT'] } },
            include: {
                _count: { select: { investors: true, commitments: true, meetings: true } },
            },
        });

        const dealPipelines = await Promise.all(
            activeDeals.map(async (deal) => {
                const commitments = await prisma.commitment.aggregate({
                    where: { dealId: deal.id },
                    _sum: { amount: true },
                });

                const weeklyCommitments = await prisma.commitment.aggregate({
                    where: { dealId: deal.id, date: { gte: weekAgo } },
                    _sum: { amount: true },
                });

                const weeklyVelocity = Number(weeklyCommitments._sum.amount || 0);
                const remaining = Number(deal.totalRaise) - Number(deal.raisedToDate);
                const daysToClose = weeklyVelocity > 0
                    ? Math.ceil(remaining / weeklyVelocity * 7)
                    : null;

                return {
                    id: deal.id,
                    name: deal.name,
                    propertyName: deal.propertyName,
                    totalRaise: Number(deal.totalRaise),
                    raisedToDate: Number(deal.raisedToDate),
                    raiseProgress: Number(deal.raisedToDate) / Number(deal.totalRaise) * 100,
                    weeklyVelocity,
                    projectedDaysToClose: daysToClose,
                    investorCount: deal._count.investors,
                    meetingCount: deal._count.meetings,
                    commitmentCount: deal._count.commitments,
                };
            })
        );

        // ─── Email Engagement ───────────────────────────────
        const emailEvents = await prisma.outreachEvent.groupBy({
            by: ['eventType'],
            where: { occurredAt: { gte: monthAgo } },
            _count: true,
        });

        const emailMetrics = emailEvents.reduce((acc, e) => {
            acc[e.eventType] = e._count;
            return acc;
        }, {} as Record<string, number>);

        const emailEngagementRate = (emailMetrics.DELIVERED || 0) > 0
            ? (emailMetrics.OPENED || 0) / (emailMetrics.DELIVERED || 0) * 100
            : 0;

        // ─── Voice Qualification ────────────────────────────
        const [totalCalls, qualifiedCalls] = await Promise.all([
            prisma.voiceCall.count({
                where: { status: 'COMPLETED', startedAt: { gte: monthAgo } },
            }),
            prisma.voiceCall.count({
                where: { qualifiedForBooking: true, startedAt: { gte: monthAgo } },
            }),
        ]);

        const voiceQualificationRate = totalCalls > 0
            ? qualifiedCalls / totalCalls * 100
            : 0;

        // ─── Investor Overlap ───────────────────────────────
        const investorDealCounts = await prisma.dealInvestor.groupBy({
            by: ['investorId'],
            _count: true,
            having: { investorId: { _count: { gt: 1 } } },
        });

        // ─── Response ───────────────────────────────────────
        res.json({
            data: {
                meetings: {
                    thisWeek: meetingsThisWeek,
                    thisMonth: meetingsThisMonth,
                    weeklyTarget: 15,
                },
                funnel: funnelMap,
                conversionRates,
                dealPipelines,
                emailMetrics: {
                    ...emailMetrics,
                    engagementRate: emailEngagementRate,
                },
                voiceMetrics: {
                    totalCalls,
                    qualifiedCalls,
                    qualificationRate: voiceQualificationRate,
                },
                investorOverlap: investorDealCounts.length,
                totalActiveInvestors: totalContacted,
            },
        });
    } catch (error) {
        logger.error('Error fetching dashboard', { error });
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

/**
 * GET /dashboard/raise-timeline/:dealId
 * Raise velocity forecasting for a specific deal
 */
router.get('/raise-timeline/:dealId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const deal = await prisma.deal.findUnique({ where: { id: req.params.dealId } });
        if (!deal) {
            res.status(404).json({ error: 'Deal not found' });
            return;
        }

        // Get weekly commitment history
        const commitments = await prisma.commitment.findMany({
            where: { dealId: deal.id },
            orderBy: { date: 'asc' },
        });

        // Group by week
        const weeklyData: { week: string; amount: number; cumulative: number }[] = [];
        let cumulative = 0;

        const grouped = commitments.reduce((acc, c) => {
            const week = getWeekKey(c.date);
            if (!acc[week]) acc[week] = 0;
            acc[week] += Number(c.amount);
            return acc;
        }, {} as Record<string, number>);

        for (const [week, amount] of Object.entries(grouped)) {
            cumulative += amount;
            weeklyData.push({ week, amount, cumulative });
        }

        // Calculate velocity and forecast
        const recentWeeks = weeklyData.slice(-4);
        const avgWeeklyVelocity = recentWeeks.length > 0
            ? recentWeeks.reduce((sum, w) => sum + w.amount, 0) / recentWeeks.length
            : 0;

        const remaining = Number(deal.totalRaise) - Number(deal.raisedToDate);
        const weeksToClose = avgWeeklyVelocity > 0 ? Math.ceil(remaining / avgWeeklyVelocity) : null;

        res.json({
            data: {
                deal: { id: deal.id, name: deal.name, totalRaise: Number(deal.totalRaise) },
                weeklyData,
                currentVelocity: avgWeeklyVelocity,
                remaining,
                projectedWeeksToClose: weeksToClose,
                projectedCloseDate: weeksToClose
                    ? new Date(Date.now() + weeksToClose * 7 * 24 * 60 * 60 * 1000).toISOString()
                    : null,
                raiseStartDate: deal.raiseStartDate?.toISOString() || null,
                targetCloseDate: deal.raiseTargetClose?.toISOString() || null,
            },
        });
    } catch (error) {
        logger.error('Error fetching raise timeline', { error });
        res.status(500).json({ error: 'Failed to fetch raise timeline' });
    }
});

function getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // start of week
    return d.toISOString().split('T')[0];
}

export default router;
