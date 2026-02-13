'use client';

import React, { useState } from 'react';

// ─── Mock Data ──────────────────────────────────────────────

const campaigns = [
    {
        id: '1',
        name: 'Marriott Select Tampa — HNW Sequence',
        deal: 'Marriott Select — Tampa',
        status: 'ACTIVE',
        type: 'Email',
        sent: 842,
        opened: 378,
        replied: 67,
        meetings: 18,
        lastActivity: '2 hrs ago',
    },
    {
        id: '2',
        name: 'Nashville Hilton — Family Office Intro',
        deal: 'Hilton Garden — Nashville',
        status: 'ACTIVE',
        type: 'Email',
        sent: 534,
        opened: 241,
        replied: 48,
        meetings: 12,
        lastActivity: '45 min ago',
    },
    {
        id: '3',
        name: 'Q1 2026 — RE LP Re-engagement',
        deal: 'All Deals',
        status: 'ACTIVE',
        type: 'Email',
        sent: 1024,
        opened: 341,
        replied: 77,
        meetings: 18,
        lastActivity: '1 hr ago',
    },
    {
        id: '4',
        name: 'Austin Boutique — Accredited Investor',
        deal: 'Boutique Independent — Austin',
        status: 'PAUSED',
        type: 'Email',
        sent: 212,
        opened: 89,
        replied: 14,
        meetings: 3,
        lastActivity: '3 days ago',
    },
    {
        id: '5',
        name: 'DST 1031 Exchange — Tax Season Push',
        deal: 'All Deals',
        status: 'DRAFT',
        type: 'Email',
        sent: 0,
        opened: 0,
        replied: 0,
        meetings: 0,
        lastActivity: 'Not started',
    },
];

const recentEmails = [
    { to: 'j.mitchell@meridianfamily.com', subject: 'Exclusive: Tampa Select-Service Opportunity', status: 'Opened', time: '2:15 PM' },
    { to: 'sarah.chen@bluewaterpe.com', subject: 'Re: Nashville Hilton Garden Investment Deck', status: 'Replied', time: '1:42 PM' },
    { to: 'r.davidson@highbridgecap.com', subject: 'Peachtree Group — Q1 Hotel Portfolio Update', status: 'Sent', time: '12:30 PM' },
    { to: 'alex.kumar@pinewealthmgmt.com', subject: 'Meeting Confirmed: Marriott Tampa Call', status: 'Replied', time: '11:18 AM' },
    { to: 'lisa.park@summitfamilyoffice.com', subject: 'Tax-Advantaged Hotel Investment (1031/DST)', status: 'Opened', time: '10:05 AM' },
    { to: 'w.torres@eaglerockventures.com', subject: 'Follow-up: Nashville Hotel Development', status: 'Bounced', time: '9:30 AM' },
];

const statusColors: Record<string, string> = {
    ACTIVE: 'badge-emerald',
    PAUSED: 'badge-amber',
    DRAFT: 'badge bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/20',
    COMPLETED: 'badge-brand',
};

const emailStatusColors: Record<string, string> = {
    Sent: 'text-gray-400',
    Opened: 'text-cyan-400',
    Replied: 'text-emerald-400',
    Bounced: 'text-rose-400',
};

export default function OutreachPage() {
    const [tab, setTab] = useState<'campaigns' | 'activity'>('campaigns');

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Email Outreach</h1>
                    <p className="text-sm text-gray-500 mt-1">Automated investor email sequences & campaign management</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" />
                    New Campaign
                </button>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Sent (30d)" value="2,612" change="+18%" trend="up" subtext="Across 5 campaigns" />
                <MetricCard label="Open Rate" value="40.2%" change="+3.1%" trend="up" subtext="Industry avg: 21%" />
                <MetricCard label="Reply Rate" value="8.1%" change="+1.2%" trend="up" subtext="Target: >5%" />
                <MetricCard label="Meetings Booked" value="51" change="+28%" trend="up" subtext="From email channel" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-surface-2/50 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab('campaigns')}
                    className={tab === 'campaigns'
                        ? 'px-4 py-2 rounded-lg text-sm font-medium bg-brand-600/20 text-white border border-brand-500/20'
                        : 'px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors'
                    }
                >
                    Campaigns
                </button>
                <button
                    onClick={() => setTab('activity')}
                    className={tab === 'activity'
                        ? 'px-4 py-2 rounded-lg text-sm font-medium bg-brand-600/20 text-white border border-brand-500/20'
                        : 'px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors'
                    }
                >
                    Recent Activity
                </button>
            </div>

            {tab === 'campaigns' ? (
                /* Campaigns Table */
                <div className="glass-card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Campaign</th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">Status</th>
                                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">Sent</th>
                                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">Opened</th>
                                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">Replied</th>
                                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-4">Meetings</th>
                                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-4">Last Activity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((c) => (
                                <tr key={c.id} className="table-row">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-medium text-white">{c.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{c.deal}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={statusColors[c.status]}>{c.status}</span>
                                    </td>
                                    <td className="text-right px-4 py-4 text-sm font-mono text-gray-300">{c.sent.toLocaleString()}</td>
                                    <td className="text-right px-4 py-4">
                                        <span className="text-sm font-mono text-gray-300">{c.opened.toLocaleString()}</span>
                                        {c.sent > 0 && <span className="text-xs text-gray-500 ml-1">({((c.opened / c.sent) * 100).toFixed(0)}%)</span>}
                                    </td>
                                    <td className="text-right px-4 py-4">
                                        <span className="text-sm font-mono text-gray-300">{c.replied.toLocaleString()}</span>
                                        {c.sent > 0 && <span className="text-xs text-gray-500 ml-1">({((c.replied / c.sent) * 100).toFixed(1)}%)</span>}
                                    </td>
                                    <td className="text-right px-4 py-4 text-sm font-mono text-emerald-400">{c.meetings}</td>
                                    <td className="text-right px-6 py-4 text-xs text-gray-500">{c.lastActivity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Recent Activity */
                <div className="glass-card divide-y divide-white/5">
                    {recentEmails.map((e, i) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-surface-3/30 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{e.subject}</p>
                                <p className="text-xs text-gray-500 mt-0.5">To: {e.to}</p>
                            </div>
                            <div className="flex items-center gap-4 ml-4">
                                <span className={`text-xs font-medium ${emailStatusColors[e.status]}`}>{e.status}</span>
                                <span className="text-xs text-gray-600 w-16 text-right">{e.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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

function PlusIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
    );
}
