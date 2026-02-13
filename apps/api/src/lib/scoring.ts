/**
 * Investor Scoring Engine
 *
 * Composite score (0-100) using weighted dimensions:
 *   Accreditation (20%) + Check Size Fit (25%) + Asset Alignment (15%) +
 *   Engagement (15%) + Behavioral (10%) + Relationship (10%) + Urgency (5%)
 */

import { AccreditedStatus, HospitalityExp } from '@prisma/client';

// ─── Types ───────────────────────────────────────────────────

export interface InvestorScoreInput {
    accreditedStatus: AccreditedStatus;
    checkSizeMin: number | null;
    checkSizeMax: number | null;
    dealMinimum: number;
    dealTarget: number;
    assetClassPrefs: string[];
    priorHotelInvestments: number;
    hospitalityExperience: HospitalityExp;
    emailOpens30d: number;
    emailClicks30d: number;
    emailReplies30d: number;
    voiceCallsCompleted30d: number;
    websiteVisits30d: number;
    docDownloads30d: number;
    isPriorInvestor: boolean;
    isReferral: boolean;
    has1031Exchange: boolean;
    deploymentDeadlineDays: number | null;
}

export interface ScoreBreakdown {
    total: number;
    accreditation: number;
    checkSizeFit: number;
    assetAlignment: number;
    engagement: number;
    behavioral: number;
    relationship: number;
    urgency: number;
    tier: 'A+' | 'A' | 'B' | 'C' | 'D';
}

// ─── Weights ─────────────────────────────────────────────────

const WEIGHTS = {
    accreditation: 0.20,
    checkSizeFit: 0.25,
    assetAlignment: 0.15,
    engagement: 0.15,
    behavioral: 0.10,
    relationship: 0.10,
    urgency: 0.05,
} as const;

// ─── Sub-Scorers ─────────────────────────────────────────────

function scoreAccreditation(status: AccreditedStatus): number {
    const scores: Record<AccreditedStatus, number> = {
        THIRD_PARTY_VERIFIED: 100,
        INSTITUTIONAL: 100,
        SELF_CERTIFIED: 70,
        UNVERIFIED: 30,
        NOT_ACCREDITED: 0,
    };
    return scores[status];
}

function scoreCheckSizeFit(
    checkMin: number | null,
    checkMax: number | null,
    dealMin: number,
    dealTarget: number
): number {
    if (!checkMin && !checkMax) return 20; // unknown = low score
    const investorMid = ((checkMin || 0) + (checkMax || checkMin || 0)) / 2;

    if (investorMid >= dealTarget) return 100; // can cover target allocation
    if (investorMid >= dealMin * 2) return 85;  // solid check size
    if (investorMid >= dealMin) return 65;      // meets minimum
    if (investorMid >= dealMin * 0.5) return 35; // close to minimum
    return 10; // too small
}

function scoreAssetAlignment(prefs: string[], priorHotel: number, experience: HospitalityExp): number {
    let score = 0;

    // Asset class preference
    const hasHotel = prefs.some((p) => p.toLowerCase().includes('hotel') || p.toLowerCase().includes('hospitality'));
    if (hasHotel) score += 40;
    else if (prefs.length === 0) score += 15; // no prefs = open-minded
    else score += 5; // prefers other asset classes

    // Prior investments
    if (priorHotel >= 5) score += 30;
    else if (priorHotel >= 2) score += 25;
    else if (priorHotel >= 1) score += 15;
    else score += 0;

    // Experience level
    const expScores: Record<HospitalityExp, number> = {
        DEVELOPER: 30,
        OPERATOR: 28,
        ACTIVE_LP: 25,
        PASSIVE_LP: 20,
        NONE: 5,
    };
    score += expScores[experience];

    return Math.min(score, 100);
}

function scoreEngagement(input: InvestorScoreInput): number {
    let score = 0;
    score += Math.min(input.emailReplies30d * 30, 40);   // replies are strongest signal
    score += Math.min(input.emailClicks30d * 10, 25);
    score += Math.min(input.emailOpens30d * 3, 15);
    score += Math.min(input.voiceCallsCompleted30d * 15, 20);
    return Math.min(score, 100);
}

function scoreBehavioral(input: InvestorScoreInput): number {
    let score = 0;
    score += Math.min(input.websiteVisits30d * 8, 40);
    score += Math.min(input.docDownloads30d * 20, 60);
    return Math.min(score, 100);
}

function scoreRelationship(isPrior: boolean, isReferral: boolean): number {
    if (isPrior && isReferral) return 100;
    if (isPrior) return 90;
    if (isReferral) return 75;
    return 15;
}

function scoreUrgency(has1031: boolean, deadlineDays: number | null): number {
    let score = 0;
    if (has1031) score += 60;
    if (deadlineDays !== null) {
        if (deadlineDays <= 30) score += 40;
        else if (deadlineDays <= 90) score += 25;
        else if (deadlineDays <= 180) score += 10;
    }
    return Math.min(score, 100);
}

function getTier(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' {
    if (score >= 85) return 'A+';
    if (score >= 70) return 'A';
    if (score >= 50) return 'B';
    if (score >= 30) return 'C';
    return 'D';
}

// ─── Main Scorer ─────────────────────────────────────────────

export function calculateInvestorScore(input: InvestorScoreInput): ScoreBreakdown {
    const accreditation = scoreAccreditation(input.accreditedStatus);
    const checkSizeFit = scoreCheckSizeFit(
        input.checkSizeMin,
        input.checkSizeMax,
        input.dealMinimum,
        input.dealTarget
    );
    const assetAlignment = scoreAssetAlignment(
        input.assetClassPrefs,
        input.priorHotelInvestments,
        input.hospitalityExperience
    );
    const engagement = scoreEngagement(input);
    const behavioral = scoreBehavioral(input);
    const relationship = scoreRelationship(input.isPriorInvestor, input.isReferral);
    const urgency = scoreUrgency(input.has1031Exchange, input.deploymentDeadlineDays);

    const total = Math.round(
        accreditation * WEIGHTS.accreditation +
        checkSizeFit * WEIGHTS.checkSizeFit +
        assetAlignment * WEIGHTS.assetAlignment +
        engagement * WEIGHTS.engagement +
        behavioral * WEIGHTS.behavioral +
        relationship * WEIGHTS.relationship +
        urgency * WEIGHTS.urgency
    );

    return {
        total,
        accreditation,
        checkSizeFit,
        assetAlignment,
        engagement,
        behavioral,
        relationship,
        urgency,
        tier: getTier(total),
    };
}
