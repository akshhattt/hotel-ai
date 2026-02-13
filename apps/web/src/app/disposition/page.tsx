'use client';

import React, { useState } from 'react';

// ─── Mock Data ──────────────────────────────────────────────

const investors = [
    {
        id: '1',
        name: 'James Mitchell',
        firm: 'Meridian Family Office',
        deal: 'Hampton Inn & Suites — Kahului, HI',
        stage: 'SOFT_COMMIT',
        commitAmount: 500000,
        source: 'Voice AI',
        score: 92,
        accredited: true,
        lastTouch: '2 hrs ago',
        nextAction: 'Send PPM via DocuSign',
        notes: 'Ready to commit $500K. Needs final PPM review and subscription docs.',
    },
    {
        id: '2',
        name: 'Sarah Chen',
        firm: 'Bluewater Private Equity',
        deal: 'Hilton Garden Inn — Phoenix, AZ',
        stage: 'MEETING_SCHEDULED',
        commitAmount: 1000000,
        source: 'Email',
        score: 87,
        accredited: true,
        lastTouch: '4 hrs ago',
        nextAction: 'Zoom call scheduled Feb 17',
        notes: 'LP at PE fund with hotel mandate. Previously invested in Hilton brands.',
    },
    {
        id: '3',
        name: 'Robert Kim',
        firm: 'Pacific Wealth Partners',
        deal: 'Hampton Inn & Suites — Kahului, HI',
        stage: 'NURTURE',
        commitAmount: 0,
        source: 'Voice AI',
        score: 61,
        accredited: false,
        lastTouch: '6 hrs ago',
        nextAction: 'Follow up in 2 weeks on QP status',
        notes: 'Interested but not accredited through traditional means. Exploring QP route.',
    },
    {
        id: '4',
        name: 'Amanda Foster',
        firm: 'Lakewood Family Trust',
        deal: 'Hampton Inn & Suites — Kahului, HI',
        stage: 'HARD_COMMIT',
        commitAmount: 750000,
        source: 'Voice AI',
        score: 95,
        accredited: true,
        lastTouch: 'Yesterday',
        nextAction: 'Wiring instructions sent — awaiting fund',
        notes: 'Committed $750K. Has invested in 3 hotel properties before. High conviction investor.',
    },
    {
        id: '5',
        name: 'Alex Kumar',
        firm: 'Pine Wealth Management',
        deal: 'Home2 Suites — Sacramento, CA',
        stage: 'QUALIFIED',
        commitAmount: 250000,
        source: 'Email',
        score: 78,
        accredited: true,
        lastTouch: '1 day ago',
        nextAction: 'Send Austin boutique investment deck',
        notes: 'First-time hotel investor. Interested in lifestyle/boutique segment.',
    },
    {
        id: '6',
        name: 'Diana Torres',
        firm: 'Eagle Rock Ventures',
        deal: 'N/A',
        stage: 'DISQUALIFIED',
        commitAmount: 0,
        source: 'Voice AI',
        score: 18,
        accredited: true,
        lastTouch: '1 day ago',
        nextAction: 'Remove from active pipeline',
        notes: 'Not currently allocating to hospitality. Focused on industrial.',
    },
];

const stageConfig: Record<string, { label: string; class: string; order: number }> = {
    HARD_COMMIT: { label: 'Hard Commit', class: 'badge bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20', order: 1 },
    SOFT_COMMIT: { label: 'Soft Commit', class: 'badge bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/20', order: 2 },
    MEETING_SCHEDULED: { label: 'Meeting', class: 'badge-brand', order: 3 },
    QUALIFIED: { label: 'Qualified', class: 'badge-amber', order: 4 },
    NURTURE: { label: 'Nurture', class: 'badge bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/20', order: 5 },
    DISQUALIFIED: { label: 'Disqualified', class: 'badge-rose', order: 6 },
};

