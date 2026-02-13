/**
 * Compliance Filter Engine
 *
 * Pre-send validation for all investor-facing communications.
 * Enforces SEC Reg D 506(b)/506(c) rules, broker-dealer separation,
 * and FINRA-safe language requirements.
 */

import logger from './logger';

// ─── Types ───────────────────────────────────────────────────

export interface ComplianceCheckInput {
    content: string;
    subject?: string;
    offeringType: 'REG_D_506B' | 'REG_D_506C';
    investorHasPriorRelationship: boolean;
    investorOptedOut: boolean;
    investorAccreditedStatus: string;
}

export interface ComplianceCheckResult {
    passed: boolean;
    violations: ComplianceViolation[];
    warnings: ComplianceWarning[];
    sanitizedContent?: string;
}

export interface ComplianceViolation {
    rule: string;
    severity: 'CRITICAL' | 'HIGH';
    message: string;
    matchedText?: string;
}

export interface ComplianceWarning {
    rule: string;
    message: string;
}

// ─── Prohibited Patterns ─────────────────────────────────────

const PROHIBITED_PATTERNS = [
    { pattern: /guarante(?:e|ed|es|ing)\s+(?:return|profit|income|yield)/i, rule: 'NO_PERFORMANCE_GUARANTEE', message: 'Contains performance guarantee language' },
    { pattern: /risk[- ]?free/i, rule: 'NO_RISK_FREE', message: 'Claims risk-free investment' },
    { pattern: /you\s+(?:should|must|need\s+to)\s+invest/i, rule: 'NO_INVESTMENT_ADVICE', message: 'Contains investment advice/recommendation language' },
    { pattern: /(?:can't|cannot|won't)\s+lose/i, rule: 'NO_LOSS_PREVENTION', message: 'Implies principal protection' },
    { pattern: /once[- ]?in[- ]?a[- ]?lifetime/i, rule: 'NO_HYPE', message: 'Uses hype language' },
    { pattern: /(?:exclusive|limited)\s+(?:time\s+)?(?:offer|opportunity)/i, rule: 'NO_PRESSURE', message: 'Creates artificial urgency/pressure' },
    { pattern: /no[- ]?risk/i, rule: 'NO_RISK_FREE', message: 'Claims no risk' },
    { pattern: /(?:sure|certain)\s+(?:thing|bet|win)/i, rule: 'NO_CERTAINTY', message: 'Implies certainty of returns' },
    { pattern: /we\s+recommend\s+(?:you\s+)?invest/i, rule: 'NO_RECOMMENDATION', message: 'Makes investment recommendation' },
];

const REQUIRED_ELEMENTS = [
    { pattern: /past\s+performance\s+(?:does\s+not|is\s+no)\s+(?:guarantee|indicator)/i, rule: 'PAST_PERFORMANCE_DISCLAIMER', message: 'Missing past performance disclaimer' },
    { pattern: /(?:not\s+a?\s*(?:registered\s+)?broker[- ]?dealer|not\s+acting\s+as\s+a?\s*broker)/i, rule: 'BROKER_DEALER_DISCLAIMER', message: 'Missing broker-dealer disclaimer' },
];

// ─── Disclaimer Templates ────────────────────────────────────

export const DISCLAIMERS = {
    emailFooter: `
---
This communication is for informational purposes only and does not constitute an offer to sell or a solicitation of an offer to buy any security. Securities are offered only to qualified investors through official offering documents. ${process.env.FIRM_NAME || '[FIRM]'} is not a registered broker-dealer. Past performance does not guarantee future results. All investments carry risk including the potential loss of principal.

To opt out of future communications, click here: {{unsubscribe_link}}
  `.trim(),

    voiceOpening: `This call is being recorded for quality and compliance purposes. I'm reaching out on behalf of ${process.env.FIRM_NAME || '[FIRM]'} regarding a hospitality investment opportunity. This is not a solicitation to buy securities, and any investment decision should be made only after reviewing the full offering documents with your own advisors. May I continue?`,

    voiceClosing: `Thank you for your time. As a reminder, ${process.env.FIRM_NAME || '[FIRM]'} is not a registered broker-dealer, and nothing discussed today constitutes investment advice or a solicitation. Any investment is subject to the terms in the private placement memorandum.`,

    smsDisclaimer: `Msg from ${process.env.FIRM_NAME || '[FIRM]'}. Not investment advice. Reply STOP to opt out.`,
};

