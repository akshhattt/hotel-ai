'use client';

import React from 'react';

const deals = [
    {
        id: '1',
        name: 'Hampton Inn & Suites — Kahului, HI',
        property: '142-room select-service hotel',
        city: 'Kahului',
        state: 'HI',
        status: 'RAISING',
        totalRaise: 8500000,
        raised: 6630000,
        progress: 78,
        targetIRR: 18.5,
        equityMultiple: 2.1,
        holdPeriod: 48,
        minimumInvestment: 100000,
        investors: { identified: 89, contacted: 67, qualified: 28, meetings: 12, softCommit: 8, hardCommit: 5, funded: 3 },
        raiseStart: '2026-01-03',
        targetClose: '2026-03-01',
        daysRemaining: 12,
    },
    {
        id: '2',
        name: 'Hilton Garden Inn — Phoenix, AZ',
        property: '198-room full-service hotel',
        city: 'Phoenix',
        state: 'AZ',
        status: 'RAISING',
        totalRaise: 12000000,
        raised: 5040000,
        progress: 42,
        targetIRR: 16.2,
        equityMultiple: 1.9,
        holdPeriod: 60,
        minimumInvestment: 250000,
        investors: { identified: 134, contacted: 98, qualified: 41, meetings: 18, softCommit: 6, hardCommit: 3, funded: 2 },
        raiseStart: '2026-01-15',
        targetClose: '2026-03-15',
        daysRemaining: 34,
    },
    {
        id: '3',
        name: 'Home2 Suites — Sacramento, CA',
        property: '120-room extended-stay hotel',
        city: 'Sacramento',
        state: 'CA',
        status: 'RAISING',
        totalRaise: 6000000,
        raised: 1080000,
        progress: 18,
        targetIRR: 22.0,
        equityMultiple: 2.5,
        holdPeriod: 36,
        minimumInvestment: 50000,
        investors: { identified: 56, contacted: 31, qualified: 12, meetings: 4, softCommit: 2, hardCommit: 1, funded: 0 },
        raiseStart: '2026-02-01',
        targetClose: '2026-04-01',
        daysRemaining: 52,
    },
];

export default function DealsPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Deal Pipeline</h1>
                    <p className="text-sm text-gray-500 mt-1">Active raises and investor pipeline by deal</p>
                </div>
                <button className="btn-primary">+ New Deal</button>
            </div>

            {/* Deal Summary Bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="metric-card">
                    <p className="stat-label mb-1">Active Raises</p>
                    <p className="stat-value">3</p>
                </div>
                <div className="metric-card">
                    <p className="stat-label mb-1">Total Capital Target</p>
                    <p className="stat-value">$26.5M</p>
                </div>
                <div className="metric-card">
                    <p className="stat-label mb-1">Total Raised</p>
                    <p className="stat-value">$12.75M</p>
                    <p className="text-xs text-gray-500 mt-1">48% of target</p>
                </div>
            </div>

            {/* Deal Cards */}
            <div className="space-y-6">
                {deals.map((deal) => (
                    <div key={deal.id} className="glass-card p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white">{deal.name}</h2>
                                <p className="text-sm text-gray-500">{deal.property} • {deal.city}, {deal.state}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="badge-emerald">{deal.status}</span>
                                <span className="badge-brand">{deal.daysRemaining}d remaining</span>
                            </div>
                        </div>

                        {/* Financials */}
                        <div className="grid grid-cols-5 gap-4">
                            <div className="bg-surface-3/50 rounded-xl px-4 py-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Raise</p>
                                <p className="text-base font-bold text-white">${(deal.totalRaise / 1000000).toFixed(1)}M</p>
                            </div>
                            <div className="bg-surface-3/50 rounded-xl px-4 py-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Raised</p>
                                <p className="text-base font-bold text-emerald-400">${(deal.raised / 1000000).toFixed(1)}M</p>
                            </div>
                            <div className="bg-surface-3/50 rounded-xl px-4 py-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Target IRR</p>
                                <p className="text-base font-bold text-white">{deal.targetIRR}%</p>
                            </div>
                            <div className="bg-surface-3/50 rounded-xl px-4 py-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Equity Multiple</p>
                                <p className="text-base font-bold text-white">{deal.equityMultiple}x</p>
                            </div>
                            <div className="bg-surface-3/50 rounded-xl px-4 py-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Min Investment</p>
                                <p className="text-base font-bold text-white">${(deal.minimumInvestment / 1000).toFixed(0)}K</p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">Raise Progress</span>
                                <span className="font-mono font-bold text-white">{deal.progress}%</span>
                            </div>
                            <div className="progress-bar h-3">
                                <div
                                    className="progress-fill bg-gradient-to-r from-brand-500 to-accent-emerald"
                                    style={{ width: `${deal.progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Investor Pipeline Funnel */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Investor Pipeline</h4>
                            <div className="flex items-center gap-1">
                                {Object.entries(deal.investors).map(([stage, count], i, arr) => {
                                    const colors = ['#4c6ef5', '#748ffc', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ef4444'];
                                    const labels = ['Identified', 'Contacted', 'Qualified', 'Meetings', 'Soft Commit', 'Hard Commit', 'Funded'];
                                    return (
                                        <React.Fragment key={stage}>
                                            <div className="flex-1 text-center">
                                                <div
                                                    className="rounded-lg py-2 px-1 mb-1"
                                                    style={{ backgroundColor: `${colors[i]}15`, border: `1px solid ${colors[i]}30` }}
                                                >
                                                    <p className="text-lg font-bold" style={{ color: colors[i] }}>{count}</p>
                                                </div>
                                                <p className="text-[9px] text-gray-500 uppercase">{labels[i]}</p>
                                            </div>
                                            {i < arr.length - 1 && (
                                                <div className="text-gray-600 text-xs">→</div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