const pipelineSummary = [
    { stage: 'Hard Commit', count: 4, amount: 2850000, color: '#10b981' },
    { stage: 'Soft Commit', count: 8, amount: 4200000, color: '#06b6d4' },
    { stage: 'Meeting Scheduled', count: 12, amount: 0, color: '#4c6ef5' },
    { stage: 'Qualified', count: 22, amount: 0, color: '#f59e0b' },
    { stage: 'Nurture', count: 38, amount: 0, color: '#6b7280' },
    { stage: 'Disqualified', count: 7, amount: 0, color: '#374151' },
];

export default function DispositionPage() {
    const [selectedStage, setSelectedStage] = useState<string | null>(null);
    const filtered = selectedStage ? investors.filter(i => i.stage === selectedStage) : investors;

    const totalCommitted = investors.filter(i => i.stage === 'HARD_COMMIT' || i.stage === 'SOFT_COMMIT')
        .reduce((sum, i) => sum + i.commitAmount, 0);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Disposition Tracking</h1>
                    <p className="text-sm text-gray-500 mt-1">Investor pipeline stages, commitments & next actions</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <ExportIcon className="w-4 h-4" />
                    Export Pipeline
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Committed" value={`$${(totalCommitted / 1000000).toFixed(1)}M`} change="+$750K" trend="up" subtext="Hard + Soft commits" />
                <MetricCard label="Conversion Rate" value="14.2%" change="+2.3%" trend="up" subtext="Contact → Commit" />
                <MetricCard label="Avg Days to Commit" value="18" change="-5d" trend="up" subtext="Target: <21 days" />
                <MetricCard label="Active Pipeline" value="91" change="+12" trend="up" subtext="Qualified or better" />
            </div>

            {/* Pipeline Funnel */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Pipeline by Stage</h3>
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                    {pipelineSummary.map((s) => (
                        <button
                            key={s.stage}
                            onClick={() => {
                                const stageKey = Object.keys(stageConfig).find(k => stageConfig[k].label === s.stage) || null;
                                setSelectedStage(selectedStage === stageKey ? null : stageKey);
                            }}
                            className={`rounded-xl p-4 border transition-all ${selectedStage && stageConfig[selectedStage]?.label === s.stage
                                ? 'border-brand-500/40 bg-brand-600/10'
                                : 'border-white/5 bg-surface-3/50 hover:border-white/10'
                                }`}
                        >
                            <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: s.color }} />
                            <p className="text-2xl font-bold text-white">{s.count}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{s.stage}</p>
                            {s.amount > 0 && (
                                <p className="text-xs text-emerald-400 font-mono mt-1">${(s.amount / 1000000).toFixed(1)}M</p>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Investor Table */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300">
                        {selectedStage ? `${stageConfig[selectedStage]?.label} Investors` : 'All Investors'} ({filtered.length})
                    </h3>
                    {selectedStage && (
                        <button onClick={() => setSelectedStage(null)} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                            Clear filter
                        </button>
                    )}
                </div>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Investor</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Deal</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Stage</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Score</th>
                            <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Commit $</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Next Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((inv) => (
                            <tr key={inv.id} className="table-row">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-xs font-bold text-gray-400">
                                            {inv.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{inv.name}</p>
                                            <p className="text-xs text-gray-500">{inv.firm}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 text-xs text-gray-400">{inv.deal}</td>
                                <td className="px-4 py-4">
                                    <span className={stageConfig[inv.stage]?.class}>{stageConfig[inv.stage]?.label}</span>
                                </td>
                                <td className="text-right px-4 py-4">
                                    <span className={`text-sm font-bold font-mono ${inv.score >= 80 ? 'text-emerald-400' : inv.score >= 60 ? 'text-cyan-400' : 'text-gray-500'}`}>{inv.score}</span>
                                </td>
                                <td className="text-right px-4 py-4">
                                    {inv.commitAmount > 0 ? (
                                        <span className="text-sm font-mono text-emerald-400">${(inv.commitAmount / 1000).toFixed(0)}K</span>
                                    ) : (
                                        <span className="text-xs text-gray-600">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-400 max-w-[200px] truncate">{inv.nextAction}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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

function ExportIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    );
}