// ─── Main Compliance Check ───────────────────────────────────

export function checkCompliance(input: ComplianceCheckInput): ComplianceCheckResult {
    const violations: ComplianceViolation[] = [];
    const warnings: ComplianceWarning[] = [];
    const fullContent = `${input.subject || ''} ${input.content}`;

    // 1. Check opt-out status (CRITICAL)
    if (input.investorOptedOut) {
        violations.push({
            rule: 'OPT_OUT_RESPECTED',
            severity: 'CRITICAL',
            message: 'Investor has opted out of communications',
        });
    }

    // 2. Check 506(b) prior relationship requirement (CRITICAL)
    if (input.offeringType === 'REG_D_506B' && !input.investorHasPriorRelationship) {
        violations.push({
            rule: '506B_PRIOR_RELATIONSHIP',
            severity: 'CRITICAL',
            message: 'Reg D 506(b) requires substantive pre-existing relationship',
        });
    }

    // 3. Check 506(c) accredited requirement
    if (
        input.offeringType === 'REG_D_506C' &&
        input.investorAccreditedStatus === 'NOT_ACCREDITED'
    ) {
        violations.push({
            rule: '506C_ACCREDITED_ONLY',
            severity: 'CRITICAL',
            message: 'Reg D 506(c) requires verified accredited investor status',
        });
    }

    // 4. Check prohibited language patterns
    for (const { pattern, rule, message } of PROHIBITED_PATTERNS) {
        const match = fullContent.match(pattern);
        if (match) {
            violations.push({
                rule,
                severity: 'HIGH',
                message,
                matchedText: match[0],
            });
        }
    }

    // 5. Check required disclaimer elements
    for (const { pattern, rule, message } of REQUIRED_ELEMENTS) {
        if (!pattern.test(fullContent)) {
            warnings.push({ rule, message });
        }
    }

    // 6. Check "projected/targeted" language for returns
    const returnMention = fullContent.match(/(\d+\.?\d*)\s*%\s*(return|irr|yield|cash[- ]on[- ]cash)/i);
    if (returnMention) {
        const hasQualifier = /(?:projected|targeted|estimated|anticipated)/i.test(fullContent);
        if (!hasQualifier) {
            violations.push({
                rule: 'QUALIFY_RETURN_PROJECTIONS',
                severity: 'HIGH',
                message: 'Return references must be qualified as "projected" or "targeted"',
                matchedText: returnMention[0],
            });
        }
    }

    const passed = violations.length === 0;

    logger.info('Compliance check completed', {
        passed,
        violationCount: violations.length,
        warningCount: warnings.length,
        offeringType: input.offeringType,
    });

    return { passed, violations, warnings };
}

/**
 * Appends the required compliance footer to email content
 */
export function appendComplianceFooter(
    content: string,
    unsubscribeLink: string
): string {
    const footer = DISCLAIMERS.emailFooter.replace('{{unsubscribe_link}}', unsubscribeLink);
    return `${content}\n\n${footer}`;
}

/**
 * Validates that the system is operating within broker-dealer boundaries.
 * Returns true if the action is safe from BD perspective.
 */
export function isBrokerDealerSafe(action: string): boolean {
    const PROHIBITED_ACTIONS = [
        'negotiate_terms',
        'handle_funds',
        'make_recommendation',
        'provide_valuation',
        'receive_commission',
        'execute_transaction',
    ];
    return !PROHIBITED_ACTIONS.includes(action);
}
