'use client';

import React, { useState } from 'react';

// ─── Mock Data ──────────────────────────────────────────────

const auditLog = [
    {
        id: '1',
        timestamp: '2026-02-14 02:45:12',
        event: 'Investor Qualification Call',
        actor: 'Voice AI Agent',
        investor: 'James Mitchell',
        detail: 'Accredited investor verification via income method. Qualification score: 92.',
        category: 'QUALIFICATION',
        status: 'COMPLIANT',
    },
    {
        id: '2',
        timestamp: '2026-02-14 02:15:33',
        event: 'PPM Document Sent',
        actor: 'System (Auto)',
        investor: 'Amanda Foster',
        detail: 'Private Placement Memorandum sent via DocuSign. Reg D 506(b) pre-existing relationship verified.',
        category: 'DOCUMENTATION',
        status: 'COMPLIANT',
    },
    {
        id: '3',
        timestamp: '2026-02-14 01:30:08',
        event: 'Opt-Out Request Processed',
        actor: 'System (Auto)',
        investor: 'Diana Torres',
        detail: 'Investor requested removal from all communication channels. Processed within 15 minutes. CAN-SPAM compliant.',
        category: 'OPT_OUT',
        status: 'COMPLIANT',
    },
    {
        id: '4',
        timestamp: '2026-02-14 00:12:45',
        event: 'Email Campaign Compliance Check',
        actor: 'Compliance Engine',
        investor: 'N/A',
        detail: 'Batch scan of "Nashville Hilton Family Office Intro" campaign. All 534 emails checked for solicitation language. No violations.',
        category: 'AUDIT',
        status: 'COMPLIANT',
    },
    {
        id: '5',
        timestamp: '2026-02-13 18:22:11',
        event: 'Pre-Existing Relationship Flagged',
        actor: 'Compliance Engine',
        investor: 'Robert Kim',
        detail: 'Investor does not have documented pre-existing relationship. Flagged for 506(b) review before any securities discussion.',
        category: 'FLAG',
        status: 'REVIEW',
    },
    {
        id: '6',
        timestamp: '2026-02-13 16:05:30',
        event: 'FINRA Rep Assignment',
        actor: 'Capital Markets',
        investor: 'Sarah Chen',
        detail: 'Qualified lead handed off to PPCI registered representative D. Siegel for securities discussion. CRD# verified.',
        category: 'HANDOFF',
        status: 'COMPLIANT',
    },
    {
        id: '7',
        timestamp: '2026-02-13 14:00:00',
        event: 'Daily Compliance Report Generated',
        actor: 'System (Auto)',
        investor: 'N/A',
        detail: 'Daily report: 0 violations, 23 calls audited, 534 emails scanned, 1 opt-out processed, 1 review flag open.',
        category: 'AUDIT',
        status: 'COMPLIANT',
    },
];

const complianceChecks = [
    { name: 'SEC Reg D 506(b) Compliance', status: 'PASS', description: 'No general solicitation in investor communications', lastChecked: '2 hrs ago' },
    { name: 'CAN-SPAM Act', status: 'PASS', description: 'All emails include unsubscribe, physical address, clear sender', lastChecked: '2 hrs ago' },
    { name: 'TCPA Compliance', status: 'PASS', description: 'All voice calls have prior consent; opt-out honored immediately', lastChecked: '4 hrs ago' },
    { name: 'Accredited Investor Verification', status: 'PASS', description: '312/312 investors verified via income, net worth, or entity status', lastChecked: '1 hr ago' },
    { name: 'FINRA Handoff Protocol', status: 'PASS', description: 'Securities discussions routed to PPCI registered reps only', lastChecked: '6 hrs ago' },
    { name: 'Data Privacy (SOC 2)', status: 'PASS', description: 'PII encryption at rest and in transit, access controls enforced', lastChecked: '12 hrs ago' },
    { name: 'Pre-Existing Relationship', status: 'REVIEW', description: '1 investor flagged — Robert Kim (Pacific Wealth Partners)', lastChecked: '8 hrs ago' },
    { name: 'Anti-Money Laundering (AML)', status: 'PASS', description: 'OFAC screening completed for all new investor contacts', lastChecked: '24 hrs ago' },
];

const statusIcons: Record<string, { bg: string; text: string; label: string }> = {
    PASS: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Pass' },
    REVIEW: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: 'Review' },
    FAIL: { bg: 'bg-rose-500/15', text: 'text-rose-400', label: 'Fail' },
};

const categoryColors: Record<string, string> = {
    QUALIFICATION: 'badge-brand',
    DOCUMENTATION: 'badge bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/20',
    OPT_OUT: 'badge bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/20',
    AUDIT: 'badge bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/20',
    FLAG: 'badge-amber',
    HANDOFF: 'badge-emerald',
};

