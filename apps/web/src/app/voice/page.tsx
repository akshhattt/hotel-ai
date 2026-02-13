'use client';

import React, { useState } from 'react';

// ─── Mock Data ──────────────────────────────────────────────

const callLog = [
    {
        id: '1',
        investor: 'James Mitchell',
        firm: 'Meridian Family Office',
        deal: 'Marriott Select — Tampa',
        duration: '4:32',
        outcome: 'QUALIFIED',
        score: 92,
        summary: 'Accredited, interested in select-service hotels. Has $2M+ allocation for Q1. Wants deck and call with capital markets.',
        time: '2:45 PM',
        date: 'Today',
    },
    {
        id: '2',
        investor: 'Sarah Chen',
        firm: 'Bluewater Private Equity',
        deal: 'Hilton Garden — Nashville',
        outcome: 'QUALIFIED',
        duration: '6:18',
        score: 87,
        summary: 'LP at PE fund with hotel mandate. Previously invested in Hilton brands. Requesting PPM and financial model.',
        time: '1:12 PM',
        date: 'Today',
    },
    {
        id: '3',
        investor: 'Robert Kim',
        firm: 'Pacific Wealth Partners',
        deal: 'Marriott Select — Tampa',
        outcome: 'NURTURE',
        duration: '3:15',
        score: 61,
        summary: 'Interested but not accredited through traditional means. Exploring QP route. Follow up in 2 weeks.',
        time: '11:30 AM',
        date: 'Today',
    },
    {
        id: '4',
        investor: 'Diana Torres',
        firm: 'Eagle Rock Ventures',
        deal: 'All Deals',
        outcome: 'NOT_INTERESTED',
        duration: '1:45',
        score: 18,
        summary: 'Not currently allocating to hospitality. Focused on industrial. Requested removal from call list.',
        time: '10:05 AM',
        date: 'Today',
    },
    {
        id: '5',
        investor: 'Michael Patel',
        firm: 'Summit Capital Group',
        deal: 'Boutique Independent — Austin',
        outcome: 'CALLBACK',
        duration: '2:08',
        score: 74,
        summary: 'Voicemail reached. AI left personalized message about Austin boutique opportunity. Auto-retry scheduled.',
        time: '9:22 AM',
        date: 'Today',
    },
    {
        id: '6',
        investor: 'Amanda Foster',
        firm: 'Lakewood Family Trust',
        deal: 'Marriott Select — Tampa',
        outcome: 'QUALIFIED',
        duration: '5:42',
        score: 95,
        summary: 'Highly interested, accredited via income. Has invested in 3 Marriott properties before. Wants meeting this week.',
        time: '4:15 PM',
        date: 'Yesterday',
    },
];

const outcomeColors: Record<string, string> = {
    QUALIFIED: 'badge-emerald',
    NURTURE: 'badge-amber',
    CALLBACK: 'badge-brand',
    NOT_INTERESTED: 'badge-rose',
    NO_ANSWER: 'badge bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/20',
};

const scoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-cyan-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-gray-500';
};

export default function VoicePage() {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Voice AI</h1>
                    <p className="text-sm text-gray-500 mt-1">AI-powered investor qualification calls & conversation intelligence</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="badge-emerald">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                        AI Agent Online
                    </span>
                    <button className="btn-primary flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4" />
                        Start Campaign
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Calls Today" value="23" change="+8" trend="up" subtext="Target: 30/day" />
                <MetricCard label="Completion Rate" value="71%" change="+4%" trend="up" subtext="Connected & completed" />
                <MetricCard label="Qualification Rate" value="39%" change="+6%" trend="up" subtext="Of completed calls" />
                <MetricCard label="→ Meetings Booked" value="9" change="+3" trend="up" subtext="From Voice AI today" />
            </div>

            {/* AI Performance Card */}
            <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">AI Agent Performance</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <MiniStat label="Avg Call Duration" value="3:48" />
                    <MiniStat label="Sentiment Score" value="8.2/10" />
                    <MiniStat label="Compliance Score" value="100%" />
                    <MiniStat label="Human Escalations" value="2" />
                    <MiniStat label="Opt-Out Requests" value="1" />
                </div>
            </div>

            {/* Call Log */}
            <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Recent Calls</h3>
                <div className="space-y-3">
                    {callLog.map((call) => (
                        <div
                            key={call.id}
                            className="glass-card-hover overflow-hidden cursor-pointer"
                            onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                        >
                            <div className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${call.outcome === 'QUALIFIED' ? 'bg-emerald-500/15 text-emerald-400' : call.outcome === 'NURTURE' ? 'bg-amber-500/15 text-amber-400' : 'bg-surface-3 text-gray-400'}`}>
                                        {call.investor.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white">{call.investor}</p>
                                        <p className="text-xs text-gray-500">{call.firm} · {call.deal}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className={`text-sm font-bold font-mono ${scoreColor(call.score)}`}>{call.score}</span>
                                    <span className={outcomeColors[call.outcome]}>{call.outcome.replace('_', ' ')}</span>
                                    <span className="text-xs text-gray-500 w-16 text-right">{call.duration}</span>
                                    <span className="text-xs text-gray-600 w-20 text-right">{call.time}</span>
                                    <ChevronIcon className={`w-4 h-4 text-gray-500 transition-transform ${expandedId === call.id ? 'rotate-180' : ''}`} />
                                </div>
                            </div>
                            {expandedId === call.id && (
                                <div className="px-6 pb-4 pt-0 border-t border-white/5 mt-0">
                                    <div className="bg-surface-3/50 rounded-xl p-4 mt-3">
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Summary</p>
                                        <p className="text-sm text-gray-300 leading-relaxed">{call.summary}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
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

function MiniStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-surface-3/50 rounded-xl px-4 py-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    );
}

function PhoneIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
    );
}

function ChevronIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
    );
}
