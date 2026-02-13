'use client';

import React, { useState } from 'react';

const investors = [
    { id: '1', name: 'Robert Chen', company: 'Pacific Coast Capital', email: 'rchen@pcc.com', score: 92, tier: 'A+', accredited: 'THIRD_PARTY_VERIFIED', checkSize: '$500K-$1M', geography: 'West Coast', experience: 'ACTIVE_LP', priorDeals: 4, status: 'MEETING_COMPLETED', activeDeal: 'Hampton Inn & Suites — Kahului, HI' },
    { id: '2', name: 'Sarah Mitchell', company: 'Greenfield Family Office', email: 'smitchell@gfo.com', score: 87, tier: 'A+', accredited: 'INSTITUTIONAL', checkSize: '$1M-$2.5M', geography: 'Southeast', experience: 'PASSIVE_LP', priorDeals: 2, status: 'SOFT_COMMIT', activeDeal: 'Hilton Garden Inn — Phoenix, AZ' },
    { id: '3', name: 'James Park', company: 'Park Hospitality Group', email: 'jpark@phg.com', score: 81, tier: 'A', accredited: 'SELF_CERTIFIED', checkSize: '$250K-$500K', geography: 'Sun Belt', experience: 'OPERATOR', priorDeals: 8, status: 'QUALIFIED', activeDeal: 'Home2 Suites — Sacramento, CA' },
    { id: '4', name: 'Michelle Torres', company: 'Torres Capital Partners', email: 'mt@tcp.com', score: 74, tier: 'A', accredited: 'THIRD_PARTY_VERIFIED', checkSize: '$500K-$1M', geography: 'National', experience: 'ACTIVE_LP', priorDeals: 3, status: 'MEETING_SCHEDULED', activeDeal: 'Hampton Inn & Suites — Kahului, HI' },
    { id: '5', name: 'David Wong', company: 'Wong Investments LLC', email: 'dwong@wi.com', score: 68, tier: 'B', accredited: 'SELF_CERTIFIED', checkSize: '$100K-$250K', geography: 'West Coast', experience: 'PASSIVE_LP', priorDeals: 1, status: 'ENGAGED', activeDeal: 'Hilton Garden Inn — Phoenix, AZ' },
    { id: '6', name: 'Lisa Carpenter', company: 'Carpenter REIT Advisory', email: 'lc@cra.com', score: 62, tier: 'B', accredited: 'UNVERIFIED', checkSize: '$250K-$500K', geography: 'Midwest', experience: 'NONE', priorDeals: 0, status: 'CONTACTED', activeDeal: 'Home2 Suites — Sacramento, CA' },
    { id: '7', name: 'Andrew Steele', company: 'Steele Ventures', email: 'as@sv.com', score: 55, tier: 'B', accredited: 'SELF_CERTIFIED', checkSize: '$100K-$250K', geography: 'Northeast', experience: 'PASSIVE_LP', priorDeals: 1, status: 'ENGAGED', activeDeal: 'Hampton Inn & Suites — Kahului, HI' },
    { id: '8', name: 'Karen Williams', company: 'Williams Family Trust', email: 'kw@wft.com', score: 41, tier: 'C', accredited: 'UNVERIFIED', checkSize: '$50K-$100K', geography: 'Southeast', experience: 'NONE', priorDeals: 0, status: 'IDENTIFIED', activeDeal: '-' },
];

const statusColors: Record<string, string> = {
    IDENTIFIED: 'badge bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/20',
    CONTACTED: 'badge bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20',
    ENGAGED: 'badge bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/20',
    QUALIFIED: 'badge bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/20',
    MEETING_SCHEDULED: 'badge bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20',
    MEETING_COMPLETED: 'badge bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
    SOFT_COMMIT: 'badge bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20',
    HARD_COMMIT: 'badge bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/20',
    FUNDED: 'badge bg-green-500/15 text-green-400 ring-1 ring-green-500/20',
};

const tierColors: Record<string, string> = {
    'A+': 'text-emerald-400',
    'A': 'text-cyan-400',
    'B': 'text-amber-400',
    'C': 'text-gray-500',
    'D': 'text-gray-600',
};

export default function InvestorsPage() {
    const [search, setSearch] = useState('');
    const [filterTier, setFilterTier] = useState('all');

    const filtered = investors.filter((inv) => {
        const matchSearch = !search || inv.name.toLowerCase().includes(search.toLowerCase()) ||
            inv.company.toLowerCase().includes(search.toLowerCase());
        const matchTier = filterTier === 'all' || inv.tier === filterTier;
        return matchSearch && matchTier;
    });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Investor CRM</h1>
                    <p className="text-sm text-gray-500 mt-1">Scored, qualified, and tracked LP database</p>
                </div>
                <button className="btn-primary">+ Add Investor</button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    placeholder="Search investors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-surface-3 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 w-80 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <div className="flex gap-1">
                    {['all', 'A+', 'A', 'B', 'C'].map((tier) => (
                        <button
                            key={tier}
                            onClick={() => setFilterTier(tier)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterTier === tier
                                ? 'bg-brand-600 text-white'
                                : 'bg-surface-3 text-gray-400 hover:text-white'
                                }`}
                        >
                            {tier === 'all' ? 'All' : tier}
                        </button>
                    ))}
                </div>
                <span className="text-xs text-gray-500 ml-auto">{filtered.length} investors</span>
            </div>

            {/* Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3">Investor</th>
                            <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3">Score</th>
                            <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3">Accredited</th>
                            <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3">Check Size</th>
                            <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3">Experience</th>
                            <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                            <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider px-5 py-3">Deal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((inv) => (
                            <tr key={inv.id} className="table-row cursor-pointer">
                                <td className="px-5 py-3.5">
                                    <div>
                                        <p className="text-sm font-medium text-white">{inv.name}</p>
                                        <p className="text-xs text-gray-500">{inv.company}</p>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm font-bold ${tierColors[inv.tier]}`}>{inv.score}</span>
                                        <span className={`text-[10px] font-bold ${tierColors[inv.tier]}`}>{inv.tier}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5">
                                    <AccreditedBadge status={inv.accredited} />
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className="text-sm text-gray-300">{inv.checkSize}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className="text-sm text-gray-400">{inv.experience.replace('_', ' ')}</span>
                                    {inv.priorDeals > 0 && (
                                        <span className="text-xs text-gray-600 ml-1">({inv.priorDeals} deals)</span>
                                    )}
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className={statusColors[inv.status] || 'badge'}>
                                        {inv.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className="text-xs text-gray-400">{inv.activeDeal}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function AccreditedBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; class: string }> = {
        THIRD_PARTY_VERIFIED: { label: 'Verified', class: 'badge-emerald' },
        INSTITUTIONAL: { label: 'Institutional', class: 'badge-brand' },
        SELF_CERTIFIED: { label: 'Self-Certified', class: 'badge-amber' },
        UNVERIFIED: { label: 'Unverified', class: 'badge bg-gray-500/15 text-gray-400 ring-1 ring-gray-500/20' },
        NOT_ACCREDITED: { label: 'Not Accredited', class: 'badge-rose' },
    };

    const info = map[status] || map.UNVERIFIED;
    return <span className={info.class}>{info.label}</span>;
}