const logStatusColors: Record<string, string> = {
    COMPLIANT: 'text-emerald-400',
    REVIEW: 'text-amber-400',
    VIOLATION: 'text-rose-400',
};

export default function CompliancePage() {
    const [tab, setTab] = useState<'checks' | 'audit'>('checks');

    const passCount = complianceChecks.filter(c => c.status === 'PASS').length;
    const reviewCount = complianceChecks.filter(c => c.status === 'REVIEW').length;
    const failCount = complianceChecks.filter(c => c.status === 'FAIL').length;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Compliance Center</h1>
                    <p className="text-sm text-gray-500 mt-1">SEC, FINRA, CAN-SPAM & TCPA compliance monitoring</p>
                </div>
                <div className="flex items-center gap-3">
                    {failCount === 0 && reviewCount <= 1 ? (
                        <span className="badge-emerald">
                            <ShieldCheckIcon className="w-3.5 h-3.5 mr-1.5" />
                            All Systems Compliant
                        </span>
                    ) : (
                        <span className="badge-amber">
                            <AlertIcon className="w-3.5 h-3.5 mr-1.5" />
                            {reviewCount} Items Need Review
                        </span>
                    )}
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Compliance Score" value="98.7%" change="+0.2%" trend="up" subtext="Across all channels" />
                <MetricCard label="Audit Events (30d)" value="4,812" change="+342" trend="up" subtext="All logged & traceable" />
                <MetricCard label="Violations (30d)" value="0" change="0" trend="up" subtext="Zero tolerance policy" />
                <MetricCard label="Opt-Outs Processed" value="23" change="100%" trend="up" subtext="Avg response: 8 min" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-2/50 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab('checks')}
                    className={tab === 'checks'
                        ? 'px-4 py-2 rounded-lg text-sm font-medium bg-brand-600/20 text-white border border-brand-500/20'
                        : 'px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors'
                    }
                >
                    Compliance Checks ({passCount}/{complianceChecks.length})
                </button>
                <button
                    onClick={() => setTab('audit')}
                    className={tab === 'audit'
                        ? 'px-4 py-2 rounded-lg text-sm font-medium bg-brand-600/20 text-white border border-brand-500/20'
                        : 'px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors'
                    }
                >
                    Audit Trail
                </button>
            </div>

            {tab === 'checks' ? (
                /* Compliance Checks Grid */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {complianceChecks.map((check, i) => (
                        <div key={i} className="glass-card-hover p-5 flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${statusIcons[check.status].bg}`}>
                                {check.status === 'PASS' ? (
                                    <CheckIcon className={`w-5 h-5 ${statusIcons[check.status].text}`} />
                                ) : (
                                    <AlertIcon className={`w-5 h-5 ${statusIcons[check.status].text}`} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-white">{check.name}</h4>
                                    <span className={`text-[10px] font-bold uppercase ${statusIcons[check.status].text}`}>
                                        {statusIcons[check.status].label}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed">{check.description}</p>
                                <p className="text-[10px] text-gray-600 mt-2">Last checked: {check.lastChecked}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Audit Log */
                <div className="glass-card divide-y divide-white/5">
                    {auditLog.map((log) => (
                        <div key={log.id} className="px-6 py-4 hover:bg-surface-3/30 transition-colors">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-medium text-white">{log.event}</p>
                                        <span className={categoryColors[log.category]}>{log.category}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">{log.detail}</p>
                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
                                        <span>Actor: {log.actor}</span>
                                        {log.investor !== 'N/A' && <span>Investor: {log.investor}</span>}
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={`text-xs font-medium ${logStatusColors[log.status]}`}>{log.status}</span>
                                    <p className="text-[10px] text-gray-600 mt-1">{log.timestamp}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FINRA / PPCI Notice */}
            <div className="glass-card p-5 border-l-4 border-brand-500">
                <div className="flex items-start gap-3">
                    <ShieldCheckIcon className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-1">Broker-Dealer Separation Notice</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            This AI platform operates as a top-of-funnel qualification and lead management tool only.
                            All securities-related discussions, investment advice, and subscription processing are handled exclusively by
                            <strong className="text-brand-400"> Peachtree PC Investors (PPCI), LLC</strong> — a registered broker-dealer, member FINRA/SIPC.
                            The AI system does not solicit, recommend, or offer securities.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Sub-Components ─────────────────────────────────────────

function MetricCard({ label, value, change, trend, subtext }: {
    label: string; value: string; change: string; trend: 'up' | 'down'; subtext: string;
}) {
    return (
        <div className="metric-card animate-slide-up">
            <p className="stat-label mb-2">{label}</p>
            <div className="flex items-end gap-2 mb-1">
                <p className="stat-value">{value}</p>
                <span className={`text-xs font-medium pb-1 ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>{change}</span>
            </div>
            <p className="text-xs text-gray-500">{subtext}</p>
        </div>
    );
}

function ShieldCheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
    );
}

function AlertIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
    );
}
